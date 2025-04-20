const postingService = require('../services/postingService');

/**
 * Generate match postings for a tournament round
 */
exports.generateMatchPostings = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { 
      round, 
      roundType = 'preliminary',
      avoidRematches = true,
      avoidSameClub = true
    } = req.body;
    
    if (!round) {
      return res.status(400).json({
        status: 'error',
        message: 'Round number is required'
      });
    }
    
    const postings = await postingService.generateMatchPostings(
      tournamentId,
      {
        round: parseInt(round, 10),
        roundType,
        avoidRematches,
        avoidSameClub
      }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        postings
      }
    });
  } catch (error) {
    console.error('Error generating match postings:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Save generated match postings
 */
exports.saveMatchPostings = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { postings } = req.body;
    const userId = req.user._id;
    
    if (!postings || !Array.isArray(postings) || postings.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Postings must be provided as a non-empty array'
      });
    }
    
    const tournament = await postingService.saveMatchPostings(
      tournamentId,
      postings,
      userId
    );
    
    res.status(200).json({
      status: 'success',
      message: `${postings.length} postings saved successfully`,
      data: {
        tournamentId: tournament._id
      }
    });
  } catch (error) {
    console.error('Error saving match postings:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Confirm match postings for a round
 */
exports.confirmMatchPostings = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { round, roundType = 'preliminary' } = req.body;
    
    if (!round) {
      return res.status(400).json({
        status: 'error',
        message: 'Round number is required'
      });
    }
    
    const tournament = await postingService.confirmMatchPostings(
      tournamentId,
      parseInt(round, 10),
      roundType
    );
    
    res.status(200).json({
      status: 'success',
      message: `Postings for round ${round} confirmed successfully`,
      data: {
        tournamentId: tournament._id
      }
    });
  } catch (error) {
    console.error('Error confirming match postings:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Publish match postings for a round
 */
exports.publishMatchPostings = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { round, roundType = 'preliminary' } = req.body;
    
    if (!round) {
      return res.status(400).json({
        status: 'error',
        message: 'Round number is required'
      });
    }
    
    const tournament = await postingService.publishMatchPostings(
      tournamentId,
      parseInt(round, 10),
      roundType
    );
    
    res.status(200).json({
      status: 'success',
      message: `Postings for round ${round} published successfully`,
      data: {
        tournamentId: tournament._id
      }
    });
  } catch (error) {
    console.error('Error publishing match postings:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get match postings for a tournament
 */
exports.getMatchPostings = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { round, roundType, confirmed, published } = req.query;
    
    const filters = {};
    
    if (round) {
      filters.round = parseInt(round, 10);
    }
    
    if (roundType) {
      filters.roundType = roundType;
    }
    
    if (confirmed !== undefined) {
      filters.confirmed = confirmed === 'true';
    }
    
    if (published !== undefined) {
      filters.published = published === 'true';
    }
    
    const postings = await postingService.getPostingsForTournament(tournamentId, filters);
    
    res.status(200).json({
      status: 'success',
      results: postings.length,
      data: {
        postings
      }
    });
  } catch (error) {
    console.error('Error getting match postings:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get the maximum round number for a tournament
 */
exports.getMaxRound = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { roundType = 'preliminary' } = req.query;
    
    const maxRound = await postingService.getMaxRound(tournamentId, roundType);
    
    res.status(200).json({
      status: 'success',
      data: {
        maxRound
      }
    });
  } catch (error) {
    console.error('Error getting max round:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
