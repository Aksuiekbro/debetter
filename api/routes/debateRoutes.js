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
    updateTournamentMatch,
    updateParticipants,
    createTeam,
    updateTeam,
    registerParticipants,
    generateTestData,
    createApfPosting,
    registerTeam,
    getPostingDetails,
    randomizeTeams,
    createApfBatchPostings,
    updateApfPostingStatus,
    sendApfGameReminder
} = require('../controllers/debateController');
const { protect, isOrganizer } = require('../middleware/authMiddleware');

// Middleware to validate participant registration
const validateParticipantData = (req, res, next) => {
    const { judges, debaters } = req.body;
    if (!Array.isArray(judges) || !Array.isArray(debaters)) {
        return res.status(400).json({
            message: 'Invalid request body: judges and debaters must be arrays'
        });
    }
    next();
};

// Public routes
router.get('/', getDebates);
router.get('/:id', getDebate);

// Protected routes
router.use(protect);
router.post('/', createDebate);
router.get('/user/mydebates', getUserDebates);
router.put('/:id', updateDebate);

// Routes requiring tournament validation
router.post('/:id/join', validateTournamentOperation, joinDebate);
router.post('/:id/leave', validateTournamentOperation, leaveDebate);

// Tournament specific routes
router.post('/:id/teams', assignTeams);
router.post('/:id/rooms', startRoom);
router.post('/:id/speech/analyze', analyzeSpeech);
router.post('/:id/transcription', saveTranscript);
router.post('/:id/analyze/final', analyzeFinalDebate);
router.post('/:id/analyze/interim', analyzeInterim);
router.post('/:id/tournament/brackets', updateTournamentBrackets);
router.post('/:id/tournament/bracket/generate', generateTournamentBracket);
router.post('/:id/initialize-bracket', protect, generateTournamentBracket);
router.post('/:id/tournament/match/update', updateTournamentMatch);
router.put('/:id/tournament/participants', updateParticipants);
router.post('/teams', createTeam);
router.put('/teams/:teamId', updateTeam);

// Team registration route
// router.post('/:id/register-team', registerTeam);

// Team randomization route
router.post('/:id/randomize-teams', randomizeTeams);

// APF Game posting routes
router.post('/:id/postings', isOrganizer, createApfPosting);
router.post('/:id/batch-postings', isOrganizer, createApfBatchPostings);
router.get('/:id/postings/:postingId', getPostingDetails); // Added route for fetching specific posting details
router.put('/:id/postings/:postingId/status', isOrganizer, updateApfPostingStatus);
router.post('/:id/postings/:postingId/reminders', isOrganizer, sendApfGameReminder);

// Special route for tournament participant registration
router.post('/:id/register-participants', validateParticipantData, registerParticipants);

// Organizer only routes
router.post('/:id/generate-test-data', isOrganizer, generateTestData);

module.exports = router;