const mongoose = require('mongoose');
const Debate = require('../models/Debate'); // Assuming Debate model holds tournament info
const User = require('../models/User'); // Needed if checking user roles like admin

// Middleware to check if the user is the creator or an organizer of the tournament
const isTournamentOrganizer = async (req, res, next) => {
  try {
    const tournamentId = req.params.id || req.params.tournamentId; // Get ID from route params
    const userId = req.user.id; // User ID from protect middleware

    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ message: 'Invalid Tournament ID format' });
    }

    // Fetch the tournament, selecting only necessary fields
    const tournament = await Debate.findById(tournamentId).select('creator organizers format').lean();

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Ensure it's actually a tournament
    if (tournament.format !== 'tournament') {
        return res.status(400).json({ message: 'Operation only valid for tournaments.' });
    }

    // Check if the user is the creator
    const isCreator = tournament.creator?.toString() === userId;

    // Check if the user is in the organizers array
    const isOrganizerListed = tournament.organizers?.some(orgId => orgId.toString() === userId);

    // Allow if user is creator OR listed organizer OR an admin (optional, based on requirements)
    // const isAdmin = req.user.role === 'admin'; // Uncomment if admins should always have access

    if (isCreator || isOrganizerListed /* || isAdmin */) {
      // User is authorized
      next();
    } else {
      // User is not authorized
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }
  } catch (error) {
    console.error('Tournament authorization error:', error);
    res.status(500).json({ message: 'Server error during tournament authorization' });
  }
};

module.exports = { isTournamentOrganizer };
