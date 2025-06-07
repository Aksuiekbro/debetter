const mongoose = require('mongoose');
const User = require('../models/User');
const Debate = require('../models/Debate');
const { analyzeDebateSpeech, analyzeDebateSummary, analyzeInterimTranscript } = require('../services/aiService');
const bcrypt = require('bcrypt');

// Import Services
const debateService = require('../services/debateService');
const tournamentService = require('../services/tournamentService');
const teamService = require('../services/teamService');
const postingService = require('../services/postingService');
const transcriptService = require('../services/transcriptService');
const registrationFieldService = require('../services/registrationFieldService'); // Import registration field service


// Get all debates with filtering and sorting
exports.getDebates = async (req, res) => {
  try {
    const { search, sortBy } = req.query;

    // Build filter object
    let filter = {};

    // Handle multiple filter values as arrays
    if (req.query.categories) {
      const categories = req.query.categories.split(',');
      filter.category = { $in: categories };
    }

    if (req.query.status) {
      const statuses = req.query.status.split(',');
      filter.status = { $in: statuses };
    }

    if (req.query.difficulty) {
      const difficulties = req.query.difficulty.split(',');
      filter.difficulty = { $in: difficulties };
    }

    // Add search filter if search query exists
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'recent':
        sort = { createdAt: -1 };
        break;
      case 'popular':
        sort = { 'participants': -1 };
        break;
      case 'upcoming':
        sort = { startDate: 1 };
        break;
      case 'difficulty':
        sort = { difficulty: 1, startDate: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const debates = await Debate.find(filter)
      .sort(sort)
      .populate('creator', 'username')
      // Populate userId within participants, selecting necessary fields including _id
      .populate({
          path: 'participants.userId',
          select: 'username role _id'
      });

    // Transform the debates to include the correct counts
    const transformedDebates = debates.map(debate => {
      const debateObj = debate.toObject();
      if (debate.format === 'tournament') {
        // For tournament format, separate counts for debaters and judges
        const [debaters, judges] = [
          debate.participants.filter(p => p.role !== 'judge'),
          debate.participants.filter(p => p.role === 'judge')
        ];
        debateObj.counts = {
          debaters: debaters.length,
          judges: judges.length,
          maxDebaters: 32,
          maxJudges: 8
        };
      } else {
        // For standard format, just total participants
        debateObj.counts = {
          total: debate.participants.length,
          max: debate.maxParticipants
        };
      }
      return debateObj;
    });

    res.json(transformedDebates);
  } catch (error) {
    console.error('Error in getDebates:', error);
    res.status(500).json({ message: error.message });
  }
};

const initializeTournamentRounds = (participants) => {
  const rounds = [];
  // For a 32-participant tournament, we need 5 rounds (Round of 32, 16, 8, 4, and Finals)
  const totalRounds = 5;

  for (let i = 0; i < totalRounds; i++) {
    rounds.push({
      round: i + 1,
      matches: []
    });
  }

  // Initialize first round matches with empty slots
  const firstRound = rounds[0];
  for (let i = 0; i < 16; i++) { // 16 matches for 32 participants
    firstRound.matches.push({
      participant1: null,
      participant2: null,
      winner: null,
      judges: [],
      status: 'pending'
    });
  }

  return rounds;
};

// Create new debate
exports.createDebate = async (req, res) => {
  try {
    const debateInput = req.body;
    const creator = req.user; // User object from auth middleware

    // Ensure creator is an organizer
    if (creator.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can create tournaments.' });
    }

    // --- Start: Enforce tournament-only creation ---
    if (!debateInput.format) {
      // Default to tournament if format is missing
      debateInput.format = 'tournament';
    } else if (debateInput.format !== 'tournament') {
      // Reject if format is explicitly set to something other than tournament
      return res.status(400).json({ message: 'Only tournament creation is currently supported.' });
    }
    // --- End: Enforce tournament-only creation ---

    // Validate tournament-specific requirements using the service
    tournamentService.validateTournamentCreation(debateInput.startDate, debateInput.registrationDeadline);

    // Validate tournament formats
    if (debateInput.tournamentFormats && !Array.isArray(debateInput.tournamentFormats)) {
      return res.status(400).json({ message: 'Tournament formats must be an array.' });
    }

    // Validate league type
    const validLeagueTypes = ['school', 'university', 'open', 'other'];
    if (debateInput.leagueType && !validLeagueTypes.includes(debateInput.leagueType)) {
      return res.status(400).json({ message: 'Invalid league type. Must be one of: school, university, open, other.' });
    }

    // Prepare tournament-specific data structure using the service
    const preparedData = tournamentService.prepareTournamentData(debateInput, creator);

    // Create the debate using the debate service
    const debate = await debateService.createDebate(preparedData);

    // Respond with the created debate object
    res.status(201).json({
      status: 'success',
      data: {
        debate
      }
    });

  } catch (error) {
    console.error('Create debate error:', error);
    // Send specific error messages from validation/preparation if available
    res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to create debate'
    });
  }
};

exports.joinDebate = async (req, res) => {
  try {
    const debateId = req.params.id;
    const user = req.user; // User from auth middleware
    const { customFieldValues } = req.body; // Extract custom field values from request body

    // Validate using the service (checks existence, format, limits, deadlines, etc.)
    // The service method throws specific errors if validation fails.
    const { debate } = await tournamentService.validateJoinTournament(debateId, user._id);

    // Add participant using the service, which now returns the updated debate object
    const updatedDebate = await tournamentService.addParticipant(debate, user);

    // If custom field values were provided, save them
    if (customFieldValues && Object.keys(customFieldValues).length > 0) {
      try {
        await registrationFieldService.saveParticipantFieldValues(
          debateId,
          user._id,
          customFieldValues
        );
        console.log(`[joinDebate] Successfully saved custom fields for user ${user._id} in tournament ${debateId}`);
      } catch (fieldSaveError) {
        // Log the error but don't necessarily fail the whole join operation
        // The user is joined, but their custom fields weren't saved.
        console.error(`[joinDebate] Error saving custom fields for user ${user._id} in tournament ${debateId}:`, fieldSaveError);
        // Optionally, you could add a flag to the response indicating partial success
      }
    }

    // Respond with the updated debate object
    res.json(updatedDebate);

  } catch (error) {
    console.error('Join debate error:', error);
    // Handle specific errors from the service
    if (error.message === 'Debate not found' || error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Already a participant' ||
        error.message.includes('Maximum') ||
        error.message.includes('deadline') ||
        error.message.includes('started or ended')) {
      return res.status(400).json({ message: error.message });
    }
    // Generic error
    res.status(500).json({ message: error.message || 'Failed to join debate' });
  }
};

// Leave debate
exports.leaveDebate = async (req, res) => {
  try {
    const debateId = req.params.id;
    const userId = req.user._id;

    // Find the debate
    const debate = await Debate.findById(debateId);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Check if the user is a participant in the debate
    const participant = debate.participants.find(p => p.userId.toString() === userId.toString());
    if (!participant) {
      return res.status(400).json({ message: 'You are not a participant in this debate' });
    }

    // Remove the user from the participants list
    debate.participants = debate.participants.filter(p => p.userId.toString() !== userId.toString());

    // If the debate is of format 'tournament', update the rounds and matches
    if (debate.format === 'tournament') {
      // Reinitialize the tournament rounds
      debate.rounds = initializeTournamentRounds(debate.participants);

      // Optionally, you might want to reset the status or other fields
      // debate.status = 'pending'; // Removed: 'pending' is not a valid Debate status. Re-evaluate required status change logic if needed.
    }

    // Save the updated debate
    await debate.save();

    res.json({ message: 'Successfully left the debate', debate });
  } catch (error) {
    console.error('Leave debate error:', error);
    res.status(500).json({ message: error.message || 'Failed to leave debate' });
  }
};

// Get debates for the currently logged-in user
exports.getUserDebates = async (req, res) => {
  try {
    const userId = req.user._id; // Get user ID from the authenticated request

    // Helper function to populate and transform debates
    const populateAndTransform = (debate) => {
      const debateObj = debate.toObject();
      if (debate.format === 'tournament') {
        const [debaters, judges] = [
          debate.participants.filter(p => p.userId && p.role !== 'judge'), // Ensure userId exists
          debate.participants.filter(p => p.userId && p.role === 'judge') // Ensure userId exists
        ];
        debateObj.counts = {
          debaters: debaters.length,
          judges: judges.length,
          maxDebaters: debate.maxParticipants || 32,
          maxJudges: debate.maxJudges || 8
        };
      } else {
        debateObj.counts = {
          total: debate.participants.length,
          max: debate.maxParticipants
        };
      }
      // Add teams count if populated
      debateObj.teamCount = debate.teams ? debate.teams.length : 0;
      // Explicitly add leagueType
      debateObj.leagueType = debate.leagueType;
      return debateObj;
    };

    // Find debates created by the user
    const createdDebatesRaw = await Debate.find({ creator: userId })
                                        .populate('creator', 'username')
                                        .populate({
                                            path: 'participants.userId',
                                            select: 'username role _id'
                                        })
                                        .populate('teams'); // Populate teams

    // Find debates where the user is a participant (excluding those they created to avoid duplicates in lists)
    const participatedDebatesRaw = await Debate.find({
                                          'participants.userId': userId,
                                          creator: { $ne: userId } // Exclude debates created by the user
                                        })
                                        .populate('creator', 'username')
                                        .populate({
                                            path: 'participants.userId',
                                            select: 'username role _id'
                                        })
                                        .populate('teams'); // Populate teams

    // Transform both lists
    const createdDebates = createdDebatesRaw.map(populateAndTransform);
    const participatedDebates = participatedDebatesRaw.map(populateAndTransform);

    // Structure the response as expected by the frontend
    const responseData = {
      created: createdDebates,
      participated: participatedDebates
    };

    res.json(responseData); // Send the structured data

  } catch (error) {
    console.error('Error in getUserDebates:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve user debates' });
  }
};
// Get a single debate by ID
exports.getDebate = async (req, res) => {
  try {
    const debateId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(debateId)) {
        return res.status(400).json({ message: 'Invalid Debate ID format' });
    }

    // Use the Debate model (assuming it's the correct one for tournaments)
    const debate = await Debate.findById(debateId)
                                .populate('creator', 'username')
                                .populate({
                                    path: 'participants.userId',
                                    select: 'username role _id'
                                })
                                .populate('teams'); // Populate teams as well if needed

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Transform the result for consistency (optional, but good practice)
    const debateObj = debate.toObject();
    if (debate.format === 'tournament') {
        const [debaters, judges] = [
          debate.participants.filter(p => p.role !== 'judge'),
          debate.participants.filter(p => p.role === 'judge')
        ];
        debateObj.counts = {
          debaters: debaters.length,
          judges: judges.length,
          maxDebaters: debate.maxParticipants || 32,
          maxJudges: debate.maxJudges || 8
        };
      } else {
        debateObj.counts = {
          total: debate.participants.length,
          max: debate.maxParticipants
        };
      }
      // Add teams count if populated
      debateObj.teamCount = debate.teams ? debate.teams.length : 0;


    res.json(debateObj); // Return the found and transformed debate

  } catch (error) {
    console.error(`Error in getDebate for ID ${req.params.id}:`, error);
    // Distinguish between CastError (invalid ID format) and general errors
    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: 'Invalid Debate ID format' });
    }
    res.status(500).json({ message: error.message || 'Failed to retrieve debate' });
  }
};

// Get teams for a specific debate
exports.getDebateTeams = async (req, res) => {
  try {
    const { debateId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(debateId)) {
        return res.status(400).json({ message: 'Invalid Debate ID format' });
    }

    // Find the debate and populate its teams, including team members' user details
    const debate = await Debate.findById(debateId)
                              .populate({
                                path: 'teams',
                                populate: {
                                  path: 'members.userId',
                                  select: 'username email _id' // Select fields you need from User
                                }
                              });

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    res.json(debate.teams || []); // Return the populated teams array or an empty array

  } catch (error) {
    console.error(`Error in getDebateTeams for debate ID ${req.params.debateId}:`, error);
     if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: 'Invalid Debate ID format' });
    }
    res.status(500).json({ message: error.message || 'Failed to retrieve debate teams' });
  }
};
// Placeholder for registerTeamWithParticipants
exports.registerTeamWithParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamName, participants } = req.body; // Example body structure
    console.log(`[Placeholder] registerTeamWithParticipants called for tournament ${id} with team ${teamName}`);
    // TODO: Implement logic to register a team and its participants for a tournament
    res.status(501).json({ message: `registerTeamWithParticipants for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in registerTeamWithParticipants (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in registerTeamWithParticipants (placeholder)' });
  }
};
// Placeholder for updateDebate
exports.updateDebate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`[Placeholder] updateDebate called for tournament ${id} with data:`, updateData);
    // TODO: Implement logic to update a debate/tournament by ID
    res.status(501).json({ message: `updateDebate for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in updateDebate (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in updateDebate (placeholder)' });
  }
};
// Placeholder for assignTeams
exports.assignTeams = async (req, res) => {
  try {
    const { id } = req.params;
    const assignmentData = req.body;
    console.log(`[Placeholder] assignTeams called for tournament ${id} with data:`, assignmentData);
    // TODO: Implement logic to assign teams within a tournament
    res.status(501).json({ message: `assignTeams for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in assignTeams (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in assignTeams (placeholder)' });
  }
};
// Placeholder for startRoom
exports.startRoom = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Placeholder] startRoom called for tournament ${id}`);
    // TODO: Implement logic to start a debate room/match
    res.status(501).json({ message: `startRoom for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in startRoom (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in startRoom (placeholder)' });
  }
};
// Placeholder for saveTranscript
exports.saveTranscript = async (req, res) => {
  try {
    const { id } = req.params;
    const { transcript } = req.body;
    console.log(`[Placeholder] saveTranscript called for tournament ${id}`);
    // TODO: Implement logic to save a debate transcript
    res.status(501).json({ message: `saveTranscript for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in saveTranscript (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in saveTranscript (placeholder)' });
  }
};
// Placeholder for analyzeFinalDebate
exports.analyzeFinalDebate = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Placeholder] analyzeFinalDebate called for tournament ${id}`);
    // TODO: Implement logic to trigger final debate analysis
    res.status(501).json({ message: `analyzeFinalDebate for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in analyzeFinalDebate (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in analyzeFinalDebate (placeholder)' });
  }
};
// Placeholder for analyzeInterim
exports.analyzeInterim = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Placeholder] analyzeInterim called for tournament ${id}`);
    // TODO: Implement logic to trigger interim debate analysis
    res.status(501).json({ message: `analyzeInterim for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in analyzeInterim (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in analyzeInterim (placeholder)' });
  }
};
// Placeholder for updateTournamentBrackets
exports.updateTournamentBrackets = async (req, res) => {
  try {
    const { id } = req.params;
    const { brackets } = req.body;
    console.log(`[Placeholder] updateTournamentBrackets called for tournament ${id}`);
    // TODO: Implement logic to update tournament brackets
    res.status(501).json({ message: `updateTournamentBrackets for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in updateTournamentBrackets (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in updateTournamentBrackets (placeholder)' });
  }
};
// Placeholder for generateTournamentBracket
exports.generateTournamentBracket = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Placeholder] generateTournamentBracket called for tournament ${id}`);
    // TODO: Implement logic to generate the initial tournament bracket
    res.status(501).json({ message: `generateTournamentBracket for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in generateTournamentBracket (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in generateTournamentBracket (placeholder)' });
  }
};
// Placeholder for updateTournamentMatch
exports.updateTournamentMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { matchId, winner } = req.body; // Example body structure
    console.log(`[Placeholder] updateTournamentMatch called for tournament ${id}, match ${matchId}`);
    // TODO: Implement logic to update a specific tournament match result
    res.status(501).json({ message: `updateTournamentMatch for tournament ${id}, match ${matchId} not yet implemented.` });
  } catch (error) {
    console.error(`Error in updateTournamentMatch (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in updateTournamentMatch (placeholder)' });
  }
};
// Placeholder for createTeam
exports.createTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const teamData = req.body;
    console.log(`[Placeholder] createTeam called for tournament ${id} with data:`, teamData);
    // TODO: Implement logic to create a team within a tournament
    res.status(501).json({ message: `createTeam for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in createTeam (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in createTeam (placeholder)' });
  }
};
// Placeholder for updateTeam
exports.updateTeam = async (req, res) => {
  try {
    const { id, teamId } = req.params;
    const teamUpdateData = req.body;
    console.log(`[Placeholder] updateTeam called for tournament ${id}, team ${teamId} with data:`, teamUpdateData);
    // TODO: Implement logic to update a team within a tournament
    res.status(501).json({ message: `updateTeam for tournament ${id}, team ${teamId} not yet implemented.` });
  } catch (error) {
    console.error(`Error in updateTeam (placeholder) for tournament ${req.params.id}, team ${req.params.teamId}:`, error);
    res.status(500).json({ message: error.message || 'Failed in updateTeam (placeholder)' });
  }
};
// Placeholder for deleteTeam
exports.deleteTeam = async (req, res) => {
  try {
    const { id, teamId } = req.params;
    console.log(`[Placeholder] deleteTeam called for tournament ${id}, team ${teamId}`);
    // TODO: Implement logic to delete a team from a tournament
    res.status(501).json({ message: `deleteTeam for tournament ${id}, team ${teamId} not yet implemented.` });
  } catch (error) {
    console.error(`Error in deleteTeam (placeholder) for tournament ${req.params.id}, team ${req.params.teamId}:`, error);
    res.status(500).json({ message: error.message || 'Failed in deleteTeam (placeholder)' });
  }
};
// Placeholder for addParticipant
exports.addParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const participantData = req.body;
    console.log(`[Placeholder] addParticipant called for tournament ${id} with data:`, participantData);
    // TODO: Implement logic to add a participant to a tournament
    res.status(501).json({ message: `addParticipant for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in addParticipant (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in addParticipant (placeholder)' });
  }
};
// Placeholder for updateParticipant
exports.updateParticipant = async (req, res) => {
  try {
    const { id, participantUserId } = req.params;
    const participantUpdateData = req.body;
    console.log(`[Placeholder] updateParticipant called for tournament ${id}, user ${participantUserId} with data:`, participantUpdateData);
    // TODO: Implement logic to update a participant within a tournament
    res.status(501).json({ message: `updateParticipant for tournament ${id}, user ${participantUserId} not yet implemented.` });
  } catch (error) {
    console.error(`Error in updateParticipant (placeholder) for tournament ${req.params.id}, user ${req.params.participantUserId}:`, error);
    res.status(500).json({ message: error.message || 'Failed in updateParticipant (placeholder)' });
  }
};
// Placeholder for deleteParticipant
exports.deleteParticipant = async (req, res) => {
  try {
    const { id, participantUserId } = req.params;
    console.log(`[Placeholder] deleteParticipant called for tournament ${id}, user ${participantUserId}`);
    // TODO: Implement logic to delete a participant from a tournament
    res.status(501).json({ message: `deleteParticipant for tournament ${id}, user ${participantUserId} not yet implemented.` });
  } catch (error) {
    console.error(`Error in deleteParticipant (placeholder) for tournament ${req.params.id}, user ${req.params.participantUserId}:`, error);
    res.status(500).json({ message: error.message || 'Failed in deleteParticipant (placeholder)' });
  }
};
// Placeholder for createApfPosting
exports.createApfPosting = async (req, res) => {
  try {
    const { id } = req.params;
    const postingData = req.body;
    console.log(`[Placeholder] createApfPosting called for tournament ${id} with data:`, postingData);
    // TODO: Implement logic to create an APF posting for a tournament
    res.status(501).json({ message: `createApfPosting for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in createApfPosting (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in createApfPosting (placeholder)' });
  }
};
// Placeholder for createApfBatchPostings
exports.createApfBatchPostings = async (req, res) => {
  try {
    const { id } = req.params;
    const { postings } = req.body; // Example body structure
    console.log(`[Placeholder] createApfBatchPostings called for tournament ${id}`);
    // TODO: Implement logic to create multiple APF postings in batch
    res.status(501).json({ message: `createApfBatchPostings for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in createApfBatchPostings (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in createApfBatchPostings (placeholder)' });
  }
};
// Placeholder for updateApfPostingStatus
exports.updateApfPostingStatus = async (req, res) => {
  try {
    const { id, postingId } = req.params;
    const { status } = req.body; // Example body structure
    console.log(`[Placeholder] updateApfPostingStatus called for tournament ${id}, posting ${postingId} to status ${status}`);
    // TODO: Implement logic to update the status of an APF posting
    res.status(501).json({ message: `updateApfPostingStatus for tournament ${id}, posting ${postingId} not yet implemented.` });
  } catch (error) {
    console.error(`Error in updateApfPostingStatus (placeholder) for tournament ${req.params.id}, posting ${req.params.postingId}:`, error);
    res.status(500).json({ message: error.message || 'Failed in updateApfPostingStatus (placeholder)' });
  }
};
// Placeholder for sendApfGameReminder
exports.sendApfGameReminder = async (req, res) => {
  try {
    const { id, postingId } = req.params;
    console.log(`[Placeholder] sendApfGameReminder called for tournament ${id}, posting ${postingId}`);
    // TODO: Implement logic to send reminders for an APF game/posting
    res.status(501).json({ message: `sendApfGameReminder for tournament ${id}, posting ${postingId} not yet implemented.` });
  } catch (error) {
    console.error(`Error in sendApfGameReminder (placeholder) for tournament ${req.params.id}, posting ${req.params.postingId}:`, error);
    res.status(500).json({ message: error.message || 'Failed in sendApfGameReminder (placeholder)' });
  }
};
// Placeholder for uploadAudio
exports.uploadAudio = async (req, res) => {
  try {
    const { id, postingId } = req.params;
    console.log(`[Placeholder] uploadAudio called for tournament ${id}, posting ${postingId}`);
    // TODO: Implement logic to handle audio upload for a posting
    // Note: Actual file handling is done by uploadMiddleware, this controller handles post-upload logic.
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded.' });
    }
    res.status(501).json({ message: `uploadAudio for tournament ${id}, posting ${postingId} not yet implemented. File received: ${req.file.originalname}` });
  } catch (error) {
    console.error(`Error in uploadAudio (placeholder) for tournament ${req.params.id}, posting ${req.params.postingId}:`, error);
    res.status(500).json({ message: error.message || 'Failed in uploadAudio (placeholder)' });
  }
};
// Placeholder for uploadBallot
exports.uploadBallot = async (req, res) => {
  try {
    const { id, postingId } = req.params;
    console.log(`[Placeholder] uploadBallot called for tournament ${id}, posting ${postingId}`);
    // TODO: Implement logic to handle ballot upload for a posting
    // Note: Actual file handling is done by uploadMiddleware, this controller handles post-upload logic.
    if (!req.file) {
      return res.status(400).json({ message: 'No ballot file uploaded.' });
    }
    res.status(501).json({ message: `uploadBallot for tournament ${id}, posting ${postingId} not yet implemented. File received: ${req.file.originalname}` });
  } catch (error) {
    console.error(`Error in uploadBallot (placeholder) for tournament ${req.params.id}, posting ${req.params.postingId}:`, error);
    res.status(500).json({ message: error.message || 'Failed in uploadBallot (placeholder)' });
  }
};
// Placeholder for registerParticipants
exports.registerParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { judges, debaters } = req.body; // Example body structure
    console.log(`[Placeholder] registerParticipants called for tournament ${id}`);
    // TODO: Implement logic to register multiple participants (judges/debaters)
    res.status(501).json({ message: `registerParticipants for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in registerParticipants (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in registerParticipants (placeholder)' });
  }
};
// Placeholder for generateTestData
exports.generateTestData = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Placeholder] generateTestData called for tournament ${id}`);
    // TODO: Implement logic to generate test data for a tournament
    res.status(501).json({ message: `generateTestData for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in generateTestData (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in generateTestData (placeholder)' });
  }
};
// Placeholder for uploadMap
exports.uploadMap = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Placeholder] uploadMap called for tournament ${id}`);
    // TODO: Implement logic to handle map image upload for a tournament
    // Note: Actual file handling is done by uploadMiddleware, this controller handles post-upload logic.
    if (!req.file) {
      return res.status(400).json({ message: 'No map image file uploaded.' });
    }
    res.status(501).json({ message: `uploadMap for tournament ${id} not yet implemented. File received: ${req.file.originalname}` });
  } catch (error) {
    console.error(`Error in uploadMap (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in uploadMap (placeholder)' });
  }
};
// Placeholder for deleteMap
exports.deleteMap = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Placeholder] deleteMap called for tournament ${id}`);
    // TODO: Implement logic to delete the map for a tournament
    res.status(501).json({ message: `deleteMap for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in deleteMap (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in deleteMap (placeholder)' });
  }
};
// Placeholder for updateOrganizers
exports.updateOrganizers = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizers } = req.body; // Example body structure
    console.log(`[Placeholder] updateOrganizers called for tournament ${id}`);
    // TODO: Implement logic to update the organizers list for a tournament
    res.status(501).json({ message: `updateOrganizers for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in updateOrganizers (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in updateOrganizers (placeholder)' });
  }
};
// Placeholder for getJudgeLeaderboard
exports.getJudgeLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Placeholder] getJudgeLeaderboard called for tournament ${id}`);
    // TODO: Implement logic to retrieve the judge leaderboard for a tournament
    res.status(501).json({ message: `getJudgeLeaderboard for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in getJudgeLeaderboard (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in getJudgeLeaderboard (placeholder)' });
  }
};
// Placeholder for getParticipantStandings
exports.getParticipantStandings = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Placeholder] getParticipantStandings called for tournament ${id}`);
    // TODO: Implement logic to retrieve participant standings for a tournament
    res.status(501).json({ message: `getParticipantStandings for tournament ${id} not yet implemented.` });
  } catch (error) {
    console.error(`Error in getParticipantStandings (placeholder) for tournament ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed in getParticipantStandings (placeholder)' });
  }
};