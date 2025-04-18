const express = require('express');
const announcementController = require('../controllers/announcementController');
const { protect: authenticate } = require('../middleware/authMiddleware'); // Import protect as authenticate
const uploadMiddleware = require('../middleware/uploadMiddleware'); // For image uploads

// Create a router instance with mergeParams: true to access :tournamentId from the parent router
const router = express.Router({ mergeParams: true });

// All announcement routes require authentication
router.use(authenticate);

// POST /api/tournaments/:tournamentId/announcements - Create a new announcement
// Permission check (creator/organizer/admin) is handled within the controller
router.post('/', announcementController.create);

// GET /api/tournaments/:tournamentId/announcements - Get all announcements for the tournament
// Accessible by any authenticated user
router.get('/', announcementController.getAllForTournament);

// PUT /api/tournaments/:tournamentId/announcements/:announcementId - Update an announcement
// Permission check (creator/organizer/admin) is handled within the controller
router.put('/:announcementId', announcementController.update);

// DELETE /api/tournaments/:tournamentId/announcements/:announcementId - Delete an announcement
// Permission check (creator/organizer/admin) is handled within the controller
router.delete('/:announcementId', announcementController.delete);

// POST /api/tournaments/:tournamentId/announcements/:announcementId/image - Upload image for announcement
// Permission check (creator/organizer/admin) is handled within the controller
router.post(
    '/:announcementId/image',
    uploadMiddleware.single('image'), // Assuming 'image' is the field name for the file
    announcementController.uploadImage
);


module.exports = router;