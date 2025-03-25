const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const { 
    register,
    login,
    getProfile, 
    updateProfile, 
    sendFriendRequest,
    promoteToOrganizer
} = require('../controllers/authController');

// Auth routes
router.post('/register', register);
router.post('/login', login);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Friend request routes
router.post('/:id/friend', protect, sendFriendRequest);

// Admin routes
router.post('/promote-organizer', protect, isAdmin, promoteToOrganizer);

module.exports = router;