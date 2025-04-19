const ballotService = require('../services/ballotService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Submit a ballot for a posting
 */
exports.submitBallot = async (req, res) => {
  try {
    const { tournamentId, postingId } = req.params;
    const ballotData = req.body;
    const userId = req.user._id;
    
    const posting = await ballotService.submitBallot(
      tournamentId,
      postingId,
      ballotData,
      userId
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Ballot submitted successfully',
      data: {
        posting
      }
    });
  } catch (error) {
    console.error('Error submitting ballot:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get a ballot for a posting
 */
exports.getBallot = async (req, res) => {
  try {
    const { tournamentId, postingId } = req.params;
    
    const ballot = await ballotService.getBallot(tournamentId, postingId);
    
    res.status(200).json({
      status: 'success',
      data: {
        ballot
      }
    });
  } catch (error) {
    console.error('Error getting ballot:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get all ballots for a tournament
 */
exports.getAllBallots = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { round, roundType, submitted } = req.query;
    
    const filters = {};
    
    if (round) {
      filters.round = parseInt(round, 10);
    }
    
    if (roundType) {
      filters.roundType = roundType;
    }
    
    if (submitted !== undefined) {
      filters.submitted = submitted === 'true';
    }
    
    const ballots = await ballotService.getAllBallots(tournamentId, filters);
    
    res.status(200).json({
      status: 'success',
      results: ballots.length,
      data: {
        ballots
      }
    });
  } catch (error) {
    console.error('Error getting ballots:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Upload a ballot image
 */
exports.uploadBallotImage = async (req, res) => {
  try {
    const { tournamentId, postingId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }
    
    const imageUrl = await ballotService.uploadBallotImage(
      tournamentId,
      postingId,
      req.file.buffer,
      req.file.originalname
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Ballot image uploaded successfully',
      data: {
        imageUrl
      }
    });
  } catch (error) {
    console.error('Error uploading ballot image:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Add participant feedback to a ballot
 */
exports.addParticipantFeedback = async (req, res) => {
  try {
    const { tournamentId, postingId } = req.params;
    const feedbackData = req.body;
    const userId = req.user._id;
    
    const posting = await ballotService.addParticipantFeedback(
      tournamentId,
      postingId,
      feedbackData,
      userId
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Feedback submitted successfully',
      data: {
        posting
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

/**
 * Get participant feedback for a posting
 */
exports.getParticipantFeedback = async (req, res) => {
  try {
    const { tournamentId, postingId } = req.params;
    
    const feedback = await ballotService.getParticipantFeedback(
      tournamentId,
      postingId
    );
    
    res.status(200).json({
      status: 'success',
      results: feedback.length,
      data: {
        feedback
      }
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Middleware for handling file uploads
exports.uploadMiddleware = upload.single('ballotImage');
