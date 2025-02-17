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
    analyzeFinalDebate
} = require('../controllers/debateController');
const { protect } = require('../middleware/authMiddleware');

// General debate routes
router.post('/', protect, createDebate);
router.get('/', getDebates);
router.get('/my-debates', protect, getUserDebates);

// Specific debate routes with :id parameter
router.get('/:id', getDebate);
router.put('/:id', protect, updateDebate);
router.post('/:id/join', protect, joinDebate);
router.post('/:id/leave', protect, leaveDebate);
router.post('/:id/assign-teams', protect, assignTeams);
router.post('/:id/start-room', protect, startRoom);
router.post('/:id/analyze-speech', protect, analyzeSpeech);
router.post('/:id/save-transcript', protect, saveTranscript);
router.post('/:id/end', protect, analyzeFinalDebate);

module.exports = router;