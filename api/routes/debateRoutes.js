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
    // analyzeSpeech, // Removed - Not exported by controller
    saveTranscript,
    analyzeFinalDebate,
    analyzeInterim,
    updateTournamentBrackets,
    // validateTournamentOperation, // Removed - Not exported by controller
    generateTournamentBracket,
    updateTournamentMatch,
    // updateParticipants, // Removed - Not exported by controller (updateParticipant singular exists)
    createTeam,
    updateTeam,
    registerParticipants,
    generateTestData,
    createApfPosting,
    registerTeam,
    getPostingDetails,
    // randomizeTeams, // Removed - Not exported by controller
    createApfBatchPostings,
    updateApfPostingStatus,
    sendApfGameReminder,
    uploadMap,
    getMap,
    deleteMap,
    updateParticipant, // Added import for the new controller function
    deleteParticipant, // Added import for the participant deletion controller function
    deleteTeam, // Import for deleting a team
    uploadAudio, // Import for uploading audio
    uploadBallot, // Import for uploading ballot
    getJudgeLeaderboard, // Import for judge leaderboard
} = require('../controllers/debateController');
const { getParticipantStandings } = require('../controllers/debateController'); // Import for participant standings
const announcementController = require('../controllers/announcementController'); // Import announcement controller
const scheduleRoutes = require('./scheduleRoutes'); // Import schedule routes
const themeController = require('../controllers/themeController'); // Import theme controller
const { protect, isOrganizer } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Middleware for handling file uploads

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
router.post('/:id/join', protect, joinDebate); // Added protect middleware, removed undefined validateTournamentOperation
router.post('/:id/leave', protect, leaveDebate); // Added protect middleware, removed undefined validateTournamentOperation

// Tournament specific routes
router.post('/:id/teams', assignTeams);
router.post('/:id/rooms', startRoom);
// router.post('/:id/speech/analyze', analyzeSpeech); // Commented out - analyzeSpeech is not defined/exported
router.post('/:id/transcription', saveTranscript);
router.post('/:id/analyze/final', analyzeFinalDebate);
router.post('/:id/analyze/interim', analyzeInterim);
router.post('/:id/tournament/brackets', updateTournamentBrackets);
router.post('/:id/tournament/bracket/generate', generateTournamentBracket);
router.post('/:id/initialize-bracket', protect, generateTournamentBracket);
router.post('/:id/tournament/match/update', updateTournamentMatch);
// router.put('/:id/tournament/participants', updateParticipants); // Commented out - updateParticipants is not defined/exported
router.post('/teams', createTeam);
router.put('/teams/:teamId', updateTeam);
router.delete('/:id/teams/:teamId', protect, isOrganizer, deleteTeam); // Route to delete a team from a tournament

// Route to update a specific participant's details within a tournament
router.put('/:id/participants/:participantUserId', isOrganizer, updateParticipant);
// Route to delete a specific participant from a tournament
router.delete('/:id/participants/:participantUserId', isOrganizer, deleteParticipant);

// Route to get the judge leaderboard for a tournament
router.get('/:id/judges/leaderboard', getJudgeLeaderboard);

// Route to get participant standings for a tournament
router.get('/:id/participant-standings', getParticipantStandings);

// Team registration route
// router.post('/:id/register-team', registerTeam);

// Team randomization route
// router.post('/:id/randomize-teams', randomizeTeams); // Commented out - randomizeTeams is not defined/exported

// APF Game posting routes
router.post('/:id/postings', isOrganizer, createApfPosting);
router.post('/:id/batch-postings', isOrganizer, createApfBatchPostings);
router.get('/:id/postings/:postingId', getPostingDetails); // Added route for fetching specific posting details
router.put('/:id/postings/:postingId/status', isOrganizer, updateApfPostingStatus);
router.post('/:id/postings/:postingId/reminders', isOrganizer, sendApfGameReminder);
// Routes for uploading audio and ballot images for a specific posting
router.post('/:id/postings/:postingId/audio', upload.single('audio'), uploadAudio);
router.post('/:id/postings/:postingId/ballot', upload.single('ballot'), uploadBallot);

// Special route for tournament participant registration
router.post('/:id/register-participants', validateParticipantData, registerParticipants);

// Organizer only routes
router.post('/:id/generate-test-data', isOrganizer, generateTestData);

// Tournament Announcement Routes (nested under /:id which represents tournamentId)
// protect middleware is already applied globally above
router.post('/:id/announcements', announcementController.create); // Auth check inside controller
router.get('/:id/announcements', announcementController.getAllForTournament); // Publicly viewable by authenticated users
router.put('/:id/announcements/:announcementId', announcementController.update); // Auth check inside controller
router.delete('/:id/announcements/:announcementId', announcementController.delete); // Auth check inside controller

// Tournament Schedule Routes (nested under /:id which represents tournamentId)
// protect middleware is already applied globally above
// scheduleRoutes handles its own specific auth/role checks internally via controller
router.use('/:id/schedule', scheduleRoutes);


// Tournament Map Routes
// protect middleware is already applied globally above
router.post('/:id/map', isOrganizer, upload.single('mapImage'), uploadMap); // Organizer check + Multer for single file upload
router.get('/:id/map', getMap); // Get map URL (protected globally)
router.delete('/:id/map', isOrganizer, deleteMap); // Organizer check


// Theme management routes
// Base path: /api/debates/:id/themes
// 'protect' middleware is already applied globally

// Get all themes for a tournament
router.get('/:id/themes', themeController.getThemes);

// Create a new theme for a tournament (Organizer/Admin only)
router.post('/:id/themes', isOrganizer, themeController.createTheme);

// Update a specific theme for a tournament (Organizer/Admin only)
router.put('/:id/themes/:themeId', isOrganizer, themeController.updateTheme);

// Delete a specific theme for a tournament (Organizer/Admin only)
router.delete('/:id/themes/:themeId', isOrganizer, themeController.deleteTheme);

module.exports = router;