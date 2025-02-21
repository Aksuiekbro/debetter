const Debate = require('../models/Debate');
const { analyzeDebateSpeech, analyzeDebateSummary, analyzeInterimTranscript } = require('../services/aiService');

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
      .sort({ createdAt: -1 })
      .lean();

    const participatedDebates = await Debate.find({
      participants: req.user._id,
      creator: { $ne: req.user._id }
    })
      .populate('creator', 'username role')
      .populate('participants', 'username role')
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

    const updatedDebate = await Debate.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          title: req.body.title,
          description: req.body.description,
          category: req.body.category,
          difficulty: req.body.difficulty,
          startDate: req.body.startDate,
          maxParticipants: req.body.maxParticipants
        }
      },
      { new: true }
    ).populate('creator', 'username').populate('participants', 'username');

    res.json(updatedDebate);
  } catch (error) {
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