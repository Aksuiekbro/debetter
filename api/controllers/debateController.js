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
      .populate('participants', 'username role');

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

    let preparedData;

    // If tournament, validate and prepare specific data using the service
    if (debateInput.format === 'tournament') {
      // Validate tournament-specific requirements using the service
      tournamentService.validateTournamentCreation(debateInput.startDate, debateInput.registrationDeadline);
      // Prepare tournament-specific data structure using the service
      preparedData = tournamentService.prepareTournamentData(debateInput, creator);
    } else {
      // Prepare data for a standard debate
      preparedData = {
        ...debateInput, // title, description, category, etc.
        creator: creator._id,
        status: 'upcoming',
        participants: [{ // Creator automatically joins as Organizer
          userId: creator._id,
          tournamentRole: 'Organizer' // Assign a default role for the creator
        }],
        // Ensure fields not applicable to standard debates are undefined
        mode: undefined,
        registrationDeadline: undefined,
        tournamentSettings: undefined,
        tournamentRounds: undefined,
        teams: undefined,
        postings: undefined,
      };
    }

    // Create the debate using the debate service
    const debate = await debateService.createDebate(preparedData);

    // Respond with the created debate object
    res.status(201).json(debate);

  } catch (error) {
    console.error('Create debate error:', error);
    // Send specific error messages from validation/preparation if available
    res.status(400).json({ message: error.message || 'Failed to create debate' });
  }
};

exports.joinDebate = async (req, res) => {
  try {
    const debateId = req.params.id;
    const user = req.user; // User from auth middleware

    // Validate using the service (checks existence, format, limits, deadlines, etc.)
    // The service method throws specific errors if validation fails.
    const { debate } = await tournamentService.validateJoinTournament(debateId, user._id);

    // Add participant using the service
    const result = await tournamentService.addParticipant(debate, user);

    // Respond with success and updated counts/info
    // Note: The service currently returns counts. If the full debate object is needed,
    // the service method or this controller needs adjustment.
    // For now, returning a success message and the counts.
    res.json({
        message: 'Successfully joined tournament',
        debateId: result.debateId,
        currentDebaters: result.debaters,
        currentJudges: result.judges,
        maxDebaters: result.maxDebaters,
        maxJudges: result.maxJudges
    });

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
    const user = req.user;

    // Use the service to handle leaving the tournament/debate
    // The service handles finding the debate, validation, removing participant, and updating counts
    // Assuming leaveTournament handles both standard and tournament debates appropriately,
    // or a separate debateService.leaveDebate method is needed for standard debates.
    // For now, using tournamentService as it contains the logic.
    const { updatedDebate, updatedCounts } = await tournamentService.leaveTournament(debateId, user._id);

    // Respond with the updated debate object (or just counts if preferred)
    res.json(updatedDebate);

  } catch (error) {
    console.error('Error leaving debate:', error);
    // Handle specific errors from the service
    if (error.message === 'Debate not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'User is not a participant in this tournament' || error.message === 'User is not a participant in this debate') {
       return res.status(400).json({ message: error.message });
    }
    // Add handling for other potential errors like registration closed if implemented in service
    res.status(500).json({ message: error.message || 'Failed to leave debate' });
  }
};

// Get single debate
exports.getDebate = async (req, res) => {
  try {
    const debateId = req.params.id;
    
    if (!debateId) {
      return res.status(400).json({ message: 'Debate ID is required' });
    }

    try {
      const debate = await debateService.getDebateById(debateId);
      
      if (!debate) {
        return res.status(404).json({ message: 'Debate not found' });
      }

      // Log the state of participants for debugging
      console.log('CONTROLLER - Participants:', JSON.stringify({
        count: debate.participants?.length || 0,
        hasUserIds: debate.participants?.some(p => p.userId) || false,
        format: debate.format,
        counts: debate.counts
      }, null, 2));

      res.json(debate);
    } catch (serviceError) {
      console.error('Service error getting debate:', serviceError);
      
      if (serviceError.message === 'Invalid debate ID format') {
        return res.status(400).json({ message: 'Invalid debate ID format' });
      }
      if (serviceError.message === 'Debate not found') {
        return res.status(404).json({ message: 'Debate not found' });
      }
      
      // For other service errors, return a 500
      throw serviceError;
    }
  } catch (error) {
    console.error('Error in getDebate controller:', error);
    res.status(500).json({ 
      message: 'Failed to get debate details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get details for a specific posting within a debate
exports.getPostingDetails = async (req, res) => {
  try {
    const { id: debateId, postingId } = req.params;

    // Use the postingService to fetch the details
    // Assuming postingService has a method like getPostingDetailsById
    const postingDetails = await postingService.getPostingById(debateId, postingId);

    if (!postingDetails) {
      return res.status(404).json({ message: 'Posting not found' });
    }

    res.json(postingDetails);
  } catch (error) {
    console.error('Get posting details error:', error);
    if (error.message === 'Debate not found' || error.message === 'Posting not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Failed to get posting details' });
  }
};


// Get user's debates (both created and participated)
exports.getUserDebates = async (req, res) => {
  try {
    const createdDebates = await Debate.find({ creator: req.user._id })
      .populate('creator', 'username role')
      .populate('participants', 'username role createdAt')
      .populate('teams.members.userId', 'username email _id')
      .populate({ // Populate judges within postings
        path: 'postings',
        populate: { path: 'judges', select: '_id username role' }
      })
      .sort({ createdAt: -1 })
      .lean();

    const participatedDebates = await Debate.find({
      participants: req.user._id,
      creator: { $ne: req.user._id }
    })
      .populate('creator', 'username role')
      .populate('participants', 'username role createdAt')
      .populate('teams.members.userId', 'username email _id')
      .populate({ // Populate judges within postings
        path: 'postings',
        populate: { path: 'judges', select: '_id username role' }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Process the debateData to include additional information about teams
    const processDebateData = (debates) => {
      return debates.map(debate => {
        if (debate.postings && debate.postings.length > 0) {
          debate.postings = debate.postings.map(posting => {
            // Find the team objects referenced in the posting
            const team1 = debate.teams?.find(t => t._id.toString() === posting.team1?.toString());
            const team2 = debate.teams?.find(t => t._id.toString() === posting.team2?.toString());
            
            // Add team names to the posting for easier access
            if (team1) {
              posting.team1Name = team1.name;
              posting.team1Members = team1.members;
            }
            if (team2) {
              posting.team2Name = team2.name;
              posting.team2Members = team2.members;
            }
            
            return posting;
          });
        }
        return debate;
      });
    };

    res.json({
      created: processDebateData(createdDebates),
      participated: processDebateData(participatedDebates)
    });
  } catch (error) {
    console.error('Error fetching user debates:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update debate settings (only creator can update)
exports.updateDebate = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }
    
    // Check if user is the creator
    if (debate.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only debate creator can update settings' });
    }

    // Handle basic debate information updates
    if (req.body.title) debate.title = req.body.title;
    if (req.body.description) debate.description = req.body.description;
    if (req.body.category) debate.category = req.body.category;
    if (req.body.difficulty) debate.difficulty = req.body.difficulty;
    if (req.body.startDate) debate.startDate = req.body.startDate;
    if (req.body.maxParticipants) debate.maxParticipants = req.body.maxParticipants;

    // Handle participant updates for test data registration
    if (req.body.participants && Array.isArray(req.body.participants)) {
      // Replace all participants with the new list
      debate.participants = req.body.participants;
    }

    // Save the updated debate
    const updatedDebate = await debate.save();
    
    // Return populated debate data
    const populatedDebate = await Debate.findById(updatedDebate._id)
      .populate('creator', 'username')
      .populate('participants', 'username role judgeRole')
      .lean();

    res.json(populatedDebate);
  } catch (error) {
    console.error('Error updating debate:', error);
    res.status(400).json({ message: error.message });
  }
};

// Start a debate room
exports.startRoom = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('participants', 'username role');

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Deactivate any existing active rooms
    debate.rooms.forEach(room => {
      if (room.isActive) {
        room.isActive = false;
      }
    });

    // Create a new room
    const room = {
      teams: debate.teams,
      isActive: true,
      transcription: []
    };

    debate.rooms.push(room);
    debate.status = 'in-progress';
    await debate.save();

    // Get the created room with populated fields
    const updatedDebate = await Debate.findById(debate._id)
      .populate('rooms.transcription.speaker', 'username');
    const createdRoom = updatedDebate.rooms[updatedDebate.rooms.length - 1];

    res.json({ room: createdRoom });
  } catch (error) {
    console.error('Error starting room:', error);
    res.status(500).json({ message: error.message });
  }
};

// Save debate transcript segment
exports.saveTranscript = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('rooms.transcription.speaker', 'username');

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Find the active room if roomId is not provided
    let room;
    if (req.body.roomId) {
      room = debate.rooms.id(req.body.roomId);
    } else {
      room = debate.rooms.find(r => r.isActive);
    }

    if (!room) {
      return res.status(404).json({ message: 'Active room not found' });
    }

    // Add transcript to room
    const transcriptEntry = {
      text: req.body.text,
      timestamp: req.body.timestamp || new Date(),
      speaker: req.body.speaker
    };

    room.transcription.push(transcriptEntry);
    await debate.save();

    // Populate the new transcript entry
    const updatedDebate = await Debate.findById(debate._id)
      .populate('rooms.transcription.speaker', 'username');
    const updatedRoom = updatedDebate.rooms.id(room._id);

    res.json({ 
      message: 'Transcript saved successfully',
      transcription: updatedRoom.transcription
    });
  } catch (error) {
    console.error('Error saving transcript:', error);
    res.status(500).json({ message: error.message });
  }
};

// End debate and perform final analysis
exports.analyzeFinalDebate = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('participants', 'username role')
      .populate('teams.members', 'username')
      .populate('rooms.transcription.speaker', 'username');

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Find the active room and get its transcriptions
    const activeRoom = debate.rooms.find(r => r.isActive);

    if (!activeRoom || !activeRoom.transcription || activeRoom.transcription.length === 0) {
      return res.status(400).json({ message: 'No debate transcript available for analysis' });
    }

    // Format transcriptions
    const allTranscriptions = activeRoom.transcription.map(t => ({
      speaker: t.speaker.username,
      text: t.text,
      timestamp: t.timestamp
    }));

    // Sort by timestamp
    allTranscriptions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Format the transcript
    const formattedTranscript = allTranscriptions
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n\n');

    // Analyze the complete debate
    const analysis = await analyzeDebateSummary(formattedTranscript);

    // Update debate status and save analysis
    debate.status = 'completed';
    debate.analysis = analysis;
    debate.endedAt = new Date();
    
    // Mark room as inactive
    if (activeRoom) {
      activeRoom.isActive = false;
    }
    
    await debate.save();

    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing debate:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.analyzeInterim = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('rooms.transcription.speaker', 'username')
      .populate('participants', 'username role');
    
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    const room = debate.rooms.id(req.body.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Format transcriptions
    const allTranscriptions = room.transcription.map(t => ({
      speaker: t.speaker.username,
      text: t.text,
      timestamp: t.timestamp
    }));

    // Sort by timestamp
    allTranscriptions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const formattedTranscript = allTranscriptions
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n\n');

    // Use the interim analysis function
    const analysis = await analyzeInterimTranscript(formattedTranscript);

    // Save the analysis to the room's current state
    room.currentAnalysis = analysis;
    await debate.save();

    res.json({ analysis });
  } catch (error) {
    console.error('Error in interim analysis:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate tournament bracket
exports.generateTournamentBracket = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('participants', 'username role');

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    if (debate.format !== 'tournament') {
      return res.status(400).json({ message: 'This is not a tournament debate' });
    }

    // Get all debaters (non-judge participants)
    const debaters = debate.participants.filter(p => p.role !== 'judge');
    
    if (debaters.length < 2) {
      return res.status(400).json({ message: 'Not enough debaters to start tournament' });
    }

    // Shuffle debaters randomly
    const shuffledDebaters = [...debaters].sort(() => Math.random() - 0.5);

    // Calculate number of rounds needed
    const numRounds = Math.ceil(Math.log2(shuffledDebaters.length));
    const totalSlots = Math.pow(2, numRounds);
    
    // Create first round matches
    const firstRound = [];
    for (let i = 0; i < totalSlots; i += 2) {
      firstRound.push({
        round: 1,
        matchNumber: Math.floor(i/2) + 1,
        team1: shuffledDebaters[i] || null,
        team2: shuffledDebaters[i + 1] || null,
        completed: false
      });
    }

    // Create subsequent empty rounds
    const tournamentRounds = [{
      roundNumber: 1,
      matches: firstRound
    }];

    for (let round = 2; round <= numRounds; round++) {
      const numMatches = Math.pow(2, numRounds - round);
      const matches = [];
      
      for (let match = 1; match <= numMatches; match++) {
        matches.push({
          round: round,
          matchNumber: match,
          team1: null,
          team2: null,
          completed: false
        });
      }
      
      tournamentRounds.push({
        roundNumber: round,
        matches: matches
      });
    }

    // Update debate with tournament bracket
    debate.tournamentRounds = tournamentRounds;
    debate.status = 'in-progress';
    await debate.save();

    res.json({ tournamentRounds });
  } catch (error) {
    console.error('Error generating tournament bracket:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update tournament match result
exports.updateTournamentMatch = async (req, res) => {
  try {
    const { matchId, winnerId } = req.body;
    const debate = await Debate.findById(req.params.id);

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Find and update the match
    let matchFound = false;
    for (const round of debate.tournamentRounds) {
      const match = round.matches.id(matchId);
      if (match) {
        match.winner = winnerId;
        match.completed = true;
        matchFound = true;

        // If not the final round, update next round's match
        if (round.roundNumber < debate.tournamentRounds.length) {
          const nextRound = debate.tournamentRounds.find(r => r.roundNumber === round.roundNumber + 1);
          const nextMatchNumber = Math.ceil(match.matchNumber / 2);
          const nextMatch = nextRound.matches.find(m => m.matchNumber === nextMatchNumber);
          
          if (nextMatch) {
            // Place winner in appropriate slot of next match
            if (match.matchNumber % 2 === 1) {
              nextMatch.team1 = winnerId;
            } else {
              nextMatch.team2 = winnerId;
            }
          }
        }
        break;
      }
    }

    if (!matchFound) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Check if tournament is complete (final match has a winner)
    const finalRound = debate.tournamentRounds[debate.tournamentRounds.length - 1];
    if (finalRound.matches[0].completed) {
      debate.status = 'completed';
      debate.winner = finalRound.matches[0].winner;
    }

    await debate.save();
    res.json(debate);
  } catch (error) {
    console.error('Error updating tournament match:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add the missing validation middleware for tournament operations
exports.validateTournamentOperation = async (req, res, next) => {
  try {
    const debate = await Debate.findById(req.params.id);
    
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }
    
    // For tournaments, check if registration is still open
    if (debate.format === 'tournament' && debate.status !== 'upcoming') {
      return res.status(400).json({ 
        message: 'Cannot join or leave a tournament that has already started or ended' 
      });
    }
    
    // For tournaments, check if registration deadline has passed
    if (debate.format === 'tournament' && debate.registrationDeadline) {
      const now = new Date();
      const deadline = new Date(debate.registrationDeadline);
      
      if (now > deadline) {
        return res.status(400).json({ 
          message: 'Registration deadline has passed for this tournament' 
        });
      }
    }
    
    // All checks passed, proceed to the next middleware
    next();
  } catch (error) {
    console.error('Tournament validation error:', error);
    res.status(500).json({ message: 'Error validating tournament operation' });
  }
};

// Add the missing assignTeams function for debate team assignment
exports.assignTeams = async (req, res) => {
  try {
    const { propositionTeam, oppositionTeam } = req.body;
    const debate = await Debate.findById(req.params.id);
    
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }
    
    // Verify user is creator or has permission to assign teams
    if (debate.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the debate creator can assign teams' });
    }
    
    // Validate team members are participants
    const allTeamMembers = [...propositionTeam, ...oppositionTeam];
    const allParticipantIds = debate.participants.map(p => p._id.toString());
    
    const invalidMembers = allTeamMembers.filter(id => !allParticipantIds.includes(id.toString()));
    if (invalidMembers.length > 0) {
      return res.status(400).json({ 
        message: 'Some team members are not participants in this debate' 
      });
    }
    
    // Assign teams
    debate.teams = {
      propositionTeam,
      oppositionTeam
    };
    
    const updatedDebate = await debate.save();
    res.json(updatedDebate);
    
  } catch (error) {
    console.error('Error assigning teams:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add the missing analyzeSpeech function referenced in routes
exports.analyzeSpeech = async (req, res) => {
  try {
    const { speechText, speakerId } = req.body;
    const debate = await Debate.findById(req.params.id)
      .populate('participants', 'username role');
    
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }
    
    // Validate that the speaker is a participant in the debate
    const isSpeakerParticipant = debate.participants.some(
      p => p._id.toString() === speakerId
    );
    
    if (!isSpeakerParticipant) {
      return res.status(400).json({ message: 'Speaker is not a participant in this debate' });
    }
    
    // Use the AI service to analyze the speech
    const analysisResult = await analyzeDebateSpeech(speechText);
    
    res.json({ 
      analysis: analysisResult,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error analyzing speech:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add the missing updateTournamentBrackets function referenced in routes
exports.updateTournamentBrackets = async (req, res) => {
  try {
    const { brackets } = req.body;
    const debate = await Debate.findById(req.params.id);
    
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }
    
    if (debate.format !== 'tournament') {
      return res.status(400).json({ message: 'This is not a tournament debate' });
    }
    
    // Verify user is creator or organizer
    if (debate.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the tournament creator can update brackets' });
    }
    
    // Update tournament brackets
    debate.tournamentRounds = brackets;
    
    // Check if tournament is complete (final match has a winner)
    const finalRound = brackets[brackets.length - 1];
    if (finalRound && finalRound.matches && 
        finalRound.matches[0] && finalRound.matches[0].completed) {
      debate.status = 'completed';
      debate.winner = finalRound.matches[0].winner;
    }
    
    await debate.save();
    res.json(debate);
  } catch (error) {
    console.error('Error updating tournament brackets:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update tournament participants in bulk
exports.updateParticipants = async (req, res) => {
  try {
    const { participants } = req.body;
    const debate = await Debate.findById(req.params.id);

    if (!debate) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (debate.format !== 'tournament') {
      return res.status(400).json({ message: 'This is not a tournament debate' });
    }

    // Add new participants
    debate.participants = participants.map(p => ({
      userId: p.userId,
      role: p.role,
      judgeRole: p.judgeRole
    }));

    await debate.save();

    // Populate the user details
    const updatedDebate = await Debate.findById(debate._id)
      .populate('participants.userId', 'username email');

    res.json(updatedDebate);
  } catch (error) {
    console.error('Error updating participants:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new team for tournament
exports.createTeam = async (req, res) => {
  try {
    const { name, leader, speaker, tournamentId } = req.body; // tournamentId might be in req.params.id depending on route

    // Basic input check
    if (!name || !leader || !speaker) {
        return res.status(400).json({ message: 'Missing required fields: name, leader, speaker' });
    }

    const debateId = req.params.id || tournamentId; // Get ID from params or body
    if (!debateId) {
        return res.status(400).json({ message: 'Missing tournament ID' });
    }

    // Use the team service to handle validation and creation
    const teamData = { name, leader, speaker };
    const createdTeam = await teamService.createTeam(debateId, teamData);

    res.status(201).json(createdTeam); // Return the team data from the service

  } catch (error) {
    console.error('Error creating team:', error);
    // Handle specific errors from the service more generically
    if (error.message === 'Tournament not found' || error.message === 'Debate is not a tournament') {
      return res.status(404).json({ message: error.message });
    }
    // Service validation errors (like invalid members) should result in 400
    if (error.message.includes('participant') || error.message.includes('Invalid member')) {
        return res.status(400).json({ message: error.message });
    }
    // Default to 500 for unexpected errors
    res.status(500).json({ message: error.message || 'Failed to create team' });
  }
};

// Update an existing team
exports.updateTeam = async (req, res) => {
  try {
    // Extract IDs from params, data from body
    const { teamId } = req.params; // Get teamId from URL params
    const { name, leader, speaker, tournamentId } = req.body;

    // Basic input validation
    if (!name || !leader || !speaker) {
      return res.status(400).json({ message: 'Missing required fields: name, leader, speaker' });
    }
    if (!tournamentId) {
      return res.status(400).json({ message: 'Missing tournament ID in request body' });
    }

    // Prepare update data for the service
    const teamUpdateData = { name, leader, speaker };

    // Call the service method
    const updatedTeam = await teamService.updateTeam(tournamentId, teamId, teamUpdateData);

    res.status(200).json({
      message: 'Team updated successfully',
      team: updatedTeam // Return the updated team from the service
    });

  } catch (error) {
    console.error('Error updating team:', error);
    // Handle specific errors from the service
    if (error.message === 'Tournament not found' || error.message === 'Team not found in tournament') {
      return res.status(404).json({ message: error.message });
    }
    // Service validation errors (like invalid members) should result in 400
    if (error.message.includes('participant') || error.message.includes('Invalid member')) {
      return res.status(400).json({ message: error.message });
    }
    // Default to 500 for unexpected errors
    res.status(500).json({ message: error.message || 'Failed to update team' });
  }
};

// Register both judges and debaters to a tournament
exports.registerParticipants = async (req, res) => {
  try {
    const { judges, debaters } = req.body;
    console.log('Received registration request:', { judges, debaters });
    const debateId = req.params.id; // Get debateId from params

    if (!Array.isArray(judges) || !Array.isArray(debaters)) {
      return res.status(400).json({
        message: 'Invalid input: judges and debaters must be arrays'
      });
    }

    // Use the tournament service to handle registration
    const result = await tournamentService.registerParticipants(debateId, judges, debaters);

     // Fetch the fully populated debate to return
     const updatedDebate = await Debate.findById(debateId)
       .populate('participants._id', 'username email role') // Populate user details within participants
       .lean(); // Use lean for performance

    res.json({
      message: 'Participants registered successfully',
      debate: updatedDebate, // Return the updated debate object
      summary: { // Include summary counts from service result
          judgesAdded: result.judgesAdded,
          debatersAdded: result.debatersAdded,
          totalJudges: result.totalJudges,
          totalDebaters: result.totalDebaters
      }
    });

  } catch (error) {
    console.error('Error registering participants:', error);
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ message: error.message });
    }
     if (error.message === 'Not a tournament debate') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Failed to register participants' });
  }
};

// Generate test data for development and testing
exports.generateTestData = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    
    if (!debate) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Fetch test judges and debaters from the database, ensuring we don't exceed limits
    // Limit judges to 7 to leave room for potential organizer/creator
    const testJudges = await User.find({ role: 'judge', isTestAccount: true }).limit(7);
    const testDebaters = await User.find({ role: 'user', isTestAccount: true }).limit(32);
    
    console.log(`Found ${testJudges.length} test judges and ${testDebaters.length} test debaters`);
    
    // Start with completely empty participants array - no creator included
    const participants = [];
    
    // Add judges (maximum exactly 7 to avoid hitting the 8 judge limit)
    for (const judge of testJudges) {
      participants.push({
        _id: judge._id,
        username: judge.username,
        role: 'judge',
        judgeRole: judge.judgeRole || 'Judge'
      });
    }
    
    // Add debaters (maximum exactly 32)
    let debaterCount = 0;
    for (const debater of testDebaters) {
      if (debaterCount >= 32) break;
      
      participants.push({
        _id: debater._id,
        username: debater.username,
        role: 'debater'  // Force role to be 'debater' to avoid any issues
      });
      debaterCount++;
    }
    
    // Log the counts before saving
    const judgeCount = participants.filter(p => p.role === 'judge').length;
    const debaterCount2 = participants.filter(p => p.role === 'debater').length;
    console.log(`Preparing to save ${judgeCount} judges and ${debaterCount2} debaters`);
    
    // Update the debate with the test participants - completely replace existing participants
    debate.participants = participants;
    
    // Save with error handling
    try {
      await debate.save();
      
      res.json({
        message: 'Test participants registered successfully',
        debate: {
          _id: debate._id,
          title: debate.title,
          participantCount: participants.length,
          judges: judgeCount,
          debaters: debaterCount2
        }
      });
    } catch (saveError) {
      console.error('Error saving debate with test participants:', saveError);
      res.status(400).json({ 
        message: 'Failed to save test data',
        error: saveError.message,
        stack: saveError.stack
      });
    }
    
  } catch (error) {
    console.error('Error generating test data:', error);
    res.status(500).json({ 
      message: error.message,
      stack: error.stack 
    });
  }
};

// Update participant details within a tournament
exports.updateParticipant = async (req, res) => {
  try {
    const { id: debateId, participantUserId } = req.params;
    const updateData = req.body; // Contains fields like tournamentRole, teamId, etc.

    // TODO: Add validation for updateData here if necessary

    // Call the service function to update the participant
    // Assuming the service function returns the updated debate or participant info
    const updatedInfo = await tournamentService.updateParticipantDetails(debateId, participantUserId, updateData);

    res.status(200).json({
      message: 'Participant updated successfully',
      data: updatedInfo // Send back updated info (e.g., updated participant object or full debate)
    });

  } catch (error) {
    console.error('Error updating participant:', error);
    if (error.message === 'Debate not found' || error.message === 'Participant not found' || error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    // Handle other potential errors (e.g., validation errors from service)
    res.status(500).json({ message: error.message || 'Failed to update participant' });
  }
};

// Delete a participant from a tournament
exports.deleteParticipant = async (req, res) => {
  try {
    const { id: debateId, participantUserId } = req.params;

    // Call the service function to remove the participant
    // Assuming the service function handles validation (e.g., participant exists)
    await tournamentService.removeParticipantFromTournament(debateId, participantUserId);

    res.status(200).json({ message: 'Participant removed successfully' });

  } catch (error) {
    console.error('Error deleting participant:', error);
    if (error.message === 'Debate not found' || error.message === 'Participant not found') {
      return res.status(404).json({ message: error.message });
    }
    // Handle other potential errors (e.g., permissions if not handled by middleware/route)
    res.status(500).json({ message: error.message || 'Failed to remove participant' });
  }
};

// Create APF game posting
exports.createApfPosting = async (req, res) => {
  try {
    const postingData = req.body;
    const debateId = req.params.id || postingData.tournamentId; // Get ID from params or body
    const userId = req.user._id; // Assuming user ID is available from auth middleware

    if (!debateId) {
        return res.status(400).json({ message: 'Missing tournament ID' });
    }

    // Basic validation (service handles more detailed checks)
    if (!postingData.team1Id || !postingData.team2Id || (!postingData.location && !postingData.virtualLink) || !postingData.judgeIds || !postingData.theme) {
      return res.status(400).json({ message: 'Missing required fields for APF posting (team1Id, team2Id, location/virtualLink, judgeIds, theme)' });
    }

    // Call the posting service to handle creation, validation, and notifications
    const result = await postingService.createPosting(debateId, userId, postingData);

    // The service returns the created posting data and notification results
    res.status(201).json({
      message: 'APF game posted successfully',
      posting: result // Return the full result from the service
    });

  } catch (error) {
    console.error('Error creating APF posting:', error);
    // Handle specific errors from the service
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Missing required fields') ||
        error.message.includes('Teams cannot be the same') ||
        error.message.includes('not found in this tournament') ||
        error.message.includes('not participants')) {
      return res.status(400).json({ message: error.message });
    }
    // Default to 500 for unexpected errors
    res.status(500).json({
      message: error.message || 'Failed to create APF posting',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Batch creation of APF game postings
exports.createApfBatchPostings = async (req, res) => {
  try {
    const batchData = req.body; // Contains batchGames and batchName
    const debateId = req.params.id;
    const userId = req.user._id;

    // Basic validation
    if (!Array.isArray(batchData.batchGames) || batchData.batchGames.length === 0) {
      return res.status(400).json({ message: 'No games provided for batch creation' });
    }
    if (!debateId) {
        return res.status(400).json({ message: 'Missing tournament ID' });
    }

    // Call the service to handle batch creation, validation, saving, and notifications
    const { results, errors } = await postingService.createBatchPostings(debateId, userId, batchData);

    // Determine appropriate status code based on errors
    const statusCode = errors.length > 0 && results.length === 0 ? 400 : 201; // 400 if all failed, 201 otherwise

    res.status(statusCode).json({
      message: `Batch creation processed: ${results.length} succeeded, ${errors.length} failed.`,
      results, // Array of successfully created posting summaries
      errors: errors.length > 0 ? errors : undefined // Array of errors for failed games
    });

  } catch (error) {
    console.error('Error creating batch APF postings:', error);
    // Handle specific errors from the service (e.g., tournament not found)
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ message: error.message });
    }
    // Default to 500 for unexpected errors
    res.status(500).json({
      message: error.message || 'Failed to process batch APF postings',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Helper function to send notifications for a game
async function sendGameNotifications(debate, game, debateId, batchName) {
  const judgeIds = game.judges.map(j => j.id);
  
  // Send notifications to judges
  for (const judgeId of judgeIds) {
    const judge = await User.findById(judgeId);
    if (judge) {
      if (!judge.notifications) {
        judge.notifications = [];
      }
      
      const notification = {
        type: 'game_assignment',
        debate: debateId,
        message: `You have been assigned to judge an APF debate${game.scheduledTime ? ` on ${new Date(game.scheduledTime).toLocaleString()}` : ''}${batchName ? ` (${batchName})` : ''}: ${typeof game.theme === 'string' ? game.theme : game.theme?.label || 'Topic not specified'}`,
        seen: false,
        createdAt: new Date()
      };
      
      judge.notifications.push(notification);
      await judge.save();
    }
  }
  
  // Send notifications to team members
  const team1 = debate.teams.find(t => t._id.toString() === game.team1.id);
  const team2 = debate.teams.find(t => t._id.toString() === game.team2.id);
  
  if (team1 && team1.members) {
    for (const member of team1.members) {
      if (member.userId) {
        const teamMember = await User.findById(typeof member.userId === 'object' ? member.userId._id : member.userId);
        if (teamMember) {
          if (!teamMember.notifications) {
            teamMember.notifications = [];
          }
          
          const notification = {
            type: 'game_assignment',
            debate: debateId,
            message: `Your team (${team1.name}) has been scheduled for an APF debate${game.scheduledTime ? ` on ${new Date(game.scheduledTime).toLocaleString()}` : ''}${batchName ? ` (${batchName})` : ''}: ${typeof game.theme === 'string' ? game.theme : game.theme?.label || 'Topic not specified'}`,
            seen: false,
            createdAt: new Date()
          };
          
          teamMember.notifications.push(notification);
          await teamMember.save();
        }
      }
    }
  }
  
  if (team2 && team2.members) {
    for (const member of team2.members) {
      if (member.userId) {
        const teamMember = await User.findById(typeof member.userId === 'object' ? member.userId._id : member.userId);
        if (teamMember) {
          if (!teamMember.notifications) {
            teamMember.notifications = [];
          }
          
          const notification = {
            type: 'game_assignment',
            debate: debateId,
            message: `Your team (${team2.name}) has been scheduled for an APF debate${game.scheduledTime ? ` on ${new Date(game.scheduledTime).toLocaleString()}` : ''}${batchName ? ` (${batchName})` : ''}: ${typeof game.theme === 'string' ? game.theme : game.theme?.label || 'Topic not specified'}`,
            seen: false,
            createdAt: new Date()
          };
          
          teamMember.notifications.push(notification);
          await teamMember.save();
        }
      }
    }
  }
  
  // Find the posting and mark notifications as sent
  const postingIndex = debate.postings.findIndex(p => 
    p.team1.toString() === game.team1.id && 
    p.team2.toString() === game.team2.id &&
    p.batchName === batchName
  );
  
  if (postingIndex !== -1) {
    debate.postings[postingIndex].notifications.judgesNotified = true;
    debate.postings[postingIndex].notifications.sentAt = new Date();
    await debate.save();
  }
}

// Update APF posting status (or other details via service)
exports.updateApfPostingStatus = async (req, res) => {
  try {
    const { id: debateId, postingId } = req.params;
    const updateData = req.body; // Can include status or other fields
    const userId = req.user._id; // Assuming user ID is available

    // Basic validation if only status is expected by this specific route
    if (updateData.status && !['scheduled', 'in_progress', 'completed', 'cancelled'].includes(updateData.status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No update data provided' });
    }

    // Call the service method to handle the update
    const updatedPosting = await postingService.updatePostingDetails(debateId, postingId, updateData, userId);

    res.status(200).json({
      message: 'APF posting updated successfully',
      posting: updatedPosting // Return the updated posting from the service
    });

  } catch (error) {
    console.error('Error updating APF posting status:', error);
    // Handle specific errors from the service
    if (error.message === 'Tournament not found' || error.message === 'Posting not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Invalid status value' || error.message.includes('not participants')) {
        return res.status(400).json({ message: error.message });
    }
    // Default to 500 for unexpected errors
    res.status(500).json({ message: error.message || 'Failed to update APF posting' });
  }
};

// Get APF postings for a specific tournament
exports.getApfPostings = async (req, res) => {
  try {
    const { id: debateId } = req.params;
    const filters = req.query; // Allow filtering via query params (e.g., ?status=scheduled)

    if (!debateId) {
        return res.status(400).json({ message: 'Missing tournament ID in request parameters' });
    }

    // Call the service method to get postings
    const postings = await postingService.getPostingsForDebate(debateId, filters);

    res.status(200).json(postings); // Return the array of postings

  } catch (error) {
    console.error('Error getting APF postings:', error);
    // Handle specific errors from the service
    if (error.message === 'Tournament not found' || error.message === 'Debate is not a tournament') {
      return res.status(404).json({ message: error.message });
    }
    // Default to 500 for unexpected errors
    res.status(500).json({ message: error.message || 'Failed to get APF postings' });
  }
};


// Send reminders for APF game
exports.sendApfGameReminder = async (req, res) => {
  try {
    const { id: debateId, postingId } = req.params;
    const userId = req.user._id; // Assuming user ID is available

    if (!debateId || !postingId) {
        return res.status(400).json({ message: 'Missing tournament ID or posting ID in request parameters' });
    }

    // Call the service method to handle finding the posting and sending notifications
    const notificationResults = await postingService.sendReminders(debateId, postingId, userId);

    res.status(200).json({
      message: 'Reminders sent successfully',
      ...notificationResults // Spread the results (judgesNotified, teamMembersNotified, errors)
    });

  } catch (error) {
    console.error('Error sending APF game reminders:', error);
    // Handle specific errors from the service
    if (error.message === 'Tournament not found' || error.message === 'APF posting not found') {
      return res.status(404).json({ message: error.message });
    }
    // Default to 500 for unexpected errors
    res.status(500).json({ message: error.message || 'Failed to send reminders' });
  }
};

// Randomize teams for tournament
exports.randomizeTeams = async (req, res) => {
  try {
    const debateId = req.params.id;
    // Call the service method which handles finding debate, validation, shuffling, and saving
    const updatedDebateWithTeams = await teamService.randomizeTeams(debateId);

    res.json({
      message: 'Teams randomized successfully',
      // Return the teams array from the populated debate object returned by the service
      teams: updatedDebateWithTeams.teams
    });

  } catch (error) {
    console.error('Error randomizing teams:', error);
    // Handle specific errors from the service
    if (error.message === 'Tournament not found' || error.message === 'Not a tournament') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Not enough debaters to randomize teams') {
      return res.status(400).json({ message: error.message });
    }
    // Default to 500 for unexpected errors
    res.status(500).json({ message: error.message || 'Failed to randomize teams' });
  }
};

// --- Tournament Map Controllers ---

/**
 * @desc    Upload or replace tournament map image
 * @route   POST /api/debates/:id/map
 * @access  Private (Organizer/Admin)
 */
exports.uploadMap = async (req, res) => {
  try {
    const debateId = req.params.id;
    const userId = req.user._id; // From protect middleware

    // Check if a file was uploaded by multer
    if (!req.file) {
      return res.status(400).json({ message: 'No map image file uploaded.' });
    }

    const fileBuffer = req.file.buffer;
    const originalFileName = req.file.originalname;
    const mimeType = req.file.mimetype;

    // Call the service function
    const mapUrl = await debateService.uploadTournamentMap(
      debateId,
      fileBuffer,
      originalFileName,
      mimeType,
      userId.toString() // Ensure userId is passed as string
    );

    res.status(200).json({ 
      message: 'Map uploaded successfully.',
      mapImageUrl: mapUrl 
    });

  } catch (error) {
    console.error('Error uploading tournament map:', error);
    if (error.message === 'Debate not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Not authorized') || error.message.includes('Invalid file type')) {
      return res.status(403).json({ message: error.message }); // Or 400 for invalid file type
    }
    if (error.message === 'Map can only be uploaded for tournaments.') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Failed to upload map.' });
  }
};

/**
 * @desc    Get tournament map image URL
 * @route   GET /api/debates/:id/map
 * @access  Private (Authenticated Users)
 */
exports.getMap = async (req, res) => {
  try {
    const debateId = req.params.id;

    // Call the service function
    const mapUrl = await debateService.getTournamentMapUrl(debateId);

    // Service returns null if no map or if not a tournament, which is fine
    res.status(200).json({ mapImageUrl: mapUrl }); 

  } catch (error) {
    console.error('Error getting tournament map URL:', error);
    if (error.message === 'Debate not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Failed to get map URL.' });
  }
};

/**
 * @desc    Delete tournament map image
 * @route   DELETE /api/debates/:id/map
 * @access  Private (Organizer/Admin)
 */
exports.deleteMap = async (req, res) => {
  try {
    const debateId = req.params.id;
    const userId = req.user._id; // From protect middleware

    // Call the service function
    await debateService.deleteTournamentMap(debateId, userId.toString());

    res.status(200).json({ message: 'Map deleted successfully.' });

  } catch (error) {
    console.error('Error deleting tournament map:', error);
    if (error.message === 'Debate not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Not authorized')) {
      return res.status(403).json({ message: error.message });
    }
     if (error.message === 'Map can only be deleted for tournaments.') {
        return res.status(400).json({ message: error.message });
    }
    // Handle case where map didn't exist (service currently doesn't throw error for this)
    // if (error.message === 'No map image exists to delete.') {
    //   return res.status(404).json({ message: error.message });
    // }
    res.status(500).json({ message: error.message || 'Failed to delete map.' });
  }
};


// Delete a team from a tournament
exports.deleteTeam = async (req, res) => {
  try {
    const { id: tournamentId, teamId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: 'Invalid Tournament or Team ID format' });
    }

    // Call the service function to delete the team
    await teamService.deleteTeam(tournamentId, teamId);

    res.status(200).json({ message: 'Team successfully deleted from tournament' });

  } catch (error) {
    console.error('Error deleting team:', error);
    // Handle specific errors from the service (e.g., not found)
    if (error.message === 'Tournament not found' || error.message === 'Team not found in this tournament') {
      return res.status(404).json({ message: error.message });
    }
    // Generic server error
    res.status(500).json({ message: error.message || 'Failed to delete team' });
  }
};

// Upload recorded audio for a specific posting
exports.uploadAudio = async (req, res) => {
  try {
    const { id: debateId, postingId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded.' });
    }

    // Call placeholder service to get a dummy URL
    // In a real scenario, this would upload to cloud storage and return the actual URL
    const audioUrl = await postingService.saveAudioUrl(req.file.buffer); // Assuming service handles buffer

    const debate = await Debate.findById(debateId);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found.' });
    }

    const posting = debate.postings.id(postingId);
    if (!posting) {
      return res.status(404).json({ message: 'Posting not found within the debate.' });
    }

    posting.recordedAudioUrl = audioUrl;
    debate.markModified('postings'); // Important when modifying nested arrays/objects
    await debate.save();

    res.status(200).json({ message: 'Audio URL successfully updated.', posting });

  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ message: error.message || 'Failed to upload audio.' });
  }
};

// Upload ballot image for a specific posting
exports.uploadBallot = async (req, res) => {
  try {
    const { id: debateId, postingId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No ballot image file uploaded.' });
    }

    // Call placeholder service to get a dummy URL
    const imageUrl = await postingService.saveBallotUrl(req.file.buffer); // Assuming service handles buffer

    const debate = await Debate.findById(debateId);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found.' });
    }

    const posting = debate.postings.id(postingId);
    if (!posting) {
      return res.status(404).json({ message: 'Posting not found within the debate.' });
    }

    posting.ballotImageUrl = imageUrl;
    debate.markModified('postings'); // Important when modifying nested arrays/objects
    await debate.save();

    res.status(200).json({ message: 'Ballot image URL successfully updated.', posting });

  } catch (error) {
    console.error('Error uploading ballot image:', error);
    res.status(500).json({ message: error.message || 'Failed to upload ballot image.' });
  }
};


// Get Judge Leaderboard for a Tournament
exports.getJudgeLeaderboard = async (req, res) => {
  try {
    const tournamentId = req.params.id;

    // Validate if tournamentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ message: 'Invalid Tournament ID format' });
    }

    // Fetch the tournament and populate necessary user details for participants
    const debate = await Debate.findById(tournamentId)
      .populate({
        path: 'participants.userId',
        select: 'username judgeRole profilePhotoUrl' // Select fields from User model
      })
      .lean(); // Use lean for performance if we don't need Mongoose documents

    // Check if the tournament exists
    if (!debate) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Filter participants to include only judges
    const judges = debate.participants.filter(p => p.tournamentRole === 'Judge' && p.userId); // Ensure userId is populated

    // Define the rank order for sorting
    const rankOrder = {
      'Head Judge': 1,
      'Judge': 2,
      'Assistant Judge': 3
    };

    // Map judges to the desired leaderboard format and sort them
    const leaderboard = judges
      .map(p => ({
        id: p.userId._id,
        name: p.userId.username,
        rank: p.userId.judgeRole || 'Judge', // Default to 'Judge' if judgeRole is missing
        photo: p.userId.profilePhotoUrl || null // Handle missing photo URL
      }))
      .sort((a, b) => {
        const rankA = rankOrder[a.rank] || 99; // Assign a high number for unknown ranks
        const rankB = rankOrder[b.rank] || 99;
        return rankA - rankB;
      });

    // Return the sorted leaderboard
    res.json(leaderboard);

  } catch (error) {
    console.error('Error fetching judge leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch judge leaderboard', error: error.message });
  }
};

// Update a specific participant's details within a tournament
exports.updateParticipant = async (req, res, next) => {
  try {
    const { id: tournamentId, participantUserId } = req.params;
    const updateData = req.body; // e.g., { name, email } - adjust based on what can be updated
    const requestingUserId = req.user.id; // Assuming organizer check is done by middleware

    // Basic validation
    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(participantUserId)) {
      return res.status(400).json({ message: 'Invalid tournament or participant ID format' });
    }
    if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No update data provided' });
    }

    // Call the service function to update the participant
    // Assuming a service function exists like this:
    const updatedParticipant = await tournamentService.updateParticipantDetails(
        tournamentId,
        participantUserId,
        updateData,
        requestingUserId // Pass requesting user for permission checks within service if needed
    );

    if (!updatedParticipant) {
        // Service should throw specific errors, but handle general case
        return res.status(404).json({ message: 'Participant not found or update failed' });
    }

    res.status(200).json(updatedParticipant);

  } catch (error) {
    console.error(`Error updating participant ${participantUserId} in tournament ${tournamentId}:`, error);
    // Handle specific errors from service
    if (error.message === 'Tournament not found' || error.message === 'Participant not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Update forbidden' || error.message.includes('permission')) {
        return res.status(403).json({ message: error.message });
    }
    // Generic error
    res.status(500).json({ message: error.message || 'Failed to update participant' });
  }
}; // End of updateParticipant



// Delete a specific participant from a tournament
exports.deleteParticipant = async (req, res, next) => {
  try {
    const { id: tournamentId, participantUserId } = req.params;
    const requestingUserId = req.user.id; // Assuming organizer check is done by middleware

    // Basic validation
    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(participantUserId)) {
      return res.status(400).json({ message: 'Invalid tournament or participant ID format' });
    }

    // Call the service function to delete the participant
    // Assuming a service function exists like this:
    const result = await tournamentService.removeParticipant(
        tournamentId,
        participantUserId,
        requestingUserId // Pass requesting user for permission checks within service if needed
    );

    if (!result || !result.success) { // Check for a success flag or similar from service
        // Service should throw specific errors, but handle general case
        return res.status(404).json({ message: result?.message || 'Participant not found or deletion failed' });
    }

    res.status(200).json({ message: 'Participant deleted successfully' }); // Or 204 No Content

  } catch (error) {
    console.error(`Error deleting participant ${participantUserId} from tournament ${tournamentId}:`, error);
    // Handle specific errors from service
    if (error.message === 'Tournament not found' || error.message === 'Participant not found') {
      return res.status(404).json({ message: error.message });
    }
     if (error.message === 'Deletion forbidden' || error.message.includes('permission')) {
        return res.status(403).json({ message: error.message });
    }
    // Generic error
    res.status(500).json({ message: error.message || 'Failed to delete participant' });
  }
};





// Get ranked participant standings for a tournament
exports.getParticipantStandings = async (req, res) => {
  try {
    const tournamentId = req.params.id;

    // Validate tournamentId (basic check)
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      return res.status(400).json({ message: 'Invalid tournament ID format' });
    }

    // Call the service function to calculate standings
    // Assuming the service function is in debateService for now
    const standings = await debateService.calculateParticipantStandings(tournamentId);

    res.status(200).json(standings);

  } catch (error) {
    console.error('Error getting participant standings:', error);
    // Handle specific errors if the service throws them
    if (error.message === 'Tournament not found') {
      return res.status(404).json({ message: error.message });
    }
    // Generic error response
    res.status(500).json({ message: error.message || 'Failed to calculate participant standings' });
  }
};
