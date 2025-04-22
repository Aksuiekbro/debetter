const express = require('express');
const commentController = require('../controllers/commentController');
const { protect, requireRole } = require('../middleware/authMiddleware'); // Assuming roles might be needed for deletion

// mergeParams: true allows access to parent route params (e.g., :announcementId)
const router = express.Router({ mergeParams: true });

// Protect all comment routes - users must be logged in
router.use(protect);

// Route to get all comments for a specific announcement
router.get('/', commentController.getCommentsByAnnouncement);

// Route to create a new comment for a specific announcement
router.post('/', commentController.createComment);

// Route to delete a specific comment
// Optional: Add role check if only admins/moderators/comment owner can delete
// router.delete('/:commentId', requireRole('admin'), commentController.deleteComment);
router.delete('/:commentId', commentController.deleteComment); // Currently allows any authenticated user (owner check is in controller/service)

module.exports = router;
