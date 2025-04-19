const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access tournamentId from parent router
const ballotController = require('../controllers/ballotController');
const { protect, isOrganizer } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Routes available to all authenticated users
router.get('/', ballotController.getAllBallots);
router.get('/:postingId', ballotController.getBallot);
router.get('/:postingId/feedback', ballotController.getParticipantFeedback);

// Routes that require organizer permissions
router.post('/:postingId', isOrganizer, ballotController.submitBallot);
router.post('/:postingId/image', isOrganizer, ballotController.uploadMiddleware, ballotController.uploadBallotImage);

// Routes for participant feedback
router.post('/:postingId/feedback', ballotController.addParticipantFeedback);

module.exports = router;
