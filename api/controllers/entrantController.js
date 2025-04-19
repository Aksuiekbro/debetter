const entrantService = require('../services/entrantService');

/**
 * Get all entrants for a tournament with their check-in status
 */
exports.getEntrants = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const entrants = await entrantService.getEntrantsForTournament(tournamentId);
    
    res.status(200).json({
      success: true,
      data: {
        entrants: entrants.map(entrant => ({
          userId: entrant.userId._id,
          name: entrant.userId.username,
          email: entrant.userId.email,
          phoneNumber: entrant.userId.phoneNumber,
          club: entrant.userId.club,
          tournamentRole: entrant.tournamentRole,
          teamId: entrant.teamId,
          isPresent: entrant.isPresent || false,
          checkedInAt: entrant.checkedInAt,
          checkedInBy: entrant.checkedInBy ? {
            id: entrant.checkedInBy._id,
            name: entrant.checkedInBy.username
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('Error getting entrants:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get entrants'
    });
  }
};

/**
 * Check in an entrant
 */
exports.checkInEntrant = async (req, res) => {
  try {
    const { tournamentId, entrantId } = req.params;
    const userId = req.user._id;
    
    const entrant = await entrantService.checkInEntrant(tournamentId, entrantId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Entrant checked in successfully',
      data: {
        userId: entrant.userId,
        isPresent: entrant.isPresent,
        checkedInAt: entrant.checkedInAt
      }
    });
  } catch (error) {
    console.error('Error checking in entrant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check in entrant'
    });
  }
};

/**
 * Check out an entrant
 */
exports.checkOutEntrant = async (req, res) => {
  try {
    const { tournamentId, entrantId } = req.params;
    
    const entrant = await entrantService.checkOutEntrant(tournamentId, entrantId);
    
    res.status(200).json({
      success: true,
      message: 'Entrant checked out successfully',
      data: {
        userId: entrant.userId,
        isPresent: entrant.isPresent
      }
    });
  } catch (error) {
    console.error('Error checking out entrant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check out entrant'
    });
  }
};
