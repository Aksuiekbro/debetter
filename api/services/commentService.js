const Comment = require('../models/Comment');
const Announcement = require('../models/Announcement');
const AppError = require('../utils/appError');

/**
 * Creates a new comment for a specific announcement.
 * @param {string} announcementId - The ID of the announcement.
 * @param {string} content - The content of the comment.
 * @param {string} userId - The ID of the user creating the comment.
 * @returns {Promise<object>} The created comment document.
 */
const createComment = async (announcementId, content, userId) => {
    if (!content) {
        throw new AppError('Comment content is required.', 400);
    }

    // Create the comment
    const comment = await Comment.create({
        announcement: announcementId,
        content,
        createdBy: userId,
    });

    // Add the comment reference to the announcement
    await Announcement.findByIdAndUpdate(
        announcementId,
        { $push: { comments: comment._id } }
    );

    return comment;
};

/**
 * Retrieves all comments for a specific announcement.
 * @param {string} announcementId - The ID of the announcement.
 * @returns {Promise<Array<object>>} A list of comments for the announcement.
 */
const getCommentsByAnnouncement = async (announcementId) => {
    const comments = await Comment.find({ announcement: announcementId })
        .sort({ createdAt: 1 }) // Show oldest first (chronological order)
        .populate('createdBy', 'username name profilePhotoUrl'); // Include creator info
    return comments;
};

/**
 * Deletes a comment by its ID.
 * @param {string} commentId - The ID of the comment to delete.
 * @param {string} userId - The ID of the user attempting to delete the comment.
 * @param {string} userRole - The role of the user attempting to delete the comment.
 * @returns {Promise<void>}
 */
const deleteComment = async (commentId, userId, userRole) => {
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
        throw new AppError('Comment not found.', 404);
    }
    
    // Check if the user is the comment creator or has admin role
    const isCreator = comment.createdBy.toString() === userId.toString();
    const isAdmin = userRole === 'admin';
    
    if (!isCreator && !isAdmin) {
        throw new AppError('You do not have permission to delete this comment.', 403);
    }
    
    // Remove the comment reference from the announcement
    await Announcement.findByIdAndUpdate(
        comment.announcement,
        { $pull: { comments: commentId } }
    );
    
    // Delete the comment
    await Comment.findByIdAndDelete(commentId);
};

module.exports = {
    createComment,
    getCommentsByAnnouncement,
    deleteComment,
};
