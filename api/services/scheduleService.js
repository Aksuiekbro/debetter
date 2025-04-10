const ScheduleItem = require('../models/ScheduleItem');
const Debate = require('../models/Debate'); // Needed to check tournament existence/permissions potentially
const mongoose = require('mongoose');

/**
 * Creates a new schedule item for a tournament.
 * @param {object} itemData - Data for the new schedule item { time, eventDescription, location }.
 * @param {string} tournamentId - The ID of the tournament.
 * @param {string} userId - The ID of the user creating the item.
 * @returns {Promise<object>} The created schedule item document.
 * @throws {Error} If the tournament doesn't exist or validation fails.
 */
const create = async (itemData, tournamentId, userId) => {
    // Basic validation (more comprehensive validation happens at model level)
    if (!itemData || !itemData.time || !itemData.eventDescription || !tournamentId || !userId) {
        throw new Error('Missing required fields for creating schedule item.');
    }

    // Optional: Check if the tournament exists (though controller should handle primary auth/existence)
    // const tournament = await Debate.findById(tournamentId);
    // if (!tournament) {
    //     throw new Error('Tournament not found.');
    // }
    // // Optional: Add permission check here if not solely relying on controller middleware
    // if (tournament.creator.toString() !== userId /* && !tournament.organizers.includes(userId) */) {
    //     throw new Error('User does not have permission to add schedule items to this tournament.');
    // }


    const newItem = new ScheduleItem({
        ...itemData,
        tournamentId: new mongoose.Types.ObjectId(tournamentId),
        createdBy: new mongoose.Types.ObjectId(userId),
    });
    await newItem.save();
    return newItem;
};

/**
 * Finds all schedule items for a specific tournament.
 * @param {string} tournamentId - The ID of the tournament.
 * @returns {Promise<Array<object>>} A list of schedule item documents.
 */
const findByTournamentId = async (tournamentId) => {
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        throw new Error('Invalid Tournament ID format');
    }
    return await ScheduleItem.find({ tournamentId: new mongoose.Types.ObjectId(tournamentId) }).sort({ time: 1 }); // Sort by time
};

/**
 * Updates an existing schedule item.
 * @param {string} itemId - The ID of the schedule item to update.
 * @param {object} updateData - The fields to update { time, eventDescription, location }.
 * @param {string} tournamentId - The ID of the tournament (for verification).
 * @param {string} userId - The ID of the user performing the update (for permission checks in controller).
 * @returns {Promise<object|null>} The updated schedule item document or null if not found/permission denied.
 * @throws {Error} If item not found or doesn't belong to the specified tournament.
 */
const update = async (itemId, updateData, tournamentId, userId) => {
     if (!mongoose.Types.ObjectId.isValid(itemId) || !mongoose.Types.ObjectId.isValid(tournamentId)) {
        throw new Error('Invalid ID format for item or tournament.');
    }

    const item = await ScheduleItem.findById(itemId);

    if (!item) {
        throw new Error('Schedule item not found.');
    }

    // Security Check: Ensure the item belongs to the correct tournament
    if (item.tournamentId.toString() !== tournamentId) {
        console.warn(`Attempt to update schedule item ${itemId} from tournament ${item.tournamentId} via tournament ${tournamentId} route by user ${userId}`);
        throw new Error('Schedule item does not belong to the specified tournament.');
    }

    // Optional: Add permission check here based on userId if needed, although controller is primary place

    // Update allowed fields
    if (updateData.time) item.time = updateData.time;
    if (updateData.eventDescription) item.eventDescription = updateData.eventDescription;
    // Allow explicitly setting location to null or empty string to remove it
    if (updateData.hasOwnProperty('location')) item.location = updateData.location;


    await item.save();
    return item;
};

/**
 * Deletes a schedule item.
 * @param {string} itemId - The ID of the schedule item to delete.
 * @param {string} tournamentId - The ID of the tournament (for verification).
 * @param {string} userId - The ID of the user performing the deletion (for permission checks in controller).
 * @returns {Promise<object|null>} The result of the deletion operation.
 * @throws {Error} If item not found or doesn't belong to the specified tournament.
 */
const deleteItem = async (itemId, tournamentId, userId) => {
     if (!mongoose.Types.ObjectId.isValid(itemId) || !mongoose.Types.ObjectId.isValid(tournamentId)) {
        throw new Error('Invalid ID format for item or tournament.');
    }

    const item = await ScheduleItem.findById(itemId);

    if (!item) {
        throw new Error('Schedule item not found.');
    }

    // Security Check: Ensure the item belongs to the correct tournament
    if (item.tournamentId.toString() !== tournamentId) {
         console.warn(`Attempt to delete schedule item ${itemId} from tournament ${item.tournamentId} via tournament ${tournamentId} route by user ${userId}`);
        throw new Error('Schedule item does not belong to the specified tournament.');
    }

     // Optional: Add permission check here based on userId if needed

    return await ScheduleItem.findByIdAndDelete(itemId);
};


module.exports = {
    create,
    findByTournamentId,
    update,
    deleteItem, // Renamed export to avoid conflict with reserved keyword 'delete'
};