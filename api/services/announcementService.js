const Announcement = require('../models/Announcement');
const Debate = require('../models/Debate'); // Needed for authorization checks later in controller
const AppError = require('../utils/appError'); // Assuming you have an AppError utility
const cloudStorageService = require('./cloudStorageService'); // For image uploads

/**
 * Creates a new announcement for a specific tournament.
 * @param {string} tournamentId - The ID of the tournament.
 * @param {object} announcementData - Data for the new announcement (title, content, imageBuffer, etc).
 * @param {string} userId - The ID of the user creating the announcement.
 * @returns {Promise<object>} The created announcement document.
 */
const createAnnouncement = async (tournamentId, announcementData, userId) => {
    console.log('Creating announcement with data:', { tournamentId, userId, announcementData });

    const { title, content, backgroundColor } = announcementData;
    if (!title || !content) {
        throw new AppError('Title and content are required for an announcement.', 400);
    }

    // Create announcement data object
    const newAnnouncementData = {
        tournament: tournamentId,
        title,
        content,
        createdBy: userId,
    };

    // Add backgroundColor if provided
    if (backgroundColor) {
        newAnnouncementData.backgroundColor = backgroundColor;
    }

    console.log('Final announcement data:', newAnnouncementData);

    try {
        // Create the announcement
        const announcement = await Announcement.create(newAnnouncementData);
        console.log('Created announcement:', announcement);
        return announcement;
    } catch (error) {
        console.error('Error creating announcement:', error);
        throw error;
    }
};

/**
 * Retrieves all announcements for a specific tournament.
 * @param {string} tournamentId - The ID of the tournament.
 * @returns {Promise<Array<object>>} A list of announcements for the tournament.
 */
const getAnnouncementsByTournament = async (tournamentId) => {
    const announcements = await Announcement.find({ tournament: tournamentId })
        .sort({ createdAt: -1 }) // Show newest first
        .populate('createdBy', 'username name profilePhotoUrl') // Include profile photo
        .populate({
            path: 'comments',
            options: { sort: { createdAt: 1 } }, // Sort comments by creation date
            populate: { path: 'createdBy', select: 'username name profilePhotoUrl' }
        });
    return announcements;
};

/**
 * Retrieves a single announcement by its ID.
 * @param {string} announcementId - The ID of the announcement.
 * @returns {Promise<object|null>} The announcement document or null if not found.
 */
const getAnnouncementById = async (announcementId) => {
    const announcement = await Announcement.findById(announcementId)
        .populate('createdBy', 'username name profilePhotoUrl')
        .populate({
            path: 'comments',
            options: { sort: { createdAt: 1 } },
            populate: { path: 'createdBy', select: 'username name profilePhotoUrl' }
        });
    if (!announcement) {
        throw new AppError('Announcement not found.', 404);
    }
    return announcement;
};

/**
 * Updates an existing announcement.
 * @param {string} announcementId - The ID of the announcement to update.
 * @param {object} updateData - Data to update (e.g., title, content, backgroundColor).
 * @returns {Promise<object|null>} The updated announcement document or null if not found.
 */
const updateAnnouncement = async (announcementId, updateData) => {
    // Ensure protected fields like 'createdBy', 'tournament' are not updated directly
    const allowedUpdates = {
        title: updateData.title,
        content: updateData.content,
        backgroundColor: updateData.backgroundColor
    };
    // Remove undefined fields to avoid overwriting with null
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);

    if (Object.keys(allowedUpdates).length === 0) {
         throw new AppError('No valid fields provided for update.', 400);
    }

    const announcement = await Announcement.findByIdAndUpdate(
        announcementId,
        allowedUpdates,
        { new: true, runValidators: true } // Return updated doc, run schema validators
    )
    .populate('createdBy', 'username name profilePhotoUrl')
    .populate({
        path: 'comments',
        options: { sort: { createdAt: 1 } },
        populate: { path: 'createdBy', select: 'username name profilePhotoUrl' }
    });

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

/**
 * Uploads an image for an announcement.
 * @param {string} announcementId - The ID of the announcement.
 * @param {Buffer} imageBuffer - The image file buffer.
 * @param {string} fileName - The original file name.
 * @param {string} mimeType - The MIME type of the image.
 * @returns {Promise<string>} The URL of the uploaded image.
 */
const uploadAnnouncementImage = async (announcementId, imageBuffer, fileName, mimeType) => {
    // Find the announcement first to make sure it exists
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
        throw new AppError('Announcement not found.', 404);
    }

    // If an image already exists, delete it from cloud storage
    if (announcement.imageUrl) {
        try {
            await cloudStorageService.deleteFile(announcement.imageUrl);
        } catch (error) {
            console.error(`Error deleting previous image: ${error.message}`);
            // Continue with the upload even if deletion fails
        }
    }

    // Create a unique file name
    const uniqueFileName = `announcement-${announcementId}-${Date.now()}-${fileName}`;

    // Upload the image to cloud storage
    const imageUrl = await cloudStorageService.uploadFile(imageBuffer, uniqueFileName, mimeType);

    // Update the announcement with the new image URL
    announcement.imageUrl = imageUrl;
    await announcement.save();

    return imageUrl;
};

module.exports = {
    createAnnouncement,
    getAnnouncementsByTournament,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    uploadAnnouncementImage,
};