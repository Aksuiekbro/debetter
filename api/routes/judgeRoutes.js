const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access tournamentId from parent router
const judgeController = require('../controllers/judgeController');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Get all judges for a tournament
router.get('/', judgeController.getJudges);

// Only organizers and admins can add/edit/delete judges
router.post('/', requireRole('admin', 'organizer'), judgeController.addJudge);
router.put('/:judgeId', requireRole('admin', 'organizer'), judgeController.updateJudge);
router.delete('/:judgeId', requireRole('admin', 'organizer'), judgeController.removeJudge);

module.exports = router;
