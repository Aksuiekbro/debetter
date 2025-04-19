const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access tournamentId from parent router
const entrantController = require('../controllers/entrantController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Get all entrants for a tournament
router.get('/', entrantController.getEntrants);

// Only organizers and admins can check in/out entrants
router.post('/:entrantId/check-in', requireRole('admin', 'organizer'), entrantController.checkInEntrant);
router.post('/:entrantId/check-out', requireRole('admin', 'organizer'), entrantController.checkOutEntrant);

module.exports = router;
