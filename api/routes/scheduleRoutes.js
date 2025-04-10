const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { protect: authenticate, requireRole } = require('../middleware/authMiddleware'); // Import protect as authenticate

// Create a router instance with mergeParams: true to access :tournamentId from the parent router
const router = express.Router({ mergeParams: true });

// Middleware to check if the user is an organizer or admin for protected routes
// Note: The actual permission check against the specific tournament happens in the controller
const checkAdminOrOrganizer = requireRole('admin', 'organizer');

// POST /api/debates/:tournamentId/schedule - Create a new schedule item
router.post(
    '/',
    authenticate, // Ensure user is logged in
    checkAdminOrOrganizer, // Ensure user has the general role
    scheduleController.createScheduleItem // Controller handles specific tournament permission
);

// GET /api/debates/:tournamentId/schedule - Get all schedule items for the tournament
router.get(
    '/',
    authenticate, // All authenticated users can view the schedule
    scheduleController.getScheduleItemsForTournament
);

// PUT /api/debates/:tournamentId/schedule/:itemId - Update a specific schedule item
router.put(
    '/:itemId',
    authenticate,
    checkAdminOrOrganizer,
    scheduleController.updateScheduleItem
);

// DELETE /api/debates/:tournamentId/schedule/:itemId - Delete a specific schedule item
router.delete(
    '/:itemId',
    authenticate,
    checkAdminOrOrganizer,
    scheduleController.deleteScheduleItem
);

module.exports = router;