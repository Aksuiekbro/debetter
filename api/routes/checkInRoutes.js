const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access tournamentId from parent router
const checkInController = require('../controllers/checkInController');
const { protect, isOrganizer } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Only organizers can access check-in functionality
router.use(isOrganizer);

// Get check-in status for a tournament
router.get('/', checkInController.getCheckInStatus);

// Team check-in routes
router.post('/teams/:teamId/check-in', checkInController.checkInTeam);
router.post('/teams/:teamId/check-out', checkInController.checkOutTeam);

// Judge check-in routes
router.post('/judges/:judgeId/check-in', checkInController.checkInJudge);
router.post('/judges/:judgeId/check-out', checkInController.checkOutJudge);

module.exports = router;
