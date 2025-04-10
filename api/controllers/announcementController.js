const announcementService = require('../services/announcementService');
const Debate = require('../models/Debate'); // To check tournament creator for authorization
const catchAsync = require('../utils/catchAsync'); // Assuming you have a catchAsync utility
const AppError = require('../utils/appError'); // Assuming you have an AppError utility

// Authorization Middleware Helper (can be refactored into separate middleware if used elsewhere)
const checkTournamentAdmin = async (tournamentId, userId, userRole) => {
    const debate = await Debate.findById(tournamentId);
    if (!debate) {
        throw new AppError('Tournament not found.', 404);
    }
    // Check if user is the creator or an admin
    // Ensure comparison is done correctly (e.g., converting ObjectId to string if necessary)
    const isCreator = debate.creator.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    if (!isCreator && !isAdmin) {
        throw new AppError('You do not have permission to perform this action on this tournament.', 403);
    }
    return true; // Authorized
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