const resultsService = require('../services/resultsService');

/**
 * Get team rankings for a tournament
 */
exports.getTeamRankings = async (req, res) => {
  try {
    const { id: tournamentId } = req.params; // Use 'id' from route param
    
    const rankings = await resultsService.getTeamRankings(tournamentId);
    
    res.status(200).json({
      status: 'success',
      data: {
        rankings
      }
    });
  } catch (error) {
    console.error('Error getting team rankings:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Record results for a specific round
 */
exports.recordRoundResults = async (req, res) => {
  try {
    const { id: tournamentId, roundNumber } = req.params; // Use 'id' from route param
    const { results } = req.body;
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        status: 'error',
        message: 'Results must be provided as an array'
      });
    }
    
    const tournament = await resultsService.recordRoundResults(
      tournamentId,
      parseInt(roundNumber, 10),
      results
    );
    
    res.status(200).json({
      status: 'success',
      message: `Results for round ${roundNumber} recorded successfully`,
      data: {
        tournamentId: tournament._id
      }
    });
  } catch (error) {
    console.error('Error recording round results:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get detailed results for a specific team
 */
exports.getTeamResults = async (req, res) => {
  try {
    const { id: tournamentId, teamId } = req.params; // Use 'id' from route param
    
    const teamResults = await resultsService.getTeamResults(tournamentId, teamId);
    
    res.status(200).json({
      status: 'success',
      data: {
        team: teamResults
      }
    });
  } catch (error) {
    console.error('Error getting team results:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get all round results for a tournament
 */
exports.getRoundResults = async (req, res) => {
  try {
    const { id: tournamentId } = req.params; // Use 'id' from route param
    const { round } = req.query;
    
    const roundNumber = round ? parseInt(round, 10) : null;
    
    const roundResults = await resultsService.getRoundResults(tournamentId, roundNumber);
    
    res.status(200).json({
      status: 'success',
      data: {
        roundResults
      }
    });
  } catch (error) {
    console.error('Error getting round results:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
