const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const { protect: auth } = require('../middleware/authMiddleware'); // Import the 'protect' function specifically and rename it to 'auth'
const { check, validationResult } = require('express-validator');

// @route   GET api/tournaments
// @desc    Get all tournaments
// @access  Public
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ startDate: -1 });
    res.json(tournaments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/tournaments/:id
// @desc    Get tournament by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('judges', 'name surname email');
      
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }
    
    res.json(tournament);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Tournament not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tournaments
// @desc    Create a tournament
// @access  Private/Admin
router.post(
  '/',
  [ // Start of the single middleware/handler array
    auth,
    // Validators are now directly in this array
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty(),
    check('location', 'Location is required').not().isEmpty(),
    check('teams', 'Teams are required').isArray({ min: 1 }),
    // Handler function is now the last element in the array
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to create tournaments' });
    }

    try {
      const { name, description, startDate, endDate, location, teams, judges, rounds } = req.body;

      const tournament = new Tournament({
        name,
        description,
        startDate,
        endDate,
        location,
        teams,
        judges,
        rounds,
        status: 'upcoming'
      });

      await tournament.save();
      res.json(tournament);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
] ); // Added closing bracket for the middleware array

// @route   PUT api/tournaments/:id
// @desc    Update a tournament
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update tournaments' });
    }

    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    // Update tournament fields
    const { name, description, startDate, endDate, location, teams, judges, rounds, status, winner } = req.body;

    if (name) tournament.name = name;
    if (description) tournament.description = description;
    if (startDate) tournament.startDate = startDate;
    if (endDate) tournament.endDate = endDate;
    if (location) tournament.location = location;
    if (teams) tournament.teams = teams;
    if (judges) tournament.judges = judges;
    if (rounds) tournament.rounds = rounds;
    if (status) tournament.status = status;
    if (winner) tournament.winner = winner;

    await tournament.save();
    res.json(tournament);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Tournament not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/tournaments/:id
// @desc    Delete a tournament
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete tournaments' });
    }

    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    await tournament.remove();
    res.json({ msg: 'Tournament removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Tournament not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tournaments/:id/scores/:roundIndex/:matchIndex
// @desc    Update match scores
// @access  Private/Judge
router.put('/:id/scores/:roundIndex/:matchIndex', auth, async (req, res) => {
  try {
    // Check if user is a judge
    if (req.user.role !== 'judge' && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update scores' });
    }

    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    const roundIndex = parseInt(req.params.roundIndex);
    const matchIndex = parseInt(req.params.matchIndex);

    // Validate round and match exist
    if (!tournament.rounds[roundIndex] || !tournament.rounds[roundIndex].matches[matchIndex]) {
      return res.status(404).json({ msg: 'Round or match not found' });
    }

    const match = tournament.rounds[roundIndex].matches[matchIndex];
    
    // Check if the judge is assigned to this match
    const isJudgeAssigned = tournament.judges.some(judge => judge.toString() === req.user.id);
    
    if (!isJudgeAssigned && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to score this match' });
    }

    const { team1Score, team2Score, notes } = req.body;

    // Find if this judge has already scored
    let judgeScoreIndex = match.judgeScores ? 
      match.judgeScores.findIndex(score => score.judge && score.judge.toString() === req.user.id) : -1;

    if (judgeScoreIndex === -1) {
      // Add new judge score
      if (!match.judgeScores) {
        match.judgeScores = [];
      }
      match.judgeScores.push({
        judge: req.user.id,
        team1Score,
        team2Score,
        notes
      });
    } else {
      // Update existing judge score
      match.judgeScores[judgeScoreIndex].team1Score = team1Score;
      match.judgeScores[judgeScoreIndex].team2Score = team2Score;
      match.judgeScores[judgeScoreIndex].notes = notes;
    }

    // Calculate average scores
    if (match.judgeScores && match.judgeScores.length > 0) {
      let team1Total = 0;
      let team2Total = 0;
      
      match.judgeScores.forEach(score => {
        team1Total += score.team1Score;
        team2Total += score.team2Score;
      });
      
      match.scores.team1 = Math.round(team1Total / match.judgeScores.length);
      match.scores.team2 = Math.round(team2Total / match.judgeScores.length);
      
      // Determine winner based on scores
      if (match.scores.team1 > match.scores.team2) {
        match.winner = match.team1;
      } else if (match.scores.team2 > match.scores.team1) {
        match.winner = match.team2;
      }
      
      // Mark as completed if all judges have scored
      if (match.judgeScores.length >= Math.min(tournament.judges.length, 3)) {
        match.completed = true;
        
        // Update next round if this match is completed
        if (roundIndex < tournament.rounds.length - 1) {
          const nextRound = tournament.rounds[roundIndex + 1];
          const nextMatchIndex = Math.floor(matchIndex / 2);
          
          if (nextMatchIndex < nextRound.matches.length) {
            const nextMatch = nextRound.matches[nextMatchIndex];
            
            // Place winner in appropriate slot of next match
            if (matchIndex % 2 === 0) {
              nextMatch.team1 = match.winner;
            } else {
              nextMatch.team2 = match.winner;
            }
          }
        }
        
        // If this is the final match of the final round, set tournament winner
        if (roundIndex === tournament.rounds.length - 1 && matchIndex === 0) {
          tournament.winner = match.winner;
          tournament.status = 'completed';
        }
      }
    }

    await tournament.save();
    res.json(tournament);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 