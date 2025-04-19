const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const ApfEvaluation = require('../models/ApfEvaluation');

class StandingsService {
  /**
   * Calculate tournament standings based on match results
   * @param {string} tournamentId - The ID of the tournament
   * @returns {Promise<Array>} Array of teams with standings data
   */
  async calculateStandings(tournamentId) {
    try {
      // 1. Fetch the tournament with teams and postings
      const tournament = await Debate.findById(tournamentId)
        .populate({
          path: 'teams',
          select: 'name wins losses points members'
        })
        .populate({
          path: 'postings',
          match: { status: 'completed' } // Only consider completed postings
        })
        .lean();

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (!tournament.teams || tournament.teams.length === 0) {
        return []; // No teams to rank
      }

      // 2. Initialize team stats
      const teamStats = {};
      tournament.teams.forEach(team => {
        teamStats[team._id.toString()] = {
          id: team._id,
          name: team.name,
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          played: 0,
          members: team.members || [],
          // For tiebreakers
          headToHead: {}, // Track head-to-head results
          pointDifferential: 0, // Track point differential
          totalPointsScored: 0, // Track total points scored
          roundResults: [] // Track individual round results
        };
      });

      // 3. Process completed postings to calculate stats
      if (tournament.postings && tournament.postings.length > 0) {
        tournament.postings.forEach(posting => {
          if (posting.status === 'completed' && posting.result) {
            const team1Id = posting.team1.toString();
            const team2Id = posting.team2.toString();
            const winnerId = posting.result.winner ? posting.result.winner.toString() : null;
            const loserId = posting.result.loser ? posting.result.loser.toString() : null;
            
            // Skip if teams not found in stats (shouldn't happen, but just in case)
            if (!teamStats[team1Id] || !teamStats[team2Id]) return;
            
            // Update played count for both teams
            teamStats[team1Id].played++;
            teamStats[team2Id].played++;
            
            // Track round result
            const roundResult = {
              round: posting.round || 0,
              opponent: team1Id === winnerId ? team2Id : team1Id,
              result: team1Id === winnerId ? 'win' : (team2Id === winnerId ? 'loss' : 'draw'),
              team1Score: posting.result.team1Score || 0,
              team2Score: posting.result.team2Score || 0
            };
            
            // If there's a winner and loser
            if (winnerId && loserId) {
              // Update wins and losses
              teamStats[winnerId].wins++;
              teamStats[loserId].losses++;
              
              // Update points (3 points for a win)
              teamStats[winnerId].points += 3;
              
              // Update head-to-head record
              if (!teamStats[winnerId].headToHead[loserId]) {
                teamStats[winnerId].headToHead[loserId] = { wins: 0, losses: 0, draws: 0 };
              }
              if (!teamStats[loserId].headToHead[winnerId]) {
                teamStats[loserId].headToHead[winnerId] = { wins: 0, losses: 0, draws: 0 };
              }
              teamStats[winnerId].headToHead[loserId].wins++;
              teamStats[loserId].headToHead[winnerId].losses++;
              
              // Update point differential
              const team1Score = posting.result.team1Score || 0;
              const team2Score = posting.result.team2Score || 0;
              
              if (team1Id === winnerId) {
                teamStats[team1Id].pointDifferential += (team1Score - team2Score);
                teamStats[team2Id].pointDifferential += (team2Score - team1Score);
                teamStats[team1Id].totalPointsScored += team1Score;
                teamStats[team2Id].totalPointsScored += team2Score;
              } else {
                teamStats[team2Id].pointDifferential += (team2Score - team1Score);
                teamStats[team1Id].pointDifferential += (team1Score - team2Score);
                teamStats[team2Id].totalPointsScored += team2Score;
                teamStats[team1Id].totalPointsScored += team1Score;
              }
              
              // Add round result to team's history
              teamStats[team1Id].roundResults.push({
                ...roundResult,
                isTeam1: true
              });
              teamStats[team2Id].roundResults.push({
                ...roundResult,
                isTeam1: false
              });
            } 
            // If it's a draw
            else if (!winnerId && !loserId) {
              // Update draws
              teamStats[team1Id].draws++;
              teamStats[team2Id].draws++;
              
              // Update points (1 point for a draw)
              teamStats[team1Id].points += 1;
              teamStats[team2Id].points += 1;
              
              // Update head-to-head record
              if (!teamStats[team1Id].headToHead[team2Id]) {
                teamStats[team1Id].headToHead[team2Id] = { wins: 0, losses: 0, draws: 0 };
              }
              if (!teamStats[team2Id].headToHead[team1Id]) {
                teamStats[team2Id].headToHead[team1Id] = { wins: 0, losses: 0, draws: 0 };
              }
              teamStats[team1Id].headToHead[team2Id].draws++;
              teamStats[team2Id].headToHead[team1Id].draws++;
              
              // Add round result to team's history
              teamStats[team1Id].roundResults.push({
                ...roundResult,
                result: 'draw',
                isTeam1: true
              });
              teamStats[team2Id].roundResults.push({
                ...roundResult,
                result: 'draw',
                isTeam1: false
              });
            }
          }
        });
      }

      // 4. Convert teamStats object to array
      let standings = Object.values(teamStats);

      // 5. Sort teams by primary criteria (wins) and apply tiebreakers
      standings.sort((a, b) => {
        // Primary sort: Total Points (descending)
        if (a.points !== b.points) {
          return b.points - a.points;
        }
        
        // Tiebreaker 1: Head-to-head record
        if (a.headToHead[b.id] && b.headToHead[a.id]) {
          const aWinsAgainstB = a.headToHead[b.id].wins || 0;
          const bWinsAgainstA = b.headToHead[a.id].wins || 0;
          
          if (aWinsAgainstB !== bWinsAgainstA) {
            return bWinsAgainstA - aWinsAgainstB; // Reverse because we want the team that lost the head-to-head to be ranked lower
          }
        }
        
        // Tiebreaker 2: Point differential
        if (a.pointDifferential !== b.pointDifferential) {
          return b.pointDifferential - a.pointDifferential;
        }
        
        // Tiebreaker 3: Total points scored
        if (a.totalPointsScored !== b.totalPointsScored) {
          return b.totalPointsScored - a.totalPointsScored;
        }
        
        // Tiebreaker 4: Alphabetical by team name
        return a.name.localeCompare(b.name);
      });

      // 6. Assign ranks
      let currentRank = 1;
      let prevTeam = null;
      
      standings = standings.map((team, index) => {
        // If this is not the first team and it has the same points, head-to-head, and point differential as the previous team,
        // assign the same rank
        if (prevTeam && 
            team.points === prevTeam.points && 
            team.pointDifferential === prevTeam.pointDifferential &&
            team.totalPointsScored === prevTeam.totalPointsScored) {
          // Keep the same rank
        } else {
          // Otherwise, assign a new rank based on position
          currentRank = index + 1;
        }
        
        prevTeam = team;
        
        // Return the team with rank and simplified data structure
        return {
          id: team.id,
          name: team.name,
          rank: currentRank,
          wins: team.wins,
          losses: team.losses,
          draws: team.draws,
          points: team.points,
          played: team.played,
          pointDifferential: team.pointDifferential,
          roundResults: team.roundResults.sort((a, b) => a.round - b.round) // Sort round results by round number
        };
      });

      return standings;
    } catch (error) {
      console.error('Error calculating standings:', error);
      throw error;
    }
  }

  /**
   * Get detailed round-by-round results for all teams
   * @param {string} tournamentId - The ID of the tournament
   * @returns {Promise<Object>} Object with round numbers as keys and arrays of results as values
   */
  async getRoundByRoundResults(tournamentId) {
    try {
      // Calculate standings first to get all the data
      const standings = await this.calculateStandings(tournamentId);
      
      // Group results by round
      const roundResults = {};
      
      standings.forEach(team => {
        if (team.roundResults && team.roundResults.length > 0) {
          team.roundResults.forEach(result => {
            const roundNumber = result.round;
            
            if (!roundResults[roundNumber]) {
              roundResults[roundNumber] = [];
            }
            
            // Find the opponent team
            const opponent = standings.find(t => t.id.toString() === result.opponent.toString());
            
            roundResults[roundNumber].push({
              teamId: team.id,
              teamName: team.name,
              opponentId: opponent ? opponent.id : result.opponent,
              opponentName: opponent ? opponent.name : 'Unknown Team',
              result: result.result,
              team1Score: result.team1Score,
              team2Score: result.team2Score,
              isTeam1: result.isTeam1
            });
          });
        }
      });
      
      return roundResults;
    } catch (error) {
      console.error('Error getting round-by-round results:', error);
      throw error;
    }
  }
}

module.exports = new StandingsService();
