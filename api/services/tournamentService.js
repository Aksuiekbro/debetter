const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const User = require('../models/User');
// Import other services if needed

// Helper function (can be kept here or moved to utils)
const initializeTournamentRounds = (numParticipants = 32) => {
  const rounds = [];
  const numRounds = Math.ceil(Math.log2(numParticipants));
  const totalSlots = Math.pow(2, numRounds);

  // Create rounds structure
  for (let i = 0; i < numRounds; i++) {
    const numMatchesInRound = Math.pow(2, numRounds - (i + 1));
    const matches = [];
    for (let j = 0; j < numMatchesInRound; j++) {
      matches.push({
        round: i + 1,
        matchNumber: j + 1,
        team1: null, // Use team IDs later
        team2: null,
        winner: null,
        judges: [],
        status: 'pending', // pending, scheduled, in_progress, completed
        completed: false,
      });
    }
    rounds.push({
      roundNumber: i + 1,
      matches: matches,
    });
  }
  return rounds;
};


class TournamentService {

  // Validates tournament creation parameters
  validateTournamentCreation(startDate, registrationDeadline) {
    const now = new Date();
    const tournamentStart = new Date(startDate);
    const regDeadline = new Date(registrationDeadline);

    // Ensure 48 hours notice
    if (tournamentStart - now < 48 * 60 * 60 * 1000) {
      throw new Error('Tournaments must be scheduled at least 48 hours in advance');
    }
    // Validate registration deadline relative to start
    if (regDeadline >= tournamentStart) {
      throw new Error('Registration deadline must be before tournament start');
    }
    // Ensure registration closes 24h before start
    if (tournamentStart - regDeadline < 24 * 60 * 60 * 1000) {
      throw new Error('Registration must close at least 24 hours before tournament start');
    }
  }

  // Prepares data for creating a tournament debate
  prepareTournamentData(debateInput, creator) {
     const data = {
       ...debateInput, // Includes title, description, category, etc.
       format: 'tournament',
       creator: creator._id,
       status: 'upcoming',
       participants: [{ // Creator automatically joins as Organizer
         userId: creator._id,
         tournamentRole: 'Organizer' // Assign a default role for the creator
       }],
       tournamentRounds: initializeTournamentRounds(32), // Assuming 32 participants default
       maxParticipants: 32, // Deprecated? Use tournamentSettings
       maxJudges: 8,        // Deprecated? Use tournamentSettings
       tournamentSettings: {
         maxDebaters: 32,
         maxJudges: 8,
         currentDebaters: creator.role === 'judge' ? 0 : 1,
         currentJudges: creator.role === 'judge' ? 1 : 0,
       },
       teams: [],
       postings: [],
       // Explicitly add the new fields from the input
       tournamentFormats: debateInput.tournamentFormats,
       eligibilityCriteria: debateInput.eligibilityCriteria,
       registrationDeadline: debateInput.registrationDeadline,
     };
     return data;
  }

  // Validates if a user can join a tournament
  async validateJoinTournament(debateId, userId) {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new Error('Debate not found');
    if (debate.format !== 'tournament') throw new Error('Not a tournament debate');

    // Check if registration is open (status and deadline)
    if (debate.status !== 'upcoming') {
        throw new Error('Cannot join a tournament that has already started or ended');
    }
    if (debate.registrationDeadline && new Date() > new Date(debate.registrationDeadline)) {
        throw new Error('Registration deadline has passed');
    }

    // Check if user is already a participant
    if (debate.participants.some(p => p._id.toString() === userId.toString())) {
      throw new Error('Already a participant');
    }

    // Check participant limits
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const counts = debate.getParticipantCounts(); // Use model method
    if (user.role === 'judge' && counts.judges >= counts.maxJudges) {
      throw new Error('Maximum judges reached');
    }
    if (user.role !== 'judge' && counts.debaters >= counts.maxDebaters) {
      throw new Error('Maximum debaters reached');
    }

    return { debate, user }; // Return fetched objects for use in join logic
  }

  // Adds a participant to the tournament
  async addParticipant(debate, user) {
      // Determine the tournament role based on the user's main role
      // TODO: Allow specifying role during join if needed (e.g., Observer)
      const tournamentRole = user.role === 'judge' ? 'Judge' : 'Debater';
      debate.participants.push({
        userId: user._id,
        tournamentRole: tournamentRole,
        // teamId: null // Team is assigned later
      });

      // Update counters
      if (user.role === 'judge') {
        debate.tournamentSettings.currentJudges = (debate.tournamentSettings.currentJudges || 0) + 1;
      } else {
        debate.tournamentSettings.currentDebaters = (debate.tournamentSettings.currentDebaters || 0) + 1;
      }

      // TODO: Check if tournament is ready to start (maybe move this logic)
      // if (debate.validateTournamentStart()) {
      //   debate.initializeTournamentBracket();
      // }

      await debate.save();
      // Return updated counts or the debate object
      const updatedCounts = debate.getParticipantCounts();
      return { ...updatedCounts, debateId: debate._id };
  }

  // Removes a participant from the tournament
  async removeParticipant(debateId, userId) {
      const debate = await Debate.findById(debateId);
      if (!debate) throw new Error('Debate not found');

      const participantIndex = debate.participants.findIndex(p => p._id.toString() === userId.toString());
      if (participantIndex === -1) {
          throw new Error('User is not a participant');
      }

      const participant = debate.participants[participantIndex];

      // Remove participant
      debate.participants.splice(participantIndex, 1);

      // Update counters
      if (participant.role === 'judge') {
        debate.tournamentSettings.currentJudges = Math.max(0, (debate.tournamentSettings.currentJudges || 0) - 1);
      } else {
        debate.tournamentSettings.currentDebaters = Math.max(0, (debate.tournamentSettings.currentDebaters || 0) - 1);
      }

      await debate.save();
      const updatedCounts = debate.getParticipantCounts();
      return { ...updatedCounts, debateId: debate._id };
  }

  // Registers multiple participants (judges and debaters)
  async registerParticipants(debateId, judgeIds = [], debaterIds = []) {
      const debate = await Debate.findById(debateId);
      if (!debate) throw new Error('Tournament not found');
      if (debate.format !== 'tournament') throw new Error('Not a tournament debate');

      const currentParticipants = debate.participants || [];
      const currentParticipantIds = currentParticipants.map(p => p._id.toString());
      const counts = debate.getParticipantCounts();

      const addedJudges = [];
      const addedDebaters = [];

      // Add judges
      let judgesToAdd = counts.maxJudges - counts.judges;
      for (const judgeId of judgeIds) {
          if (judgesToAdd <= 0) break;
          if (!currentParticipantIds.includes(judgeId)) {
              const user = await User.findById(judgeId);
              if (user) {
                  currentParticipants.push({ userId: user._id, tournamentRole: 'Judge' /* teamId: null */ });
                  currentParticipantIds.push(judgeId); // Add to check list
                  addedJudges.push(user._id);
                  judgesToAdd--;
              }
          }
      }

      // Add debaters
      let debatersToAdd = counts.maxDebaters - counts.debaters;
      for (const debaterId of debaterIds) {
          if (debatersToAdd <= 0) break;
          if (!currentParticipantIds.includes(debaterId)) {
              const user = await User.findById(debaterId);
              if (user) {
                  // Assuming non-judges are Debaters for now
                  currentParticipants.push({ userId: user._id, tournamentRole: 'Debater' /* teamId: null */ });
                  currentParticipantIds.push(debaterId); // Add to check list
                  addedDebaters.push(user._id);
                  debatersToAdd--;
              }
          }
      }

      debate.participants = currentParticipants;
      // Update counters directly
      // Update counters based on the new structure
      debate.tournamentSettings.currentJudges = currentParticipants.filter(p => p.tournamentRole === 'Judge').length;
      debate.tournamentSettings.currentDebaters = currentParticipants.filter(p => p.tournamentRole === 'Debater').length;
      // TODO: Add logic for 'Observer' role if implemented

      await debate.save();

      return {
          debateId: debate._id,
          judgesAdded: addedJudges.length,
          debatersAdded: addedDebaters.length,
          totalJudges: debate.tournamentSettings.currentJudges,
          totalDebaters: debate.tournamentSettings.currentDebaters,
      };
  }


  // Updates details for a specific participant within a tournament
  async updateParticipantDetails(debateId, participantUserId, updateData) {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new Error('Debate not found');
    if (debate.format !== 'tournament') throw new Error('Operation only valid for tournaments');

    // Find the participant subdocument within the array
    const participant = debate.participants.find(p => p.userId.toString() === participantUserId);
    if (!participant) throw new Error('Participant not found in this tournament');

    // Update allowed fields in the participant subdocument
    if (updateData.tournamentRole) {
      // TODO: Add validation for allowed tournament roles ('Debater', 'Judge', 'Observer')
      participant.tournamentRole = updateData.tournamentRole;
    }
    if (updateData.teamId !== undefined) { // Allow setting teamId to null or a valid ID
      // TODO: Add validation to ensure teamId exists within the tournament's teams array if not null
      participant.teamId = updateData.teamId ? new mongoose.Types.ObjectId(updateData.teamId) : null;
    }

    // Optional: Update related User document fields (like phone, club)
    // Consider if this logic is better placed in a dedicated user profile update endpoint.
    if (updateData.phoneNumber || updateData.club) {
        const user = await User.findById(participantUserId);
        if (!user) throw new Error('User associated with participant not found');
        if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;
        if (updateData.club) user.club = updateData.club;
        await user.save();
    }

    // Mark the array as modified before saving the parent document
    debate.markModified('participants');
    await debate.save();

    // Optionally, re-fetch the updated participant with populated data to return
    const updatedDebate = await Debate.findById(debateId)
                                      .populate('participants.userId', 'username email phoneNumber club name role')
                                      .populate('participants.teamId', 'name')
                                      .lean();
    const updatedParticipant = updatedDebate.participants.find(p => p.userId._id.toString() === participantUserId);

    return updatedParticipant; // Return the updated participant object
  }


  // Removes a specific participant from a tournament using $pull
  async removeParticipantFromTournament(debateId, participantUserId) {
    // Validate input IDs
    if (!mongoose.Types.ObjectId.isValid(debateId) || !mongoose.Types.ObjectId.isValid(participantUserId)) {
      throw new Error('Invalid ID format');
    }

    const debate = await Debate.findById(debateId);
    if (!debate) throw new Error('Debate not found');
    if (debate.format !== 'tournament') throw new Error('Operation only valid for tournaments');

    // Find the participant to determine their role for counter updates *before* removing them
    const participantToRemove = debate.participants.find(p => p.userId.toString() === participantUserId);
    if (!participantToRemove) {
        throw new Error('Participant not found in this tournament');
    }
    const role = participantToRemove.tournamentRole; // Get role before removal

    // Use findByIdAndUpdate with $pull to remove the participant
    const updateResult = await Debate.findByIdAndUpdate(
      debateId,
      { $pull: { participants: { userId: new mongoose.Types.ObjectId(participantUserId) } } },
      { new: false } // We don't strictly need the updated doc here, but check result
    );

    // Check if the participant was actually found and pulled
    // Note: findByIdAndUpdate returns the *original* document by default (unless {new: true})
    // We already checked if the participant exists above, so the pull should succeed.
    // If we needed absolute certainty, we could re-fetch and check length, but the check above is sufficient.

    // Update counters after successful removal
    const updatedDebate = await Debate.findById(debateId); // Re-fetch to get current state
    if (!updatedDebate) throw new Error('Debate disappeared after update?'); // Should not happen

    updatedDebate.tournamentSettings.currentJudges = updatedDebate.participants.filter(p => p.tournamentRole === 'Judge').length;
    updatedDebate.tournamentSettings.currentDebaters = updatedDebate.participants.filter(p => p.tournamentRole === 'Debater').length;
    // TODO: Add observer count update if needed

    await updatedDebate.save();

    // No specific return value needed, controller sends success message
    return; 
  }


  // Removes a participant from a tournament (handles counter updates)
  async leaveTournament(debateId, userId) {
    const debate = await Debate.findById(debateId);
    if (!debate) throw new Error('Debate not found');
    if (debate.format !== 'tournament') throw new Error('Not a tournament debate');

    // Check if registration is closed (users might not be allowed to leave after deadline/start)
    // Add similar checks as in validateJoinTournament if needed

    const participantIndex = debate.participants.findIndex(p => p._id.toString() === userId.toString());
    if (participantIndex === -1) {
        throw new Error('User is not a participant in this tournament');
    }

    const participant = debate.participants[participantIndex];

    // Remove participant
    debate.participants.splice(participantIndex, 1);

    // Update counters
    if (participant.role === 'judge') {
      debate.tournamentSettings.currentJudges = Math.max(0, (debate.tournamentSettings.currentJudges || 0) - 1);
    } else {
      debate.tournamentSettings.currentDebaters = Math.max(0, (debate.tournamentSettings.currentDebaters || 0) - 1);
    }

    await debate.save();

    // Return updated counts or the updated debate object if needed
    const updatedCounts = debate.getParticipantCounts();
    // Fetch the updated debate if the full object is required by the controller
    const updatedDebate = await Debate.findById(debateId)
                                      .populate('participants', 'username role')
                                      .populate('creator', 'username role')
                                      .lean(); // Use lean if no further modifications needed

    return { updatedDebate, updatedCounts }; // Return both for flexibility
  }


  // Advances the winner of a match in the tournament bracket
  async advanceWinnerInBracket(debateId, roundNumber, matchNumber, winnerTeamId) {
    const debate = await Debate.findById(debateId).populate('teams.members.userId', 'username'); // Populate user details in teams
    if (!debate) throw new Error('Tournament not found');
    if (!debate.tournamentRounds || debate.tournamentRounds.length === 0) throw new Error('Tournament bracket not initialized');

    // Find the round (adjusting for 0-based index if roundNumber is 1-based)
    const currentRoundIndex = roundNumber - 1;
    const currentRound = debate.tournamentRounds[currentRoundIndex];
    if (!currentRound) throw new Error(`Round ${roundNumber} not found in bracket`);

    // Find the match (adjusting for 0-based index if matchNumber is 1-based)
    const currentMatchIndex = matchNumber - 1;
    const currentMatch = currentRound.matches[currentMatchIndex];
    if (!currentMatch) throw new Error(`Match ${matchNumber} in Round ${roundNumber} not found`);

    // Winner Team ID is passed directly, no need to resolve to User ID here.
    // The bracket should store Team IDs.
    // console.log(`[advanceWinner] Advancing winner: Team ID ${winnerTeamId}`); // Removed debug log

    // Update the current match (optional, could be done elsewhere)
    currentMatch.winner = winnerTeamId; // Store the winning Team ID
    currentMatch.completed = true;

    // Check if it's the final round
    if (currentRoundIndex === debate.tournamentRounds.length - 1) {
      // This was the final match
      // console.log(`[advanceWinner] Final match completed. Tournament Winner Team ID: ${winnerTeamId}`); // Removed debug log
      debate.winner = winnerTeamId; // Set tournament winner (Team ID)
      debate.status = 'completed';
    } else {
      // Advance winner to the next round
      const nextRoundIndex = currentRoundIndex + 1;
      const nextMatchIndex = Math.floor(currentMatchIndex / 2); // 0-based index for next round match

      const nextRound = debate.tournamentRounds[nextRoundIndex];
      if (!nextRound) throw new Error(`Next round (Index ${nextRoundIndex}) not found`);

      const nextMatch = nextRound.matches[nextMatchIndex];
      if (!nextMatch) throw new Error(`Next match (Index ${nextMatchIndex}) in Round ${nextRoundIndex + 1} not found`);

      // Determine if the current match feeds into team1 or team2 slot of the next match
      const isLeftFeeder = currentMatchIndex % 2 === 0;
      if (isLeftFeeder) {
        // console.log(`[advanceWinner] Placing winner Team ID ${winnerTeamId} into Round ${nextRoundIndex + 1}, Match ${nextMatchIndex + 1}, Slot team1`); // Removed debug log
        nextMatch.team1 = winnerTeamId;
      } else {
        // console.log(`[advanceWinner] Placing winner Team ID ${winnerTeamId} into Round ${nextRoundIndex + 1}, Match ${nextMatchIndex + 1}, Slot team2`); // Removed debug log
        nextMatch.team2 = winnerTeamId;
      }
    }

    debate.markModified('tournamentRounds'); // Mark the array as modified
    await debate.save();
    // console.log(`[advanceWinner] Bracket updated successfully for Debate ID: ${debateId}`); // Removed debug log
    return debate; // Return the updated debate document
  }

  // TODO: Add methods for generateTournamentBracket, updateTournamentMatch, updateTournamentBrackets etc.

}

module.exports = new TournamentService();