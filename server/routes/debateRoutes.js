const express = require('express');
const router = express.Router();
const { 
    createDebate, 
    getDebates, 
    getDebate, 
    getUserDebates, 
    updateDebate,
    joinDebate,
    leaveDebate,
    assignTeams,
    startRoom,
    analyzeSpeech,
    saveTranscript,
    analyzeFinalDebate,
    analyzeInterim,
    updateTournamentBrackets,
    validateTournamentOperation,
    generateTournamentBracket,
    updateTournamentMatch
} = require('../controllers/debateController');
const { protect, isOrganizer } = require('../middleware/authMiddleware');

// General debate routes
router.post('/', protect, isOrganizer, createDebate); // Only organizers can create debates
router.get('/', getDebates);
router.get('/my-debates', protect, getUserDebates);

// Specific debate routes with :id parameter
router.get('/:id', getDebate);
router.put('/:id', protect, updateDebate);
router.post('/:id/join', protect, validateTournamentOperation, joinDebate);
router.post('/:id/leave', protect, validateTournamentOperation, leaveDebate);
router.post('/:id/assign-teams', protect, assignTeams);
router.post('/:id/start-room', protect, startRoom);
router.post('/:id/analyze-speech', protect, analyzeSpeech);
router.post('/:id/save-transcript', protect, saveTranscript);
router.post('/:id/analyze-interim', protect, analyzeInterim);
router.post('/:id/end', protect, analyzeFinalDebate);

// Tournament-specific routes
router.post('/:id/generate-bracket', protect, generateTournamentBracket);
router.post('/:id/update-match', protect, updateTournamentMatch);
router.post('/:id/update-brackets', protect, isOrganizer, updateTournamentBrackets); // Only organizers can update tournament brackets

module.exports = router;