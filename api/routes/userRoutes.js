const User = require('../models/User');
const express = require('express');
const router = express.Router();
const { protect, isAdmin, canGenerateTestData } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Import upload middleware
const {
    register,
    login,
    getProfile,
    updateProfile,
    sendFriendRequest,
    registerTestUsers,
    updateProfilePhoto // Import the new controller function
} = require('../controllers/authController');
const aiService = require('../services/aiService');

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/register-test-users', protect, canGenerateTestData, registerTestUsers);

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/photo', protect, upload.single('profilePhoto'), updateProfilePhoto); // Add profile photo upload route

// Friend request routes
router.post('/:id/friend', protect, sendFriendRequest);

// Admin routes - both routes commented out as their handlers don't exist
// router.post('/promote-organizer', protect, isAdmin, promoteToOrganizer);
// router.put('/update-role', protect, updateUserRole);

// AI test data generation route
router.get('/ai/generate-test-users', protect, async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10;
    const testUsers = await aiService.generateTestUsers(count);
    res.json(testUsers);
  } catch (error) {
    console.error('Error generating test users:', error);
    res.status(500).json({ error: 'Failed to generate test users' });
  }
});

// Routes to get test users for tournament registration
router.get('/test/judges', protect, async (req, res) => {
  try {
    const judges = await User.find({ 
      role: 'judge',
      email: { $regex: /test\.com$/ }
    }).select('_id username email role judgeRole createdAt');
    
    res.json({ users: judges });
  } catch (error) {
    console.error('Error fetching test judges:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/test/debaters', protect, async (req, res) => {
  try {
    const debaters = await User.find({
      role: 'user',
      email: { $regex: /test\.com$/ }
    }).select('_id username email role createdAt');
    
    res.json({ users: debaters });
  } catch (error) {
    console.error('Error fetching test debaters:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;