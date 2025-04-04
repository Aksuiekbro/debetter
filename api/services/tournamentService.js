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
       participants: [{ // Creator automatically joins
         _id: creator._id,
         username: creator.username,
         role: creator.role
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
      debate.participants.push({
        _id: user._id,
        username: user.username,
        role: user.role,
        judgeRole: user.role === 'judge' ? 'main' : undefined // Default judge role
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
                  currentParticipants.push({ _id: user._id, username: user.username, role: 'judge', judgeRole: 'main' });
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
                  currentParticipants.push({ _id: user._id, username: user.username, role: user.role || 'debater' });
                  currentParticipantIds.push(debaterId); // Add to check list
                  addedDebaters.push(user._id);
                  debatersToAdd--;
              }
          }
      }

      debate.participants = currentParticipants;
      // Update counters directly
      debate.tournamentSettings.currentJudges = currentParticipants.filter(p => p.role === 'judge').length;
      debate.tournamentSettings.currentDebaters = currentParticipants.filter(p => p.role !== 'judge').length;

      await debate.save();

      return {
          debateId: debate._id,
          judgesAdded: addedJudges.length,
          debatersAdded: addedDebaters.length,
          totalJudges: debate.tournamentSettings.currentJudges,
          totalDebaters: debate.tournamentSettings.currentDebaters,
      };
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

    // --- Resolve Winner Team ID to Representative User ID ---
    const winningTeam = debate.teams.find(t => t._id.toString() === winnerTeamId.toString());
    if (!winningTeam) throw new Error(`Winning team with ID ${winnerTeamId} not found in tournament`);

    // Find the leader of the winning team (assuming leader represents the team in bracket)
    const teamLeaderMember = winningTeam.members.find(m => m.role === 'leader');
    if (!teamLeaderMember || !teamLeaderMember.userId) {
        // Fallback: maybe use the first member? Or throw error? For now, log and potentially skip advancement.
        console.warn(`Could not find leader for winning team ${winningTeam.name} (ID: ${winnerTeamId}). Cannot advance winner.`);
        // Depending on requirements, you might want to throw an error here instead.
        // throw new Error(`Leader not found for winning team ${winningTeam.name}`);
        return debate; // Return without advancing
    }
    const winnerRepresentativeUserId = teamLeaderMember.userId._id; // Get the ObjectId
    console.log(`[advanceWinner] Advancing winner: Team ${winningTeam.name}, Representative User ID: ${winnerRepresentativeUserId}`);
    // --- End Winner Resolution ---

    // Update the current match (optional, could be done elsewhere)
    currentMatch.winner = winnerRepresentativeUserId; // Store the representative User ID
    currentMatch.completed = true;

    // Check if it's the final round
    if (currentRoundIndex === debate.tournamentRounds.length - 1) {
      // This was the final match
      console.log(`[advanceWinner] Final match completed. Tournament Winner User ID: ${winnerRepresentativeUserId}`);
      debate.winner = winnerRepresentativeUserId; // Set tournament winner (User ID)
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
        console.log(`[advanceWinner] Placing winner ${winnerRepresentativeUserId} into Round ${nextRoundIndex + 1}, Match ${nextMatchIndex + 1}, Slot team1`);
        nextMatch.team1 = winnerRepresentativeUserId;
      } else {
        console.log(`[advanceWinner] Placing winner ${winnerRepresentativeUserId} into Round ${nextRoundIndex + 1}, Match ${nextMatchIndex + 1}, Slot team2`);
        nextMatch.team2 = winnerRepresentativeUserId;
      }
    }

    debate.markModified('tournamentRounds'); // Mark the array as modified
    await debate.save();
    console.log(`[advanceWinner] Bracket updated successfully for Debate ID: ${debateId}`);
    return debate; // Return the updated debate document
  }

  // TODO: Add methods for generateTournamentBracket, updateTournamentMatch, updateTournamentBrackets etc.

}

module.exports = new TournamentService();