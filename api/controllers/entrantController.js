const entrantService = require('../services/entrantService');

/**
 * Get all entrants for a tournament with their check-in status
 */
exports.getEntrants = async (req, res) => {
  try {
    const { id: tournamentId } = req.params; // Use 'id' from route param
    
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
    const { id: tournamentId, entrantId } = req.params; // Use 'id' from route param
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
    const { id: tournamentId, entrantId } = req.params; // Use 'id' from route param
    
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

/**
 * Register a team for a specific tournament
 */
exports.registerTeamForTournament = async (req, res) => {
  console.log('registerTeamForTournament controller called'); // Log entry
  try {
    const { tournamentId } = req.params;
    const teamData = req.body; // Contains team name, members, custom field answers, etc.

    console.log(`Registering team for tournament: ${tournamentId}`);
    console.log('Team Data:', teamData);

    // TODO: Call the registration service function
    // const result = await entrantService.registerTeam(tournamentId, teamData);

    // Placeholder response for now
    res.status(201).json({
      success: true,
      message: 'Team registration endpoint hit successfully (logic pending).',
      data: { tournamentId, receivedData: teamData }
    });

  } catch (error) {
    console.error('Error registering team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register team'
    });
  }
};
