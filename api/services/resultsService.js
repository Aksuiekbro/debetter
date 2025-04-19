const mongoose = require('mongoose');
const Debate = require('../models/Debate');

class ResultsService {
  /**
   * Get team rankings for a tournament
   * @param {string} tournamentId - The ID of the tournament
   * @returns {Promise<Array>} Array of teams with rankings
   */
  async getTeamRankings(tournamentId) {
    const tournament = await Debate.findById(tournamentId)
      .populate({
        path: 'teams.members.userId',
        select: 'username _id email'
      })
      .lean();

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.format !== 'tournament') {
      throw new Error('Not a tournament');
    }

    // Sort teams by ranking criteria
    const rankedTeams = [...tournament.teams].sort((a, b) => {
      // Primary sort: wins
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      
      // Secondary sort: total points
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      
      // Tertiary sort: speaker points
      if (b.totalSpeakerPoints !== a.totalSpeakerPoints) {
        return b.totalSpeakerPoints - a.totalSpeakerPoints;
      }
      
      // Quaternary sort: average rank
      return a.averageRank - b.averageRank;
    });

    // Add rank property to each team
    return rankedTeams.map((team, index) => ({
      ...team,
      rank: index + 1,
      roundResults: team.roundResults || []
    }));
  }

  /**
   * Record results for a specific round
   * @param {string} tournamentId - The ID of the tournament
   * @param {number} roundNumber - The round number
   * @param {Array} results - Array of team results
   * @returns {Promise<Object>} Updated tournament data
   */
  async recordRoundResults(tournamentId, roundNumber, results) {
    const tournament = await Debate.findById(tournamentId);
    
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.format !== 'tournament') {
      throw new Error('Not a tournament');
    }

    // Validate round number
    if (roundNumber < 1) {
      throw new Error('Invalid round number');
    }

    // Process each team's results
    for (const result of results) {
      const { teamId, points, rank, opponent, judges, speakerPoints, notes, room, side } = result;
      
      // Find the team in the tournament
      const teamIndex = tournament.teams.findIndex(team => team._id.toString() === teamId);
      
      if (teamIndex === -1) {
        throw new Error(`Team with ID ${teamId} not found in tournament`);
      }

      // Check if result for this round already exists
      const existingResultIndex = tournament.teams[teamIndex].roundResults?.findIndex(
        r => r.roundNumber === roundNumber
      );

      // Create the round result object
      const roundResult = {
        roundNumber,
        points: points || 0,
        rank: rank || null,
        opponent: opponent || null,
        judges: judges || [],
        speakerPoints: speakerPoints || 0,
        notes: notes || '',
        room: room || '',
        side: side || null
      };

      // Update or add the round result
      if (existingResultIndex !== -1 && existingResultIndex !== undefined) {
        tournament.teams[teamIndex].roundResults[existingResultIndex] = roundResult;
      } else {
        if (!tournament.teams[teamIndex].roundResults) {
          tournament.teams[teamIndex].roundResults = [];
        }
        tournament.teams[teamIndex].roundResults.push(roundResult);
      }

      // Update team's overall stats
      this.updateTeamStats(tournament.teams[teamIndex]);
    }

    // Mark the teams array as modified
    tournament.markModified('teams');
    
    // Save the tournament
    await tournament.save();

    return tournament;
  }

  /**
   * Update a team's overall statistics based on round results
   * @param {Object} team - The team object to update
   */
  updateTeamStats(team) {
    if (!team.roundResults || team.roundResults.length === 0) {
      return;
    }

    // Calculate total points
    team.points = team.roundResults.reduce((sum, result) => sum + (result.points || 0), 0);
    
    // Calculate total speaker points
    team.totalSpeakerPoints = team.roundResults.reduce((sum, result) => sum + (result.speakerPoints || 0), 0);
    
    // Calculate average rank (only for results that have a rank)
    const rankedResults = team.roundResults.filter(result => result.rank !== null && result.rank !== undefined);
    if (rankedResults.length > 0) {
      team.averageRank = rankedResults.reduce((sum, result) => sum + result.rank, 0) / rankedResults.length;
    } else {
      team.averageRank = 0;
    }
    
    // Calculate wins (assuming a win is when points > 0)
    team.wins = team.roundResults.filter(result => result.points > 0).length;
    
    // Calculate losses
    team.losses = team.roundResults.filter(result => result.points === 0).length;
    
    // Calculate breaking score (custom formula for tiebreakers)
    team.breakingScore = (team.wins * 10) + team.points + (team.totalSpeakerPoints / 100);
  }

  /**
   * Get detailed results for a specific team
   * @param {string} tournamentId - The ID of the tournament
   * @param {string} teamId - The ID of the team
   * @returns {Promise<Object>} Team details with round results
   */
  async getTeamResults(tournamentId, teamId) {
    const tournament = await Debate.findById(tournamentId)
      .populate({
        path: 'teams.members.userId',
        select: 'username _id email'
      })
      .populate({
        path: 'teams.roundResults.judges',
        select: 'username _id'
      })
      .lean();

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Find the team
    const team = tournament.teams.find(t => t._id.toString() === teamId);
    
    if (!team) {
      throw new Error('Team not found');
    }

    // Get opponent details for each round
    if (team.roundResults && team.roundResults.length > 0) {
      for (let i = 0; i < team.roundResults.length; i++) {
        const result = team.roundResults[i];
        if (result.opponent) {
          const opponent = tournament.teams.find(t => t._id.toString() === result.opponent.toString());
          if (opponent) {
            team.roundResults[i].opponentDetails = {
              name: opponent.name,
              id: opponent._id
            };
          }
        }
      }
    }

    return team;
  }

  /**
   * Get all round results for a tournament
   * @param {string} tournamentId - The ID of the tournament
   * @param {number} roundNumber - Optional round number to filter by
   * @returns {Promise<Object>} Round results grouped by round
   */
  async getRoundResults(tournamentId, roundNumber = null) {
    const tournament = await Debate.findById(tournamentId)
      .populate({
        path: 'teams.members.userId',
        select: 'username _id email'
      })
      .lean();

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Get all teams with round results
    const teams = tournament.teams.filter(team => team.roundResults && team.roundResults.length > 0);
    
    // Group results by round
    const roundResults = {};
    
    teams.forEach(team => {
      team.roundResults.forEach(result => {
        // Skip if we're filtering by round and this isn't the requested round
        if (roundNumber !== null && result.roundNumber !== roundNumber) {
          return;
        }
        
        if (!roundResults[result.roundNumber]) {
          roundResults[result.roundNumber] = [];
        }
        
        roundResults[result.roundNumber].push({
          team: {
            id: team._id,
            name: team.name,
            members: team.members
          },
          ...result
        });
      });
    });
    
    return roundResults;
  }
}

module.exports = new ResultsService();
