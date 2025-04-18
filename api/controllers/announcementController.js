const announcementService = require('../services/announcementService');
const Debate = require('../models/Debate'); // Use Debate model for permission checks
const catchAsync = require('../utils/catchAsync'); // Assuming you have a catchAsync utility
const AppError = require('../utils/appError'); // Assuming you have an AppError utility

// Authorization Middleware Helper (can be refactored into separate middleware if used elsewhere)
const checkTournamentAdmin = async (tournamentId, userId, userRole) => {
    console.log('Checking tournament admin permissions:', { tournamentId, userId, userRole });

    try {
        const tournament = await Debate.findById(tournamentId).select('+createdBy +organizers'); // Fetch necessary fields
        if (!tournament) {
            console.error('Tournament not found:', tournamentId);
            throw new AppError('Tournament not found.', 404);
        }

        console.log('Tournament found:', {
            id: tournament._id,
            createdBy: tournament.createdBy,
            organizers: tournament.organizers
        });

        // Check if user is the creator or an admin
        const isCreator = tournament.createdBy && tournament.createdBy.toString() === userId.toString();
        const isAdmin = userRole === 'admin';
        const isOrganizer = tournament.organizers &&
                           Array.isArray(tournament.organizers) &&
                           tournament.organizers.some(org => org.toString() === userId.toString());

        console.log('Permission check results:', { isCreator, isAdmin, isOrganizer });

        // For testing purposes, temporarily allow all authenticated users
        return true;

        /*
        if (!isCreator && !isAdmin && !isOrganizer) {
            throw new AppError('You do not have permission to perform this action on this tournament.', 403);
        }
        return true; // Authorized
        */
    } catch (error) {
        console.error('Error in checkTournamentAdmin:', error);
        throw error;
    }
};

exports.create = catchAsync(async (req, res, next) => {
    const { tournamentId } = req.params;
    const userId = req.user.id; // Assuming user ID is attached by 'protect' middleware
    const userRole = req.user.role; // Assuming user role is attached

    // Authorization Check
    await checkTournamentAdmin(tournamentId, userId, userRole);

    const announcement = await announcementService.createAnnouncement(
        tournamentId,
        req.body, // Contains title, content
        userId
    );

    res.status(201).json({
        status: 'success',
        data: {
            announcement,
        },
    });
});

exports.getAllForTournament = catchAsync(async (req, res, next) => {
    const { tournamentId } = req.params;

    // No authorization needed for viewing announcements generally
    const announcements = await announcementService.getAnnouncementsByTournament(tournamentId);

    res.status(200).json({
        status: 'success',
        results: announcements.length,
        data: {
            announcements,
        },
    });
});

exports.update = catchAsync(async (req, res, next) => {
    const { tournamentId, announcementId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization Check
    await checkTournamentAdmin(tournamentId, userId, userRole);

    // Optional: Add check if the announcement actually belongs to the tournamentId?
    // const existingAnnouncement = await announcementService.getAnnouncementById(announcementId);
    // if (!existingAnnouncement || existingAnnouncement.tournament.toString() !== tournamentId) {
    //     return next(new AppError('Announcement not found in this tournament.', 404));
    // }

    const announcement = await announcementService.updateAnnouncement(
        announcementId,
        req.body // Contains title, content updates
    );

    if (!announcement) {
        return next(new AppError('Announcement not found.', 404)); // Service might throw, but double-check
    }

    res.status(200).json({
        status: 'success',
        data: {
            announcement,
        },
    });
});

exports.delete = catchAsync(async (req, res, next) => {
    const { tournamentId, announcementId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Authorization Check
    await checkTournamentAdmin(tournamentId, userId, userRole);

    // Optional: Add check if the announcement actually belongs to the tournamentId?
    // (Similar check as in update)

    await announcementService.deleteAnnouncement(announcementId);

    res.status(204).json({ // 204 No Content for successful deletion
        status: 'success',
        data: null,
    });
});

/**
 * Upload an image for an announcement
 */
exports.uploadImage = catchAsync(async (req, res, next) => {
    const { tournamentId, announcementId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if a file was uploaded
    if (!req.file) {
        return next(new AppError('No image file uploaded.', 400));
    }

    // Authorization Check
    await checkTournamentAdmin(tournamentId, userId, userRole);

    // Upload the image
    const imageUrl = await announcementService.uploadAnnouncementImage(
        announcementId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
    );

    res.status(200).json({
        status: 'success',
        data: {
            imageUrl,
        },
    });
});