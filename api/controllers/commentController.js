const commentService = require('../services/commentService');
const announcementService = require('../services/announcementService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Create a new comment for an announcement
 */
exports.createComment = catchAsync(async (req, res, next) => {
    const { announcementId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate the announcement exists
    await announcementService.getAnnouncementById(announcementId);

    // Create the comment
    const comment = await commentService.createComment(
        announcementId,
        content,
        userId
    );

    res.status(201).json({
        status: 'success',
        data: {
            comment,
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
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Delete the comment
    await commentService.deleteComment(commentId, userId, userRole);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});
