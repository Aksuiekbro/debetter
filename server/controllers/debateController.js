const Debate = require('../models/Debate');
const { analyzeDebateSpeech, analyzeDebateSummary } = require('../services/aiService');

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
        sort = { 'participants': -1 }; // Sort by number of participants
        break;
      case 'upcoming':
        sort = { startDate: 1 };
        break;
      case 'difficulty':
        sort = { 
          difficulty: 1,
          startDate: 1
        };
        break;
      default:
        sort = { createdAt: -1 };
    }

    console.log('Filter:', filter); // Debug log
    console.log('Sort:', sort); // Debug log

    const debates = await Debate.find(filter)
      .sort(sort)
      .populate('creator', 'username')
      .populate('participants', 'username role')
      .lean();

    console.log(`Found ${debates.length} debates`); // Debug log
    res.json(debates);
  } catch (error) {
    console.error('Error in getDebates:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new debate
exports.createDebate = async (req, res) => {
  try {
    // Validate tournament-specific requirements
    if (req.body.format === 'tournament') {
      // Force participant count to 32 for tournaments
      req.body.maxParticipants = 32;
      // Force judge count to 8 for tournaments
      req.body.requiredJudges = 8;
      
      if (!['solo', 'duo'].includes(req.body.mode)) {
        return res.status(400).json({ 
          message: 'Tournament format must specify either solo or duo mode' 
        });
      }

      // Initialize tournament rounds (5 rounds for 32 participants)
      // Round 1: 16 matches
      // Round 2: 8 matches
      // Round 3: 4 matches (quarter-finals)
      // Round 4: 2 matches (semi-finals)
      // Round 5: 1 match (finals)
      const tournamentRounds = [
        { roundNumber: 1, matches: Array(16).fill(null).map((_, i) => ({ matchNumber: i + 1 })) },
        { roundNumber: 2, matches: Array(8).fill(null).map((_, i) => ({ matchNumber: i + 1 })) },
        { roundNumber: 3, matches: Array(4).fill(null).map((_, i) => ({ matchNumber: i + 1 })) },
        { roundNumber: 4, matches: Array(2).fill(null).map((_, i) => ({ matchNumber: i + 1 })) },
        { roundNumber: 5, matches: [{ matchNumber: 1 }] }
      ];

      req.body.tournamentRounds = tournamentRounds;
    }

    const debate = new Debate({
      ...req.body,
      creator: req.user._id,
      participants: [req.user._id] // Automatically add the creator as a participant
    });

    await debate.save();
    
    // Fetch the newly created debate with populated fields
    const populatedDebate = await Debate.findById(debate._id)
      .populate('creator', 'username')
      .populate('participants', 'username role');
      
    res.status(201).json(populatedDebate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Join debate
exports.joinDebate = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('creator', 'username')
      .populate('participants', 'username role')
      .populate('teamRegistrations.members', 'username');
      
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Check if user already joined
    if (debate.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already joined this debate' });
    }

    // For tournament format
    if (debate.format === 'tournament') {
      const currentParticipants = debate.participants.filter(p => p.role !== 'judge').length;
      
      if (currentParticipants >= 32) {
        return res.status(400).json({ message: 'Tournament is full' });
      }

      // For duo mode, handle team registration
      if (debate.mode === 'duo') {
        const teamMateId = req.body.teamMateId;
        
        // Validate teammate for duo mode
        if (!teamMateId) {
          return res.status(400).json({ 
            message: 'Duo tournament requires a teammate. Please provide teamMateId.' 
          });
        }

        // Check if teammate exists and is not already in a team
        const isTeamMateRegistered = debate.teamRegistrations.some(team => 
          team.members.some(member => member._id.toString() === teamMateId)
        );

        if (isTeamMateRegistered) {
          return res.status(400).json({ 
            message: 'Selected teammate is already registered with another team' 
          });
        }

        // Create new team registration
        debate.teamRegistrations.push({
          members: [req.user._id, teamMateId],
          registered: new Date(),
          confirmed: false
        });
      }
    } else {
      // Standard format - check against maxParticipants
      if (debate.participants.length >= debate.maxParticipants) {
        return res.status(400).json({ message: 'Debate is full' });
      }
    }

    // Add user to participants
    debate.participants.push(req.user._id);
    await debate.save();

    // Fetch the updated debate with populated fields
    const updatedDebate = await Debate.findById(debate._id)
      .populate('creator', 'username')
      .populate('participants', 'username role')
      .populate('teamRegistrations.members', 'username');

    res.json(updatedDebate);
  } catch (error) {
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

    // Prevent judges from leaving their own debates
    if (debate.creator.toString() === req.user._id.toString() && req.user.role === 'judge') {
      return res.status(403).json({ message: 'Judges cannot leave their own debates' });
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

    // Fetch updated debate with populated fields
    const updatedDebate = await Debate.findById(debate._id)
      .populate('creator', 'username')
      .populate('participants', 'username role');

    res.json(updatedDebate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single debate
exports.getDebate = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('creator', 'username')
      .populate('participants', 'username');
    
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }
    
    res.json(debate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's debates (both created and participated)
exports.getUserDebates = async (req, res) => {
  try {
    const createdDebates = await Debate.find({ creator: req.user._id })
      .populate('creator', 'username')
      .populate('participants', 'username')
      .sort({ createdAt: -1 });

    const participatedDebates = await Debate.find({
      participants: req.user._id,
      creator: { $ne: req.user._id }
    })
      .populate('creator', 'username')
      .populate('participants', 'username')
      .sort({ createdAt: -1 });

    res.json({
      created: createdDebates,
      participated: participatedDebates
    });
  } catch (error) {
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

// Assign teams to debate
exports.assignTeams = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id)
      .populate('participants', 'username role');

    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Verify that the user is a judge in this debate
    const isJudge = debate.participants.some(
      p => p._id.toString() === req.user._id.toString() && p.role === 'judge'
    );

    if (!isJudge) {
      return res.status(403).json({ message: 'Only judges can assign teams' });
    }

    debate.teams = req.body.teams;
    debate.status = 'team-assignment';
    await debate.save();

    // Populate the updated debate
    const updatedDebate = await Debate.findById(debate._id)
      .populate('participants', 'username role')
      .populate('teams.members', 'username role');

    res.json(updatedDebate);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Verify that the user is a judge
    const isJudge = debate.participants.some(
      p => p._id.toString() === req.user._id.toString() && p.role === 'judge'
    );

    if (!isJudge) {
      return res.status(403).json({ message: 'Only judges can start rooms' });
    }

    // Deactivate any existing active rooms
    debate.rooms.forEach(room => {
      if (room.isActive) {
        room.isActive = false;
      }
    });

    // Create a new room for this judge
    const room = {
      judge: req.user._id,
      teams: debate.teams,
      isActive: true,
      transcription: []
    };

    debate.rooms.push(room);
    debate.status = 'in-progress';
    await debate.save();

    // Get the created room with populated fields
    const updatedDebate = await Debate.findById(debate._id)
      .populate('rooms.judge', 'username')
      .populate('rooms.transcription.speaker', 'username');
    const createdRoom = updatedDebate.rooms[updatedDebate.rooms.length - 1];

    console.log('Room created:', {
      roomId: createdRoom._id,
      isActive: createdRoom.isActive,
      judgeId: createdRoom.judge
    });

    res.json({ room: createdRoom });
  } catch (error) {
    console.error('Error starting room:', error);
    res.status(500).json({ message: error.message });
  }
};

// Analyze speech using AI
exports.analyzeSpeech = async (req, res) => {
  try {
    const debate = await Debate.findById(req.params.id);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }

    const room = debate.rooms.id(req.body.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Use Gemini AI to analyze the speech
    const analysis = await analyzeDebateSpeech(req.body.transcript);

    // Add to room transcription
    room.transcription.push({
      text: req.body.transcript,
      timestamp: new Date(),
      aiHighlights: analysis,
      speaker: req.user._id
    });

    await debate.save();
    res.json({ analysis });
  } catch (error) {
    console.error('Error in analyzeSpeech:', error);
    res.status(500).json({ message: error.message });
  }
};

// End debate and perform final analysis
exports.analyzeFinalDebate = async (req, res) => {
  try {
    console.log('Analyzing debate:', req.params.id);
    const debate = await Debate.findById(req.params.id)
      .populate('participants', 'username role')
      .populate('teams.members', 'username')
      .populate('rooms.transcription.speaker', 'username');

    if (!debate) {
      console.log('Debate not found:', req.params.id);
      return res.status(404).json({ message: 'Debate not found' });
    }

    // Verify that the user is a judge in this debate
    const isJudge = debate.participants.some(
      p => p._id.toString() === req.user._id.toString() && p.role === 'judge'
    );

    if (!isJudge) {
      console.log('User is not a judge:', req.user._id);
      return res.status(403).json({ message: 'Only judges can end debates' });
    }

    // Get team information first
    const propositionTeam = debate.teams.find(t => t.side === 'proposition');
    const oppositionTeam = debate.teams.find(t => t.side === 'opposition');

    console.log('Teams found:', {
      proposition: propositionTeam?.members?.length || 0,
      opposition: oppositionTeam?.members?.length || 0
    });

    const teams = {
      propositionTeam: propositionTeam?.members.map(m => m.username) || [],
      oppositionTeam: oppositionTeam?.members.map(m => m.username) || []
    };

    // Find the active room and get its transcriptions
    const activeRoom = debate.rooms.find(r => r.isActive);
    console.log('Active room found:', activeRoom?._id);
    console.log('Room transcriptions:', activeRoom?.transcription?.length || 0);

    if (!activeRoom || !activeRoom.transcription || activeRoom.transcription.length === 0) {
      console.log('No transcriptions found in the active room');
      return res.status(400).json({ message: 'No debate transcript available for analysis' });
    }

    // Format transcriptions
    const allTranscriptions = activeRoom.transcription.map(t => ({
      team: propositionTeam?.members.some(m => m._id.toString() === t.speaker._id.toString())
        ? 'Proposition'
        : oppositionTeam?.members.some(m => m._id.toString() === t.speaker._id.toString())
          ? 'Opposition'
          : 'Unknown',
      speaker: t.speaker.username,
      text: t.text,
      timestamp: t.timestamp
    }));

    // Sort by timestamp
    allTranscriptions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Format the transcript with team and speaker information
    const formattedTranscript = allTranscriptions
      .map(t => `[${t.team}] ${t.speaker}: ${t.text}`)
      .join('\n\n');

    console.log('Formatted transcript length:', formattedTranscript.length);
    console.log('Sample of transcript:', formattedTranscript.substring(0, 200));

    if (!formattedTranscript.trim()) {
      return res.status(400).json({ message: 'No debate transcript available for analysis' });
    }

    // Analyze the complete debate
    console.log('Starting Gemini analysis...');
    const analysis = await analyzeDebateSummary(formattedTranscript, teams);
    console.log('Analysis completed:', Object.keys(analysis));

    // Update debate status and save analysis
    debate.status = 'completed';
    debate.analysis = analysis;
    debate.endedAt = new Date();
    
    // Mark room as inactive
    if (activeRoom) {
      activeRoom.isActive = false;
    }
    
    await debate.save();
    console.log('Debate saved with analysis');

    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing debate:', error);
    res.status(500).json({ message: error.message });
  }
};

// Save debate transcript segment
exports.saveTranscript = async (req, res) => {
  try {
    console.log('Saving transcript:', {
      debateId: req.params.id,
      roomId: req.body.roomId,
      text: req.body.text,
      speakerId: req.body.speaker
    });

    const debate = await Debate.findById(req.params.id)
      .populate('rooms.transcription.speaker', 'username');

    if (!debate) {
      console.log('Debate not found:', req.params.id);
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
      console.log('No active room found');
      return res.status(404).json({ message: 'Active room not found' });
    }

    // Add transcript to room
    const transcriptEntry = {
      text: req.body.text,
      timestamp: req.body.timestamp || new Date(),
      speaker: req.body.speaker,
      aiHighlights: {
        keyArguments: [],
        statisticalClaims: [],
        logicalConnections: []
      }
    };

    room.transcription.push(transcriptEntry);
    console.log('Added transcript entry:', transcriptEntry);
    console.log('Current room transcription count:', room.transcription.length);

    await debate.save();
    console.log('Debate saved successfully');

    // Populate the new transcript entry
    const updatedDebate = await Debate.findById(debate._id)
      .populate('rooms.transcription.speaker', 'username');
    const updatedRoom = updatedDebate.rooms.id(room._id);

    // Return the updated room's transcription
    res.json({ 
      message: 'Transcript saved successfully',
      transcription: updatedRoom.transcription
    });
  } catch (error) {
    console.error('Error saving transcript:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper functions for text analysis (placeholder implementation)
function extractKeyArguments(text) {
  // TODO: Replace with Gemini API
  const sentences = text.split('.');
  return sentences
    .filter(s => s.length > 30)
    .slice(0, 3)
    .map(s => s.trim());
}

function extractStatisticalClaims(text) {
  // TODO: Replace with Gemini API
  const numbers = text.match(/\d+%|\d+ percent|\d+ people|\d+ individuals/g) || [];
  return numbers.slice(0, 3);
}

function extractLogicalConnections(text) {
  // TODO: Replace with Gemini API
  const connections = text.match(/therefore|because|as a result|consequently/g) || [];
  return [...new Set(connections)];
}