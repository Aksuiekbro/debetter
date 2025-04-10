const Announcement = require('../models/Announcement');
const Debate = require('../models/Debate'); // Needed for authorization checks later in controller
const AppError = require('../utils/appError'); // Assuming you have an AppError utility

/**
 * Creates a new announcement for a specific tournament.
 * @param {string} tournamentId - The ID of the tournament.
 * @param {object} announcementData - Data for the new announcement (title, content).
 * @param {string} userId - The ID of the user creating the announcement.
 * @returns {Promise<object>} The created announcement document.
 */
const createAnnouncement = async (tournamentId, announcementData, userId) => {
    const { title, content } = announcementData;
    if (!title || !content) {
        throw new AppError('Title and content are required for an announcement.', 400);
    }

    const announcement = await Announcement.create({
        tournament: tournamentId,
        title,
        content,
        createdBy: userId,
    });
    return announcement;
};

/**
 * Retrieves all announcements for a specific tournament.
 * @param {string} tournamentId - The ID of the tournament.
 * @returns {Promise<Array<object>>} A list of announcements for the tournament.
 */
const getAnnouncementsByTournament = async (tournamentId) => {
    const announcements = await Announcement.find({ tournament: tournamentId })
        .sort({ createdAt: -1 }) // Show newest first
        .populate('createdBy', 'username name'); // Optionally populate creator info
    return announcements;
};

/**
 * Retrieves a single announcement by its ID.
 * @param {string} announcementId - The ID of the announcement.
 * @returns {Promise<object|null>} The announcement document or null if not found.
 */
const getAnnouncementById = async (announcementId) => {
    const announcement = await Announcement.findById(announcementId).populate('createdBy', 'username name');
    if (!announcement) {
        throw new AppError('Announcement not found.', 404);
    }
    return announcement;
};

/**
 * Updates an existing announcement.
 * @param {string} announcementId - The ID of the announcement to update.
 * @param {object} updateData - Data to update (e.g., title, content).
 * @returns {Promise<object|null>} The updated announcement document or null if not found.
 */
const updateAnnouncement = async (announcementId, updateData) => {
    // Ensure protected fields like 'createdBy', 'tournament' are not updated directly
    const allowedUpdates = { title: updateData.title, content: updateData.content };
    // Remove undefined fields to avoid overwriting with null
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

    if (Object.keys(allowedUpdates).length === 0) {
         throw new AppError('No valid fields provided for update.', 400);
    }

    const announcement = await Announcement.findByIdAndUpdate(
        announcementId,
        allowedUpdates,
        { new: true, runValidators: true } // Return updated doc, run schema validators
    ).populate('createdBy', 'username name');

    if (!announcement) {
        throw new AppError('Announcement not found.', 404);
    }
    return announcement;
};

/**
 * Deletes an announcement by its ID.
 * @param {string} announcementId - The ID of the announcement to delete.
 * @returns {Promise<void>}
 */
const deleteAnnouncement = async (announcementId) => {
    const result = await Announcement.findByIdAndDelete(announcementId);
    if (!result) {
        throw new AppError('Announcement not found.', 404);
    }
    // No return value needed, success is indicated by not throwing an error
};

module.exports = {
    createAnnouncement,
    getAnnouncementsByTournament,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
};