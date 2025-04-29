const Debate = require('../models/Debate');
const Team = require('../models/Team'); // Added Team model
const registrationFieldService = require('./registrationFieldService'); // Assuming this service exists
const mongoose = require('mongoose');
const AppError = require('../utils/appError'); // Assuming an error utility exists

class EntrantService {
  /**
   * Get all entrants for a tournament with their check-in status
   * @param {string} tournamentId - The ID of the tournament
   * @returns {Promise<Array>} - Array of entrants with their details
   */
  async getEntrantsForTournament(tournamentId) {
    const debate = await Debate.findById(tournamentId)
      .populate('participants.userId', 'username email phoneNumber club')
      .populate('participants.checkedInBy', 'username _id')
      .lean();

    if (!debate) throw new Error('Tournament not found');

    return debate.participants || [];
  }

  /**
   * Check in an entrant (mark as present)
   * @param {string} tournamentId - The ID of the tournament
   * @param {string} entrantId - The ID of the entrant (userId in participants array)
   * @param {string} adminId - The ID of the admin performing the check-in
   * @returns {Promise<Object>} - The updated entrant object
   */
  async checkInEntrant(tournamentId, entrantId, adminId) {
    const debate = await Debate.findById(tournamentId);
    if (!debate) throw new Error('Tournament not found');
    if (!debate.participants || !Array.isArray(debate.participants)) {
      throw new Error('Tournament has no participants');
    }

    // Find the participant by userId
    const participantIndex = debate.participants.findIndex(
      p => p.userId.toString() === entrantId
    );

    if (participantIndex === -1) {
      throw new Error('Entrant not found in tournament');
    }

    // Update entrant presence status
    debate.participants[participantIndex].isPresent = true;
    debate.participants[participantIndex].checkedInAt = new Date();
    debate.participants[participantIndex].checkedInBy = adminId;

    debate.markModified('participants'); // Important for updating nested arrays
    await debate.save();

    return debate.participants[participantIndex];
  }

  /**
   * Check out an entrant (mark as not present)
   * @param {string} tournamentId - The ID of the tournament
   * @param {string} entrantId - The ID of the entrant (userId in participants array)
   * @returns {Promise<Object>} - The updated entrant object
   */
  async checkOutEntrant(tournamentId, entrantId) {
    const debate = await Debate.findById(tournamentId);
    if (!debate) throw new Error('Tournament not found');
    if (!debate.participants || !Array.isArray(debate.participants)) {
      throw new Error('Tournament has no participants');
    }

    // Find the participant by userId
    const participantIndex = debate.participants.findIndex(
      p => p.userId.toString() === entrantId
    );

    if (participantIndex === -1) {
      throw new Error('Entrant not found in tournament');
    }

    // Update entrant presence status
    debate.participants[participantIndex].isPresent = false;
    debate.participants[participantIndex].checkedInAt = null;
    // We keep the checkedInBy field for audit purposes

    debate.markModified('participants'); // Important for updating nested arrays
    await debate.save();

    return debate.participants[participantIndex];
  }
/**
   * Register a team for a specific tournament.
   * @param {string} tournamentId - The ID of the tournament.
   * @param {object} teamData - Data for the team being registered. Expected structure: { teamName: string, member1: string, member2: string, customFieldAnswers: [{ fieldId: string, answer: string }] }
   * @returns {Promise<Object>} - The newly created team object or throws an error.
   */
  async registerTeam(tournamentId, teamData) {
    console.log(`Service: Registering team for tournament ${tournamentId}`);

    // 1. Fetch custom registration fields for the tournament.
    let customFields = [];
    try {
      // Assuming registrationFieldService exists and has this method
      customFields = await registrationFieldService.getFieldsForTournament(tournamentId);
      console.log(`Fetched ${customFields.length} custom fields for tournament.`);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      // Decide if registration can proceed without custom fields or throw
      // For now, let's assume it's an error if we can't fetch them
      throw new AppError('Failed to fetch registration fields for the tournament.', 500);
    }

    // 2. Validate standard team data.
    const { teamName, member1, member2, customFieldAnswers } = teamData;
    if (!teamName || !member1 || !member2) {
      throw new AppError('Missing required team information (team name, member1, member2).', 400);
    }
    // Add more specific validation for member data if needed (e.g., check if they are valid user IDs)

    // 3. Validate custom field answers against fetched custom fields.
    const providedAnswerMap = new Map((customFieldAnswers || []).map(ans => [ans.fieldId.toString(), ans.answer])); // Handle case where customFieldAnswers might be null/undefined

    for (const field of customFields) {
      const fieldIdStr = field._id.toString();
      if (field.required && !providedAnswerMap.has(fieldIdStr)) {
        // Check if the answer is empty string, treat as missing if required
        const answer = providedAnswerMap.get(fieldIdStr);
        if (answer === undefined || answer === null || answer === '') {
             throw new AppError(`Missing required answer for custom field: ${field.label}`, 400);
        }
      }
      // Add more validation here if needed (e.g., check answer type, length, options)
    }

    // 4. Format Custom Answers (ensure they match the schema)
    const formattedAnswers = (customFieldAnswers || []).map(ans => {
        if (!ans.fieldId) {
            console.warn("Skipping custom answer due to missing fieldId:", ans);
            return null; // Skip if fieldId is missing
        }
        try {
            return {
                fieldId: new mongoose.Types.ObjectId(ans.fieldId), // Ensure it's ObjectId
                answer: ans.answer || '' // Default to empty string if answer is missing/null
            };
        } catch (e) {
            console.error(`Invalid ObjectId format for fieldId: ${ans.fieldId}. Skipping answer.`);
            return null; // Skip if ObjectId conversion fails
        }
    }).filter(ans => ans !== null); // Remove null entries


    // 5. Create/save the new Team entry.
    try {
      const newTeam = new Team({
        tournament: new mongoose.Types.ObjectId(tournamentId),
        teamName,
        // Assuming member1 and member2 are User ObjectIds
        // Adjust based on Team model schema for members
        members: [
            { user: new mongoose.Types.ObjectId(member1), role: 'debater' }, // Example structure
            { user: new mongoose.Types.ObjectId(member2), role: 'debater' }  // Example structure
        ],
        customFieldAnswers: formattedAnswers,
        // Add other default fields if necessary
      });

      const savedTeam = await newTeam.save();
      console.log(`Team ${savedTeam.teamName} registered successfully with ID: ${savedTeam._id}`);

      // Optional: Add team to tournament's participants/teams array if needed
      // const tournament = await Tournament.findById(tournamentId);
      // if (tournament) {
      //   tournament.teams.push(savedTeam._id); // Adjust based on Tournament schema
      //   await tournament.save();
      // }

      // 6. Return success response.
      return savedTeam;

    } catch (error) {
      console.error("Error saving team:", error);
      if (error.name === 'ValidationError') {
        // Improve validation error message parsing if possible
        const messages = Object.values(error.errors).map(e => e.message);
        throw new AppError(`Team validation failed: ${messages.join(', ')}`, 400);
      }
      // Handle potential duplicate team name errors if the schema enforces uniqueness
      if (error.code === 11000) { // MongoDB duplicate key error
          // Extract the field that caused the duplicate error if possible
          const field = Object.keys(error.keyValue)[0];
          throw new AppError(`A team with this ${field} already exists in this tournament.`, 409);
      }
      // Handle CastError (e.g., invalid ObjectId format for members)
      if (error.name === 'CastError') {
          throw new AppError(`Invalid data format provided: ${error.message}`, 400);
      }
      throw new AppError('Failed to register team due to a server error.', 500);
    }
  }
}

module.exports = new EntrantService();
