const express = require('express');
const router = express.Router();

const debateController = require('../controllers/debateController');

// Now destructure the required functions from the inspected object
const {
    createDebate,
    getDebates,
    getDebate,
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
    getDebateTeams, // Added missing import
    getUserDebates, // Added missing import for user's debates route
    // randomizeTeams, // Removed - Not exported by controller
    createApfBatchPostings,
    updateApfPostingStatus,
    sendApfGameReminder,
    uploadMap,
    getMap,
    deleteMap,
    updateParticipant, // Added import for the new controller function
    addParticipant, // Added import for adding a participant
    deleteParticipant, // Added import for the participant deletion controller function
    deleteTeam, // Import for deleting a team
    uploadAudio, // Import for uploading audio
    uploadBallot, // Import for uploading ballot
    getJudgeLeaderboard, // Import for judge leaderboard
    updateOrganizers, // Import the new controller function
    registerTeamWithParticipants, // Import the new controller function for team registration
} = require('../controllers/debateController'); // Use the actual controller object here

const { getParticipantStandings } = require('../controllers/debateController'); // Import for participant standings
const announcementRoutes = require('./announcementRoutes'); // Import announcement ROUTES
const commentRoutes = require('./commentRoutes'); // Import comment ROUTES
const scheduleRoutes = require('./scheduleRoutes'); // Import schedule routes
const registrationFieldRoutes = require('./registrationFieldRoutes'); // Import registration field routes
const checkInRoutes = require('./checkInRoutes'); // Import check-in routes
const resultsRoutes = require('./resultsRoutes'); // Import results routes
const matchPostingsRoutes = require('./matchPostingsRoutes'); // Import match postings routes
const pairingRoutes = require('./pairingRoutes'); // Import pairing routes
const ballotRoutes = require('./ballotRoutes'); // Import ballot routes
const entrantRoutes = require('./entrantRoutes'); // Import entrant routes
const judgeRoutes = require('./judgeRoutes'); // Import judge routes
const themeController = require('../controllers/themeController'); // Import theme controller
const { protect, isOrganizer: isAdminOrGlobalOrganizer } = require('../middleware/authMiddleware'); // Renamed for clarity
const { isTournamentOrganizer } = require('../middleware/tournamentAuthMiddleware'); // Import specific tournament auth
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

router.get('/:debateId/teams', getDebateTeams); // Route to get teams for a specific debate
// Protected routes
router.use(protect); // Apply basic authentication to all subsequent routes

// Creating a new debate/tournament - Requires global organizer/admin role
router.post('/', isAdminOrGlobalOrganizer, createDebate);

// User-specific routes (no specific tournament role needed beyond being logged in)
router.get('/user/mydebates', getUserDebates); // Should now use the directly imported function
router.post('/:id/join', joinDebate); // Joining doesn't require organizer role
router.post('/:id/leave', leaveDebate); // Leaving doesn't require organizer role
router.post('/:id/register-team', registerTeamWithParticipants); // New route for team registration

// Routes requiring specific tournament organizer/creator permissions
router.put('/:id', isTournamentOrganizer, updateDebate); // Updating tournament details
router.post('/:id/teams', isTournamentOrganizer, assignTeams); // Assigning teams (if manual)
router.post('/:id/rooms', isTournamentOrganizer, startRoom); // Starting a room (likely organizer action)
router.post('/:id/transcription', isTournamentOrganizer, saveTranscript); // Saving transcript (might depend on who controls recording)
router.post('/:id/analyze/final', isTournamentOrganizer, analyzeFinalDebate); // Final analysis trigger
router.post('/:id/analyze/interim', isTournamentOrganizer, analyzeInterim); // Interim analysis trigger
router.post('/:id/tournament/brackets', isTournamentOrganizer, updateTournamentBrackets); // Manual bracket update
router.post('/:id/initialize-bracket', isTournamentOrganizer, generateTournamentBracket); // Initial bracket generation
router.post('/:id/tournament/match/update', isTournamentOrganizer, updateTournamentMatch); // Updating match results (judges might do this via specific ballot routes?)

// Team Management within a specific tournament
router.post('/:id/teams', isTournamentOrganizer, createTeam); // Create team *for* a specific tournament
router.put('/:id/teams/:teamId', isTournamentOrganizer, updateTeam); // Update team *within* a specific tournament
router.delete('/:id/teams/:teamId', isTournamentOrganizer, deleteTeam); // Delete team *from* a specific tournament

// Participant Management within a specific tournament
router.post('/:id/participants', isTournamentOrganizer, addParticipant); // Add participant
router.put('/:id/participants/:participantUserId', isTournamentOrganizer, updateParticipant); // Update participant
router.delete('/:id/participants/:participantUserId', isTournamentOrganizer, deleteParticipant); // Delete participant

// Posting Management within a specific tournament
router.post('/:id/postings', isTournamentOrganizer, createApfPosting);
router.post('/:id/batch-postings', isTournamentOrganizer, createApfBatchPostings);
router.put('/:id/postings/:postingId/status', isTournamentOrganizer, updateApfPostingStatus);
router.post('/:id/postings/:postingId/reminders', isTournamentOrganizer, sendApfGameReminder);
// Uploads might be done by judges/admins as well, consider separate middleware if needed
router.post('/:id/postings/:postingId/audio', isTournamentOrganizer, upload.single('audio'), uploadAudio);
router.post('/:id/postings/:postingId/ballot', isTournamentOrganizer, upload.single('ballot'), uploadBallot);

// Special registration route - needs organizer access
router.post('/:id/register-participants', isTournamentOrganizer, validateParticipantData, registerParticipants);

// Test data generation - organizer only
router.post('/:id/generate-test-data', isTournamentOrganizer, generateTestData);

// Map Management - organizer only
router.post('/:id/map', isTournamentOrganizer, upload.single('mapImage'), uploadMap);
router.delete('/:id/map', isTournamentOrganizer, deleteMap);

// Theme Management - organizer only
router.post('/:id/themes', isTournamentOrganizer, themeController.createTheme);
router.put('/:id/themes/:themeId', isTournamentOrganizer, themeController.updateTheme);
router.delete('/:id/themes/:themeId', isTournamentOrganizer, themeController.deleteTheme);

// Organizer Management - Creator Only (Specific check needed in controller/service)
router.put('/:id/organizers', updateOrganizers); // Add route for updating organizers

// Publicly accessible GET routes (or routes needing only base auth)
router.get('/:id/judges/leaderboard', getJudgeLeaderboard); // Public leaderboard view

// Route to get participant standings for a tournament
router.get('/:id/participant-standings', getParticipantStandings);

router.get('/:id/participant-standings', getParticipantStandings); // Public standings view
router.get('/:id/themes', themeController.getThemes); // Public themes view

// Routes using nested routers (assuming they handle their own auth internally or inherit 'protect')
router.use('/:id/announcements', announcementRoutes); // Use the imported routes directly
router.use('/:id/announcements/:announcementId/comments', commentRoutes); // Use the imported routes directly
router.use('/:id/schedule', scheduleRoutes);
router.use('/:id/registration-fields', registrationFieldRoutes);
router.use('/:id/check-in', checkInRoutes);
router.use('/:id/results', resultsRoutes);
router.use('/:id/match-postings', matchPostingsRoutes);
router.use('/:id/pairings', pairingRoutes);
router.use('/:id/ballots', ballotRoutes);
router.use('/:id/entrants', entrantRoutes);
router.use('/:id/judges', judgeRoutes);

module.exports = router;
