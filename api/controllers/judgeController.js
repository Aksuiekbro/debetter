const judgeService = require('../services/judgeService');

/**
 * Get all judges for a tournament
 */
exports.getJudges = async (req, res) => {
  try {
    // Use the correct parameter name 'id' from the parent route
    const { id: tournamentId } = req.params; 
    
    const judges = await judgeService.getJudgesForTournament(tournamentId);
    
    res.status(200).json({
      success: true,
      data: {
        judges
      }
    });
  } catch (error) {
    console.error('Error getting judges:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get judges'
    });
  }
};

/**
 * Add a new judge to a tournament
 */
exports.addJudge = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const judgeData = req.body;
    const creatorId = req.user._id;
    
    // Validate required fields
    if (!judgeData.name || !judgeData.email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }
    
    const judge = await judgeService.addJudge(tournamentId, judgeData, creatorId);
    
    res.status(201).json({
      success: true,
      message: 'Judge added successfully',
      data: {
        judge
      }
    });
  } catch (error) {
    console.error('Error adding judge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add judge'
    });
  }
};

/**
 * Update a judge's information
 */
exports.updateJudge = async (req, res) => {
  try {
    const { tournamentId, judgeId } = req.params;
    const judgeData = req.body;
    
    const judge = await judgeService.updateJudge(tournamentId, judgeId, judgeData);
    
    res.status(200).json({
      success: true,
      message: 'Judge updated successfully',
      data: {
        judge
      }
    });
  } catch (error) {
    console.error('Error updating judge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update judge'
    });
  }
};

/**
 * Remove a judge from a tournament
 */
exports.removeJudge = async (req, res) => {
  try {
    const { tournamentId, judgeId } = req.params;
    
    await judgeService.removeJudge(tournamentId, judgeId);
    
    res.status(200).json({
      success: true,
      message: 'Judge removed successfully'
    });
  } catch (error) {
    console.error('Error removing judge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove judge'
    });
  }
};
