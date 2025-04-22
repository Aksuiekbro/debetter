const commentService = require('../services/commentService');
const announcementService = require('../services/announcementService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const socketService = require('../services/socketService'); // Import socket service for real-time updates

/**
 * Create a new comment for an announcement
 */
exports.createComment = catchAsync(async (req, res, next) => {
    // Access both announcementId and the parent's :id (tournamentId)
    const { id: tournamentId, announcementId } = req.params; 
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
        return next(new AppError('Comment content cannot be empty', 400));
    }

    // Validate the announcement exists
    const announcement = await announcementService.getAnnouncementById(announcementId);
    if (!announcement) {
        return next(new AppError('Announcement not found', 404));
    }

    // Create the comment
    const comment = await commentService.createComment(
        announcementId,
        content,
        userId
    );

    // Emit socket event for real-time updates - tournamentId is now available directly
    socketService.emitCommentCreated(tournamentId, announcementId, comment);

    // Return the populated comment with user info
    const populatedComment = await commentService.getCommentById(comment._id);

    res.status(201).json({
        status: 'success',
        data: {
            comment: populatedComment,
        },
    });
});

/**
 * Get all comments for an announcement
 */
exports.getCommentsByAnnouncement = catchAsync(async (req, res, next) => {
    const { announcementId } = req.params;

    // Validate the announcement exists
    await announcementService.getAnnouncementById(announcementId);

    // Get the comments
    const comments = await commentService.getCommentsByAnnouncement(announcementId);

    res.status(200).json({
        status: 'success',
        results: comments.length,
        data: {
            comments,
        },
    });
});

/**
 * Delete a comment
 */
exports.deleteComment = catchAsync(async (req, res, next) => {
    // Access tournamentId, announcementId, and commentId from params
    const { id: tournamentId, announcementId, commentId } = req.params; 
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the comment to find its announcement and tournament
    const comment = await commentService.getCommentById(commentId);
    if (!comment) {
        return next(new AppError('Comment not found.', 404));
    }

    // Delete the comment (service likely needs commentId, userId, userRole)
    await commentService.deleteComment(commentId, userId, userRole);

    // Emit socket event for real-time updates
    socketService.emitCommentDeleted(tournamentId, announcementId, commentId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
