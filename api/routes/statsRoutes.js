const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserStats, getCommunityStats } = require('../controllers/statsController');

// Protected route for user statistics
router.get('/users/stats', protect, getUserStats);

// Public route for community statistics
router.get('/community', getCommunityStats);

module.exports = router; 