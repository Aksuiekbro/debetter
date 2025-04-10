// api/controllers/notificationController.js
const notificationService = require('../services/notificationService');

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, filter = 'all' } = req.query; // Default pagination and filter
        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            filter, // 'all', 'read', 'unread'
        };
        const notifications = await notificationService.getNotifications(userId, options);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error while fetching notifications' });
    }
};

// @desc    Mark a specific notification as read
// @route   POST /api/notifications/:id/mark-read
// @access  Private
const markOneRead = async (req, res) => {
    try {
        const userId = req.user._id;
        const notificationId = req.params.id;
        const notification = await notificationService.markAsRead(notificationId, userId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found or not authorized' });
        }
        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error while marking notification as read' });
    }
};

// @desc    Mark all notifications as read for the user
// @route   POST /api/notifications/mark-all-read
// @access  Private
const markAllRead = async (req, res) => {
    try {
        const userId = req.user._id;
        await notificationService.markAllAsRead(userId);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error while marking all notifications as read' });
    }
};

// @desc    Update notification settings for the user
// @route   PUT /api/notifications/settings
// @access  Private
const updateSettings = async (req, res) => {
    try {
        const userId = req.user._id;
        const settings = req.body; // Expecting { emailEnabled: boolean, pushEnabled: boolean }
        const updatedSettings = await notificationService.updateSettings(userId, settings);
        res.json({ message: 'Notification settings updated', settings: updatedSettings });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Server error while updating notification settings' });
    }
};

module.exports = {
    getNotifications,
    markOneRead,
    markAllRead,
    updateSettings,
};