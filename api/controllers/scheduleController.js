const scheduleService = require('../services/scheduleService');
const Tournament = require('../models/Tournament'); // To verify tournament existence and user permissions
const mongoose = require('mongoose');

// Helper function to check if user is organizer/admin for the tournament
// TODO: Adapt this if there's a specific 'organizers' array or different logic
const checkTournamentPermission = async (tournamentId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        // Already handled in service, but good practice here too
        throw { status: 400, message: 'Invalid Tournament ID format' };
    }
    const tournament = await Tournament.findById(tournamentId).select('creator organizers'); // Only select needed field
    if (!tournament) {
        throw { status: 404, message: 'Tournament not found' };
    }
    // Check if the user is the creator of the tournament
    // Add || tournament.organizers.includes(userId) if an organizers array exists
    // Check if the user is the creator OR listed in the organizers array
    if (tournament.creator.toString() !== userId && (!tournament.organizers || !tournament.organizers.map(org => org.toString()).includes(userId))) {
        throw { status: 403, message: 'User does not have permission to manage schedule for this tournament' };
    }
    return true; // Permission granted
};


/**
 * Create a new schedule item for a tournament.
 * POST /api/debates/:tournamentId/schedule
 * Requires Organizer/Admin role for the tournament.
 */
const createScheduleItem = async (req, res, next) => {
    const { tournamentId } = req.params;
    const { time, eventDescription, location } = req.body;
    const userId = req.user.id; // Assuming auth middleware adds user to req

    try {
        // 1. Check Permissions
        await checkTournamentPermission(tournamentId, userId);

        // 2. Basic Input Validation (More specific validation in Model/Service)
        if (!time || !eventDescription) {
            return res.status(400).json({ message: 'Missing required fields: time and eventDescription' });
        }

        // 3. Call Service
        const newItemData = { time, eventDescription, location };
        const newItem = await scheduleService.create(newItemData, tournamentId, userId);

        res.status(201).json(newItem);
    } catch (error) {
        console.error(`Error creating schedule item for tournament ${tournamentId}:`, error);
        // Pass specific errors with status, otherwise generic 500
        next(error.status ? error : new Error('Failed to create schedule item'));
    }
};

/**
 * Get all schedule items for a specific tournament.
 * GET /api/debates/:tournamentId/schedule
 * Accessible by authenticated users.
 */
const getScheduleItemsForTournament = async (req, res, next) => {
    const { id: tournamentId } = req.params; // Extract 'id' from params and rename to tournamentId

    try {
        // Optional: Check if tournament exists if needed, but service handles invalid ID
        // const tournamentExists = await Debate.findById(tournamentId).select('_id');
        // if (!tournamentExists) {
        //     return res.status(404).json({ message: 'Tournament not found' });
        // }

        const items = await scheduleService.findByTournamentId(tournamentId);
        res.status(200).json(items);
    } catch (error) {
        console.error(`Error fetching schedule items for tournament ${tournamentId}:`, error);
        next(error.status ? error : new Error('Failed to fetch schedule items'));
    }
};

/**
 * Update a specific schedule item.
 * PUT /api/debates/:tournamentId/schedule/:itemId
 * Requires Organizer/Admin role for the tournament.
 */
const updateScheduleItem = async (req, res, next) => {
    const { tournamentId, itemId } = req.params;
    const updateData = req.body; // Contains fields to update { time, eventDescription, location }
    const userId = req.user.id;

    try {
        // 1. Check Permissions
        await checkTournamentPermission(tournamentId, userId);

        // 2. Call Service (Service handles item existence and belonging check)
        const updatedItem = await scheduleService.update(itemId, updateData, tournamentId, userId);

        if (!updatedItem) {
             // Should be caught by service errors, but as a fallback
            return res.status(404).json({ message: 'Schedule item not found or update failed' });
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        console.error(`Error updating schedule item ${itemId} for tournament ${tournamentId}:`, error);
        next(error.status ? error : new Error('Failed to update schedule item'));
    }
};

/**
 * Delete a specific schedule item.
 * DELETE /api/debates/:tournamentId/schedule/:itemId
 * Requires Organizer/Admin role for the tournament.
 */
const deleteScheduleItem = async (req, res, next) => {
    const { tournamentId, itemId } = req.params;
    const userId = req.user.id;

    try {
        // 1. Check Permissions
        await checkTournamentPermission(tournamentId, userId);

        // 2. Call Service (Service handles item existence and belonging check)
        const result = await scheduleService.deleteItem(itemId, tournamentId, userId);

         if (!result) {
             // Should be caught by service errors, but as a fallback
            return res.status(404).json({ message: 'Schedule item not found or deletion failed' });
        }

        res.status(200).json({ message: 'Schedule item deleted successfully' }); // Or status 204 No Content
    } catch (error) {
        console.error(`Error deleting schedule item ${itemId} for tournament ${tournamentId}:`, error);
        next(error.status ? error : new Error('Failed to delete schedule item'));
    }
};


module.exports = {
    createScheduleItem,
    getScheduleItemsForTournament,
    updateScheduleItem,
    deleteScheduleItem,
};