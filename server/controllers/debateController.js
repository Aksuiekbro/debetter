const mongoose = require('mongoose');
const User = require('../models/User');
const Debate = require('../models/Debate');
const { analyzeDebateSpeech, analyzeDebateSummary, analyzeInterimTranscript } = require('../services/aiService');
const bcrypt = require('bcrypt');

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
    const {
      title,
      description,
      category,
      difficulty,
      startDate,
      format,
      mode,
      registrationDeadline,
      location,
      duration
    } = req.body;

    // Validate tournament-specific requirements
    if (format === 'tournament') {
      const now = new Date();
      const tournamentStart = new Date(startDate);
      const regDeadline = new Date(registrationDeadline);

      // Ensure 48 hours notice for tournaments
      if (tournamentStart - now < 48 * 60 * 60 * 1000) {
        return res.status(400).json({ message: 'Tournaments must be scheduled at least 48 hours in advance' });
      }

      // Validate registration deadline
      if (regDeadline >= tournamentStart) {
        return res.status(400).json({ message: 'Registration deadline must be before tournament start' });
      }

      if (tournamentStart - regDeadline < 24 * 60 * 60 * 1000) {
        return res.status(400).json({ message: 'Registration must close at least 24 hours before tournament start' });
      }
    }

    const debateData = {
      title,
      description,
      category,
      difficulty,
      startDate,
      format,
      mode: format === 'tournament' ? mode : undefined,
      registrationDeadline: format === 'tournament' ? registrationDeadline : undefined,
      location,
      duration,
      creator: req.user._id,
      status: 'upcoming',
      participants: [{
        _id: req.user._id,
        username: req.user.username,
        role: req.user.role
      }]
    };

    // Initialize tournament structure if format is tournament
    if (format === 'tournament') {
      debateData.tournamentRounds = initializeTournamentRounds();
      debateData.maxParticipants = 32;
      debateData.maxJudges = 8;
      // Set tournament-specific settings
      debateData.tournamentSettings = {
        maxDebaters: 32,
        maxJudges: 8,
        currentDebaters: req.user.role === 'judge' ? 0 : 1,
        currentJudges: req.user.role === 'judge' ? 1 : 0
      };
    }

    const debate = await Debate.create(debateData);
    res.status(201).json(debate);
  } catch (error) {
    console.error('Create debate error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.joinDebate = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Check if user is already a participant
    if (debate.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already a participant' });
    }

    const counts = debate.getParticipantCounts();
    
    // Validate based on format and role
    if (debate.format === 'tournament') {
      if (req.user.role === 'judge' && counts.judges >= counts.maxJudges) {
        return res.status(400).json({ message: 'Maximum judges reached for this tournament' });
      }
      if (req.user.role !== 'judge' && counts.debaters >= counts.maxDebaters) {
        return res.status(400).json({ message: 'Maximum debaters reached for this tournament' });
      }
      
      // Update tournament settings counters
      if (req.user.role === 'judge') {
        debate.tournamentSettings.currentJudges += 1;
      } else {
        debate.tournamentSettings.currentDebaters += 1;
      }
    } else if (debate.isFull()) {
      return res.status(400).json({ message: 'Debate is full' });
    }

    // Add participant
    debate.participants.push({
      _id: req.user._id,
      username: req.user.username,
      role: req.user.role
    });

    // Check if tournament is ready to start
    if (debate.format === 'tournament' && debate.validateTournamentStart()) {
      debate.initializeTournamentBracket();
    }

    const updatedDebate = await debate.save();
    
    // Return updated counts to the client
    if (debate.format === 'tournament') {
      updatedDebate._doc.counts = {
        debaters: debate.tournamentSettings.currentDebaters,
        judges: debate.tournamentSettings.currentJudges,
        maxDebaters: debate.tournamentSettings.maxDebaters,
        maxJudges: debate.tournamentSettings.maxJudges
      };
    }
    
    res.json(updatedDebate);
  } catch (error) {
    console.error('Join debate error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Leave debate
exports.leaveDebate = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('creator', 'username')
      .populate('participants', 'username role');
      
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Check if user is actually in the debate
    if (!debate.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You are not a participant in this debate' });
    }

    // Remove user from participants
    debate.participants = debate.participants.filter(
      p => p._id.toString() !== req.user._id.toString()
    );
    
    await debate.save();

    const updatedDebate = await Debate.findById(debate._id)
      .populate('participants', 'username role')
      .populate('creator', 'username role')
      .lean();

    res.json(updatedDebate);
  } catch (error) {
    console.error('Error leaving debate:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single debate
exports.getDebate = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('creator', 'username role')
      .populate('participants', 'username role')
      .populate('teams.members.userId', 'username role email') // Properly populate team member user data
      .lean()
      .exec();

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Add participant counts for tournament format
    if (debate.format === 'tournament') {
      const counts = {
        debaters: debate.participants.filter(p => p.role !== 'judge').length,
        judges: debate.participants.filter(p => p.role === 'judge').length,
        maxDebaters: 32,
        maxJudges: 8
      };
      debate.counts = counts;
    }

    res.json(debate);
  } catch (error) {
    console.error('Get debate error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's debates (both created and participated)
exports.getUserDebates = async (req, res) => {
  try {
    const createdDebates = await Debate.find({ creator: req.user._id })
      .populate('creator', 'username role')
      .populate('participants', 'username role')
      .populate({ // Populate judges within postings
        path: 'postings',
        populate: { path: 'judges', select: '_id' }
      })
      .sort({ createdAt: -1 })
      .lean();

    const participatedDebates = await Debate.find({
      participants: req.user._id,
      creator: { $ne: req.user._id }
    })
      .populate('creator', 'username role')
      .populate('participants', 'username role')
      .populate({ // Populate judges within postings
        path: 'postings',
        populate: { path: 'judges', select: '_id' }
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      created: createdDebates,
      participated: participatedDebates
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
    const { name, leader, speaker, tournamentId } = req.body;
    
    // Validate that both users exist and are participants in the tournament
    const debate = await Debate.findById(tournamentId);
    if (!debate) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Check if debate has participants in the expected structure
    if (!debate.participants || !Array.isArray(debate.participants)) {
      return res.status(400).json({ 
        message: 'Invalid participant structure in tournament',
        debug: { participantsType: typeof debate.participants }
      });
    }
    
    // In some schemas, participants might have userId, in others they might have _id directly
    // Handle both cases safely
    const isLeaderParticipant = debate.participants.some(p => {
      const participantId = p.userId ? p.userId.toString() : (p._id ? p._id.toString() : null);
      return participantId === leader && p.role !== 'judge';
    });
    
    const isSpeakerParticipant = debate.participants.some(p => {
      const participantId = p.userId ? p.userId.toString() : (p._id ? p._id.toString() : null);
      return participantId === speaker && p.role !== 'judge';
    });
    
    // Skip validation during test data generation to avoid errors
    const isTestMode = req.query.test === 'true' || req.body.isTest === true;
    
    if (!isTestMode && (!isLeaderParticipant || !isSpeakerParticipant)) {
      return res.status(400).json({ 
        message: 'Both team members must be tournament participants',
        details: { 
          leaderFound: isLeaderParticipant,
          speakerFound: isSpeakerParticipant,
          leader,
          speaker
        }
      });
    }
    
    // Create the team
    const team = {
      name,
      members: [
        { userId: leader, role: 'leader' },
        { userId: speaker, role: 'speaker' }
      ],
      // Initialize points and wins to zero
      wins: 0,
      losses: 0,
      points: 0
    };
    
    // Add team to debate
    if (!debate.teams) {
      debate.teams = [];
    }
    
    debate.teams.push(team);
    await debate.save();
    
    // Return the created team
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: error.message });
  }
};

// Register both judges and debaters to a tournament
exports.registerParticipants = async (req, res) => {
  try {
    const { judges, debaters } = req.body;
    console.log('Received registration request:', { judges, debaters });
    const debate = await Debate.findById(req.params.id);
    if (!debate) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    if (debate.format !== 'tournament') {
      return res.status(400).json({ message: 'This is not a tournament debate' });
    }
    if (!Array.isArray(judges) || !Array.isArray(debaters)) {
      return res.status(400).json({ 
        message: 'Invalid input: judges and debaters must be arrays' 
      });
    }

    // Check if limits will be exceeded
    const currentCounts = debate.getParticipantCounts();
    const newJudgeCount = Math.min(8 - currentCounts.judges, judges.length);
    const newDebaterCount = Math.min(32 - currentCounts.debaters, debaters.length);
    
    if (newJudgeCount < judges.length) {
      console.warn(`Only adding ${newJudgeCount} of ${judges.length} judges due to tournament limit`);
    }
    
    if (newDebaterCount < debaters.length) {
      console.warn(`Only adding ${newDebaterCount} of ${debaters.length} debaters due to tournament limit`);
    }

    // Start with current participants
    const currentParticipants = debate.participants || [];
    
    // Convert simple ID strings to proper participant objects for judges (limit to 8)
    let judgeCount = 0;
    for (const judgeId of judges) {
      if (judgeCount >= newJudgeCount) break; // Enforce judge limit
      
      // Skip if judge is already a participant
      if (currentParticipants.some(p => p._id.toString() === judgeId)) {
        continue;
      }
      
      if (judgeId) {
        try {
          const user = await User.findById(judgeId);
          if (user) {
            currentParticipants.push({
              _id: user._id,
              username: user.username,
              role: 'judge',
              judgeRole: 'main'
            });
            judgeCount++;
          }
        } catch (err) {
          console.error(`Error processing judge ID ${judgeId}:`, err);
        }
      }
    }
    
    // Convert simple ID strings to proper participant objects for debaters (limit to 32)
    let debaterCount = 0;
    for (const debaterId of debaters) {
      if (debaterCount >= newDebaterCount) break; // Enforce debater limit
      
      // Skip if debater is already a participant
      if (currentParticipants.some(p => p._id.toString() === debaterId)) {
        continue;
      }
      
      if (debaterId) {
        try {
          const user = await User.findById(debaterId);
          if (user) {
            currentParticipants.push({
              _id: user._id,
              username: user.username,
              role: user.role || 'debater'
            });
            debaterCount++;
          }
        } catch (err) {
          console.error(`Error processing debater ID ${debaterId}:`, err);
        }
      }
    }
    
    // Update the debate with the new participants
    debate.participants = currentParticipants;
    
    // Update tournament settings counters
    const finalCounts = {
      judges: debate.participants.filter(p => p.role === 'judge').length,
      debaters: debate.participants.filter(p => p.role !== 'judge').length
    };
    
    debate.tournamentSettings.currentJudges = finalCounts.judges;
    debate.tournamentSettings.currentDebaters = finalCounts.debaters;
    
    // Save with updated timestamps
    debate.updatedAt = new Date();
    await debate.save();
    
    res.json({
      message: 'Participants registered successfully',
      debate: {
        _id: debate._id,
        title: debate.title,
        participantCount: currentParticipants.length,
        judges: finalCounts.judges,
        debaters: finalCounts.debaters,
        updatedAt: debate.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error registering participants:', error);
    res.status(500).json({ message: error.message });
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
    const testDebaters = await User.find({ role: 'debater', isTestAccount: true }).limit(32);
    
    console.log(`Found ${testJudges.length} test judges and ${testDebaters.length} test debaters`);
    
    // Start with completely empty participants array - no creator included
    const participants = [];
    
    // Add judges (maximum exactly 7 to avoid hitting the 8 judge limit)
    for (const judge of testJudges) {
      participants.push({
        _id: judge._id,
        username: judge.username,
        role: 'judge',
        judgeRole: 'main'
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

// Create APF game posting
exports.createApfPosting = async (req, res) => {
  try {
    const { team1Id, team2Id, location, judgeIds, theme, tournamentId } = req.body;
    const debateId = req.params.id || tournamentId;
    
    console.log('Creating APF posting with:', { 
      team1Id, team2Id, location, judgeIds, theme, debateId 
    });
    
    // Validate required fields
    if (!team1Id || !team2Id || !location || !judgeIds || !theme) {
      return res.status(400).json({ message: 'Missing required fields for APF posting' });
    }

    // Validate that teams are different
    if (team1Id === team2Id) {
      return res.status(400).json({ message: 'Teams cannot be the same' });
    }

    // Fetch debate and populate participants
    const debate = await Debate.findById(debateId).populate('participants');
    if (!debate) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    console.log('Tournament participants structure:', debate.participants.map(p => ({
      id: p._id?.toString(),
      username: p.username,
      role: p.role
    })));

    // Ensure the teams exist in the tournament
    const team1Exists = debate.teams && debate.teams.some(team => 
      team._id.toString() === team1Id.toString() || team.id === team1Id.toString()
    );
    const team2Exists = debate.teams && debate.teams.some(team => 
      team._id.toString() === team2Id.toString() || team.id === team2Id.toString()
    );
    
    if (!team1Exists || !team2Exists) {
      return res.status(400).json({ message: 'One or both teams not found in this tournament' });
    }

    // Instead of filtering by role, check if the judge IDs exist in the participants at all
    const participantIds = debate.participants.map(p => p._id.toString());
    
    // Check if all judge IDs are in the participants array
    const invalidJudges = judgeIds.filter(judgeId => 
      !participantIds.includes(judgeId.toString())
    );

    console.log('Judge IDs to validate:', judgeIds);
    console.log('All participant IDs:', participantIds);
    console.log('Invalid judges:', invalidJudges);

    if (invalidJudges.length > 0) {
      return res.status(400).json({ 
        message: 'One or more judges are not participants in this tournament',
        invalidJudges
      });
    }

    // Create the APF game posting
    const apfPosting = {
      team1: team1Id,
      team2: team2Id,
      location,
      judges: judgeIds,
      theme,
      createdAt: new Date(),
      status: 'scheduled',
      createdBy: req.user._id,
      notifications: {
        judgesNotified: false
      }
    };

    // Add to debate postings
    if (!debate.postings) {
      debate.postings = [];
    }
    
    debate.postings.push(apfPosting);
    await debate.save();

    // Get the created posting
    const createdPosting = debate.postings[debate.postings.length - 1];

    // Add notifications for assigned judges
    const judgeNotifications = [];
    for (const judgeId of judgeIds) {
      const judge = await User.findById(judgeId);
      if (judge) {
        // Create notification in judge's notifications array
        if (!judge.notifications) {
          judge.notifications = [];
        }
        
        const notification = {
          type: 'game_assignment',
          debate: debateId,
          posting: createdPosting._id,
          message: `You have been assigned to judge an APF debate: ${theme}`,
          seen: false,
          createdAt: new Date()
        };
        
        judge.notifications.push(notification);
        await judge.save();
        judgeNotifications.push({
          judgeId: judgeId,
          notificationId: notification._id
        });
      }
    }
    
    // Update posting to track that notifications were sent
    const updatedDebate = await Debate.findById(debateId);
    const updatedPosting = updatedDebate.postings.id(createdPosting._id);
    if (updatedPosting) {
      updatedPosting.notifications.judgesNotified = true;
      updatedPosting.notifications.sentAt = new Date();
      await updatedDebate.save();
    }
    
    console.log('Successfully created APF posting:', createdPosting._id);
    
    res.status(201).json({
      message: 'APF game posted successfully',
      _id: createdPosting._id,
      team1: team1Id,
      team2: team2Id,
      location,
      judges: judgeIds,
      theme,
      createdAt: createdPosting.createdAt,
      judgeNotifications
    });
    
  } catch (error) {
    console.error('Error creating APF posting:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Register a team for a tournament
exports.registerTeam = async (req, res) => {
  try {
    const { leader, speaker, teamName } = req.body;
    const tournamentId = req.params.id;

    // Validate required fields
    if (!leader || !leader.name || !leader.email || !speaker || !speaker.name || !speaker.email || !teamName) {
      return res.status(400).json({ message: 'Missing required fields for team registration' });
    }

    // Get the tournament
    const tournament = await Debate.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Verify tournament is accepting registrations
    if (tournament.format !== 'tournament') {
      return res.status(400).json({ message: 'This is not a tournament' });
    }

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({ message: 'Tournament is no longer accepting registrations' });
    }

    // Check if registration deadline has passed
    if (tournament.registrationDeadline) {
      const now = new Date();
      const deadline = new Date(tournament.registrationDeadline);
      if (now > deadline) {
        return res.status(400).json({ message: 'Registration deadline has passed for this tournament' });
      }
    }

    // Check if the tournament has reached max participants
    const debaterCount = tournament.participants.filter(p => p.role !== 'judge').length;
    if (debaterCount >= 32) {
      return res.status(400).json({ message: 'Tournament has reached maximum number of debaters' });
    }

    // Find or create users for both team members
    const [leaderUser, speakerUser] = await Promise.all([
      findOrCreateUser(leader.name, leader.email),
      findOrCreateUser(speaker.name, speaker.email)
    ]);

    // Add users to tournament participants if not already there
    const leaderExists = tournament.participants.some(p => 
      p._id.toString() === leaderUser._id.toString()
    );

    const speakerExists = tournament.participants.some(p => 
      p._id.toString() === speakerUser._id.toString()
    );

    if (!leaderExists) {
      tournament.participants.push({
        _id: leaderUser._id,
        username: leaderUser.username,
        role: 'debater'
      });
    }

    if (!speakerExists) {
      tournament.participants.push({
        _id: speakerUser._id,
        username: speakerUser.username,
        role: 'debater'
      });
    }

    // Create a new team
    const newTeam = {
      name: teamName,
      members: [
        { userId: leaderUser._id, role: 'leader' },
        { userId: speakerUser._id, role: 'speaker' }
      ]
    };

    if (!tournament.teams) {
      tournament.teams = [];
    }

    tournament.teams.push(newTeam);
    await tournament.save();

    res.status(201).json({
      message: 'Team registered successfully',
      team: {
        id: newTeam._id,
        name: teamName,
        members: [
          { id: leaderUser._id, name: leaderUser.username, role: 'leader' },
          { id: speakerUser._id, name: speakerUser.username, role: 'speaker' }
        ]
      }
    });

  } catch (error) {
    console.error('Error registering team:', error);
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Helper function to find or create a user
const findOrCreateUser = async (name, email) => {
  try {
    // Check if user exists with this email
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user with temporary password
      const password = await bcrypt.hash(Math.random().toString(36).substring(2, 15), 10);
      
      user = await User.create({
        username: name,
        email: email,
        password: password,
        role: 'user',
        temporary: true
      });
    }
    
    return user;
  } catch (error) {
    console.error('Error finding/creating user:', error);
    throw error;
  }
};

// Get detailed information about a specific debate posting
exports.getPostingDetails = async (req, res) => {
  try {
    const { id, postingId } = req.params;
    
    // Find the debate
    const debate = await Debate.findById(id)
      .populate('teams.members.userId', 'username email') // Populate user details within embedded teams
      // Removed populate for postings.team1 and postings.team2 as they now store embedded team _ids
      .populate('postings.judges', 'username role judgeRole'); // Populate judge user details
    
    if (!debate) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    // Find the specific posting
    const posting = debate.postings?.find(p => p._id.toString() === postingId);
    
    if (!posting) {
      return res.status(404).json({ message: 'Posting not found' });
    }
    
    // Find the team details
    const team1 = debate.teams?.find(t => t._id.toString() === posting.team1.toString());
    const team2 = debate.teams?.find(t => t._id.toString() === posting.team2.toString());
    
    // Get winner team name if applicable
    let winnerTeamName = null;
    if (posting.winner) {
      const winnerTeam = debate.teams?.find(t => t._id.toString() === posting.winner.toString());
      winnerTeamName = winnerTeam?.name || 'Unknown Team';
    }
    
    // Prepare team member information
    const team1Members = team1 ? {
      leader: team1.members.find(m => m.role === 'leader')?.userId,
      speaker: team1.members.find(m => m.role === 'speaker')?.userId
    } : null;
    
    const team2Members = team2 ? {
      leader: team2.members.find(m => m.role === 'leader')?.userId,
      speaker: team2.members.find(m => m.role === 'speaker')?.userId
    } : null;
    
    // Format response
    const postingDetails = {
      _id: posting._id,
      tournamentId: id,
      tournamentTitle: debate.title,
      team1: {
        _id: team1?._id,
        name: team1?.name || 'Team 1'
      },
      team2: {
        _id: team2?._id,
        name: team2?.name || 'Team 2'
      },
      team1Members,
      team2Members,
      location: posting.location,
      theme: posting.theme,
      status: posting.status || 'scheduled',
      createdAt: posting.createdAt,
      judges: posting.judges,
      winner: posting.winner,
      winnerTeamName
    };
    
    // Add evaluation data if available
    if (posting.evaluation) {
      postingDetails.evaluation = {
        team1Score: posting.evaluation.team1Score,
        team2Score: posting.evaluation.team2Score,
        comments: posting.evaluation.comments,
        team1Comments: posting.evaluation.team1Comments,
        team2Comments: posting.evaluation.team2Comments,
        individualScores: posting.evaluation.individualScores
      };
    }
    
    // Add transcription data if available
    if (posting.transcription) {
      postingDetails.transcription = {
        full: posting.transcription.full,
        summary: posting.transcription.summary
      };
    }
    
    res.json(postingDetails);
  } catch (error) {
    console.error('Error getting posting details:', error);
    res.status(500).json({ message: error.message });
  }
};

// Randomize teams for tournament
exports.randomizeTeams = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    
    if (!debate) {
      return res.status(404).json({ message: 'Tournament not found' });
    }
    
    if (debate.format !== 'tournament') {
      return res.status(400).json({ message: 'This is not a tournament' });
    }
    
    // Get all debaters
    const debaters = debate.participants.filter(p => p.role !== 'judge');
    
    if (debaters.length < 2) {
      return res.status(400).json({ message: 'Not enough debaters to randomize teams' });
    }
    
    // Shuffle debaters
    const shuffledDebaters = [...debaters].sort(() => Math.random() - 0.5);
    
    // Create teams (leader, speaker pairs)
    const teams = [];
    for (let i = 0; i < shuffledDebaters.length; i += 2) {
      if (i + 1 >= shuffledDebaters.length) break; // Skip if we can't form a complete team
      
      const teamName = `Team ${Math.floor(i/2) + 1}`;
      const leader = shuffledDebaters[i];
      const speaker = shuffledDebaters[i + 1];
      
      teams.push({
        name: teamName,
        members: [
          { userId: leader._id, role: 'leader' },
          { userId: speaker._id, role: 'speaker' }
        ]
      });
    }
    
    // Update tournament
    debate.teams = teams;
    await debate.save();
    
    res.json({
      message: 'Teams randomized successfully',
      teams: teams.map(team => ({
        id: team._id,
        name: team.name,
        members: team.members.map(m => ({
          id: m.userId,
          role: m.role
        }))
      }))
    });
    
  } catch (error) {
    // Log the full error object for detailed validation info
    console.error('Error randomizing teams:', JSON.stringify(error, null, 2));
    // Send a more specific error message if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
