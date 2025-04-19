const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access tournamentId from parent router
const matchPostingsController = require('../controllers/matchPostingsController');
const { protect, isOrganizer } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Routes available to all authenticated users
router.get('/', matchPostingsController.getMatchPostings);
router.get('/max-round', matchPostingsController.getMaxRound);

// Routes that require organizer permissions
router.post('/generate', isOrganizer, matchPostingsController.generateMatchPostings);
router.post('/save', isOrganizer, matchPostingsController.saveMatchPostings);
router.post('/confirm', isOrganizer, matchPostingsController.confirmMatchPostings);
router.post('/publish', isOrganizer, matchPostingsController.publishMatchPostings);

module.exports = router;
