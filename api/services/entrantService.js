const Debate = require('../models/Debate');
const mongoose = require('mongoose');

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
}

module.exports = new EntrantService();
