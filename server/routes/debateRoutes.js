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
    registerParticipants,
    generateTestData
} = require('../controllers/debateController');
const { protect, isOrganizer } = require('../middleware/authMiddleware');

// Middleware to validate participant registration
const validateParticipantData = (req, res, next) => {
    const { judges, debaters } = req.body;
    if (!Array.isArray(judges) || !Array.isArray(debaters)) {
        return res.status(400).json({
            message: 'Invalid request body: judges and deb