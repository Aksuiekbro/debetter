const mongoose = require('mongoose');
const Debate = require('../models/Debate');
const User = require('../models/User');
// Import other services if needed (e.g., tournamentService)

class DebateService {
  // Example: Get a single debate by ID
  async getDebateById(debateId) {
    try {
      const debate = await Debate.findById(debateId)
        .populate('creator', 'username role')
        .populate('participants', 'username role')
        .populate('teams.members.userId', 'username role email') // Populate team member user data
        .lean() // Use lean for performance if not modifying directly
        .exec();

      if (!debate) {
        throw new Error('Debate not found'); // Or use a custom error class
      }

      // Add participant counts for tournament format (example of logic moved from controller)
      if (debate.format === 'tournament') {
        debate.counts = {
          debaters: debate.participants?.filter(p => p.role !== 'judge').length || 0,
          judges: debate.participants?.filter(p => p.role === 'judge').length || 0,
          maxDebaters: debate.tournamentSettings?.maxDebaters || 32, // Use defaults
          maxJudges: debate.tournamentSettings?.maxJudges || 8,
        };
      }

      return debate;
    } catch (error) {
      console.error(`Error fetching debate ${debateId}:`, error);
      throw error; // Re-throw for controller to handle
    }
  }

  // Creates a new debate document
  async createDebate(debateData) {
    try {
      // The debateData should already be prepared by the controller/tournamentService
      const debate = await Debate.create(debateData);
      // Note: Population might be needed depending on what the controller needs to return
      // If the full object is needed immediately, populate here or in the controller after creation.
      return debate;
    } catch (error) {
      console.error('Error creating debate in service:', error);
      // Handle specific mongoose validation errors if needed
      throw error;
    }
  }

  // TODO: Add methods for getDebates, joinDebate, leaveDebate, getUserDebates, updateDebate etc.
}

module.exports = new DebateService();