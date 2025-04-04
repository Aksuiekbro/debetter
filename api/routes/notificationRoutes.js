// api/routes/notificationRoutes.js
const express = require('express');
const {
    getNotifications,
    markOneRead,
    markAllRead,
    updateSettings,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware'); // Path based on instructions

const router = express.Router();

// Apply protect middleware to all routes in this file
router.use(protect);

router.route('/')
    .get(getNotifications);

router.route('/:id/mark-read')
    .post(markOneRead);

router.route('/mark-all-read')
    .post(markAllRead);

router.route('/settings')
    .put(updateSettings);

module.exports = router;