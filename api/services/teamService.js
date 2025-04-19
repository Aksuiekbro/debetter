const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const User = require('../models/User');

class TeamService {

  // Validates if users are valid participants for a team
  async validateTeamMembers(debate, leaderId, speakerId) {
    // Ensure debate has populated participants
    if (!debate.participants || !Array.isArray(debate.participants)) {
      throw new Error('Invalid participant structure in tournament');
    }

    // Find the participants
    const leaderParticipant = debate.participants.find(p => p._id.toString() === leaderId.toString());
    const speakerParticipant = debate.participants.find(p => p._id.toString() === speakerId.toString());

    // Check if both members exist and are not judges or organizers
    if (!leaderParticipant || !speakerParticipant) {
      throw new Error('One or both team members are not participants in this tournament');
    }

    if (leaderParticipant.role === 'judge' || speakerParticipant.role === 'judge' ||
        leaderParticipant.role === 'organizer' || speakerParticipant.role === 'organizer') {
      throw new Error('Judges and organizers cannot be assigned to debate teams');
    }

    // Check if either member is already in another team
    const existingTeams = debate.teams || [];
    const isLeaderInTeam = existingTeams.some(team =>
      team.members.some(member => member.userId.toString() === leaderId.toString())
    );
    const isSpeakerInTeam = existingTeams.some(team =>
      team.members.some(member => member.userId.toString() === speakerId.toString())
    );

    if (isLeaderInTeam || isSpeakerInTeam) {
      throw new Error('One or both team members are already assigned to another team');
    }
  }

  // Creates a new team within a tournament
  async createTeam(tournamentId, teamData) {
    const { name, leader, speaker, club, city, institution } = teamData;
    const debate = await Debate.findById(tournamentId).populate('participants');
    if (!debate) throw new Error('Tournament not found');
    if (debate.format !== 'tournament') throw new Error('Debate is not a tournament');

    await this.validateTeamMembers(debate, leader, speaker);

    const newTeam = {
      _id: new mongoose.Types.ObjectId(), // Generate new ID for the subdocument
      name,
      members: [
        { userId: leader, role: 'leader' },
        { userId: speaker, role: 'speaker' }
      ],
      club: club || '',
      city: city || '',
      institution: institution || '',
      isPresent: false,
      wins: 0,
      losses: 0,
      points: 0
    };

    if (!debate.teams) {
      debate.teams = [];
    }
    debate.teams.push(newTeam);
    await debate.save();

    // Return the newly created team subdocument
    // Need to find it again as push doesn't return the added object with defaults applied
    const savedDebate = await Debate.findById(tournamentId).select('teams').lean();
    const createdTeam = savedDebate.teams.find(t => t._id.equals(newTeam._id));

    return createdTeam;
  }

  // Updates an existing team in a tournament
  async updateTeam(tournamentId, teamId, teamUpdateData) {
    const { name, leader, speaker, club, city, institution, isPresent } = teamUpdateData;
    const debate = await Debate.findById(tournamentId).populate('participants');
    if (!debate) throw new Error('Tournament not found');
    if (!debate.teams || !Array.isArray(debate.teams)) throw new Error('Tournament has no teams');

    const teamIndex = debate.teams.findIndex(team => team._id.toString() === teamId);
    if (teamIndex === -1) throw new Error('Team not found in tournament');

    await this.validateTeamMembers(debate, leader, speaker);

    // Update team details, preserving stats
    const existingTeam = debate.teams[teamIndex];
    debate.teams[teamIndex] = {
      ...existingTeam.toObject(), // Convert subdocument to plain object if needed
      name: name,
      members: [
        { userId: leader, role: 'leader' },
        { userId: speaker, role: 'speaker' }
      ],
      club: club !== undefined ? club : existingTeam.club || '',
      city: city !== undefined ? city : existingTeam.city || '',
      institution: institution !== undefined ? institution : existingTeam.institution || '',
      // Update presence status if provided, otherwise keep existing
      isPresent: isPresent !== undefined ? isPresent : existingTeam.isPresent || false,
      // If marking as present and wasn't before, add timestamp
      checkedInAt: isPresent && !existingTeam.isPresent ? new Date() : existingTeam.checkedInAt,
      // Preserve existing stats explicitly
      wins: existingTeam.wins || 0,
      losses: existingTeam.losses || 0,
      points: existingTeam.points || 0
    };

    debate.markModified('teams'); // Important for updating nested arrays
    await debate.save();

    // Return the updated team subdocument
    return debate.teams[teamIndex];
  }

  // Randomizes teams based on tournament participants
  async randomizeTeams(tournamentId) {
      const debate = await Debate.findById(tournamentId).populate('participants');
      if (!debate) throw new Error('Tournament not found');
      if (debate.format !== 'tournament') throw new Error('Not a tournament');

      // Filter out judges and organizers, only get regular debaters
      const debaters = debate.participants.filter(p => p.role !== 'judge' && p.role !== 'organizer');
      if (debaters.length < 2) throw new Error('Not enough debaters to randomize teams');

      const shuffledDebaters = [...debaters].sort(() => Math.random() - 0.5);
      const newTeams = [];

      // Clear existing teams first
      debate.teams = [];

      for (let i = 0; i < shuffledDebaters.length; i += 2) {
          if (i + 1 >= shuffledDebaters.length) break; // Skip last one if odd number

          const leader = shuffledDebaters[i];
          const speaker = shuffledDebaters[i + 1];

          // Double check that neither is a judge or organizer
          if (leader.role === 'judge' || speaker.role === 'judge' ||
              leader.role === 'organizer' || speaker.role === 'organizer') {
            console.error('Attempted to create team with invalid role:', { leader, speaker });
            continue; // Skip this pair and move to next
          }

          // Try to get club/city/institution from user profiles
          const leaderUser = await User.findById(leader._id).lean();
          const speakerUser = await User.findById(speaker._id).lean();

          newTeams.push({
              _id: new mongoose.Types.ObjectId(),
              name: `Team ${Math.floor(i / 2) + 1}`,
              members: [
                  { userId: leader._id, role: 'leader' },
                  { userId: speaker._id, role: 'speaker' }
              ],
              // Use club from leader if available
              club: leaderUser?.club || '',
              // Use city from leader if available
              city: leaderUser?.city || '',
              // Use institution from leader if available
              institution: leaderUser?.institution || '',
              isPresent: false,
              wins: 0, losses: 0, points: 0 // Initialize stats
          });
      }

      debate.teams = newTeams; // Replace existing teams
      await debate.save();

      // Return the updated debate or just the teams array
      const savedDebate = await Debate.findById(tournamentId)
                                      .populate('teams.members.userId', 'username')
                                      .lean();
      return savedDebate; // Return the whole debate object with populated teams
  }


  // Gets all teams for a specific tournament, populating member details
  async getTeamsForDebate(tournamentId) {
    const debate = await Debate.findById(tournamentId)
                               .populate({
                                 path: 'teams.members.userId',
                                 select: 'username _id email club city institution' // Include additional fields
                               })
                               .populate('teams.checkedInBy', 'username _id') // Populate check-in user
                               .lean(); // Use lean for performance if only reading

    if (!debate) throw new Error('Tournament not found');
    if (debate.format !== 'tournament') throw new Error('Debate is not a tournament');

    return debate.teams || []; // Return teams array or empty array if none
  }

  // Deletes a team from a tournament
  async deleteTeam(tournamentId, teamId) {
    const debate = await Debate.findById(tournamentId);
    if (!debate) throw new Error('Tournament not found');
    if (debate.format !== 'tournament') throw new Error('Debate is not a tournament');
    if (!debate.teams || debate.teams.length === 0) throw new Error('Tournament has no teams to delete');

    const teamIndex = debate.teams.findIndex(team => team._id.toString() === teamId);
    if (teamIndex === -1) throw new Error('Team not found in tournament');

    // TODO: Add validation - check if team is involved in any postings before deleting?

    debate.teams.splice(teamIndex, 1); // Remove the team
    debate.markModified('teams'); // Mark the array as modified
    await debate.save();

    return { success: true, message: 'Team deleted successfully' };
  }

  // Check in a team (mark as present)
  async checkInTeam(tournamentId, teamId, userId) {
    const debate = await Debate.findById(tournamentId);
    if (!debate) throw new Error('Tournament not found');
    if (!debate.teams || !Array.isArray(debate.teams)) throw new Error('Tournament has no teams');

    const teamIndex = debate.teams.findIndex(team => team._id.toString() === teamId);
    if (teamIndex === -1) throw new Error('Team not found in tournament');

    // Update team presence status
    debate.teams[teamIndex].isPresent = true;
    debate.teams[teamIndex].checkedInAt = new Date();
    debate.teams[teamIndex].checkedInBy = userId;

    debate.markModified('teams'); // Important for updating nested arrays
    await debate.save();

    return debate.teams[teamIndex];
  }

  // Check out a team (mark as not present)
  async checkOutTeam(tournamentId, teamId) {
    const debate = await Debate.findById(tournamentId);
    if (!debate) throw new Error('Tournament not found');
    if (!debate.teams || !Array.isArray(debate.teams)) throw new Error('Tournament has no teams');

    const teamIndex = debate.teams.findIndex(team => team._id.toString() === teamId);
    if (teamIndex === -1) throw new Error('Team not found in tournament');

    // Update team presence status
    debate.teams[teamIndex].isPresent = false;
    debate.teams[teamIndex].checkedInAt = null;
    // We keep the checkedInBy field for audit purposes

    debate.markModified('teams'); // Important for updating nested arrays
    await debate.save();

    return debate.teams[teamIndex];
  }
}

module.exports = new TeamService();