const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access tournamentId from parent router
const resultsController = require('../controllers/resultsController');
const { protect, isOrganizer } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Routes available to all authenticated users
router.get('/rankings', resultsController.getTeamRankings);
router.get('/teams/:teamId', resultsController.getTeamResults);
router.get('/rounds', resultsController.getRoundResults);

// Routes that require organizer permissions
router.post('/rounds/:roundNumber', isOrganizer, resultsController.recordRoundResults);

module.exports = router;
