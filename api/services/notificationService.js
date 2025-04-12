const Notification = require('../models/Notification');
const User = require('../models/User');

// Placeholder for Socket.IO instance - will be set up later
let io;
const userSockets = new Map(); // Simple in-memory mapping: userId -> socketId(s)

const setIoInstance = (socketIoInstance) => {
    io = socketIoInstance;
};

const addUserSocket = (userId, socketId) => {
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socketId);
    // console.log(`Socket ${socketId} associated with user ${userId}`); // Removed debug log
};

const removeUserSocket = (userId, socketId) => {
    if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socketId);
        if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
        }
        // console.log(`Socket ${socketId} disassociated from user ${userId}`); // Removed debug log
    }
};

const createNotification = async (data) => {
    const { recipient, type, message, relatedEntity, relatedEntityType } = data;

    try {
        // 1. Check user notification preferences
        const user = await User.findById(recipient);
        if (!user) {
            console.error(`Notification Service: User not found for ID: ${recipient}`);
            return null; // Or throw error
        }

        // Basic check (assuming a simple 'notificationsEnabled' boolean for now)
        // TODO: Implement more granular settings check based on 'type'
        if (!user.notificationSettings || user.notificationSettings.enabled === false) {
            console.log(`Notifications disabled for user ${recipient}. Skipping creation.`);
            return null;
        }

        // 2. Create and save the notification
        const newNotification = new Notification({
            recipient,
            type,
            message,
            relatedEntity,
            relatedEntityType,
            read: false,
        });
        const savedNotification = await newNotification.save();

        // 3. Emit to relevant socket(s) if IO is configured
        if (io && userSockets.has(recipient)) {
            const recipientSocketIds = userSockets.get(recipient);
            recipientSocketIds.forEach(socketId => {
                io.to(socketId).emit('new_notification', savedNotification);
                // console.log(`Emitted 'new_notification' to socket ${socketId} for user ${recipient}`); // Removed debug log
            });
        } else {
             if (!io) console.log("Socket.IO instance not available for emitting.");
             if (!userSockets.has(recipient)) console.log(`No active socket found for user ${recipient}.`);
        }


        return savedNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
        // Consider throwing the error or returning a specific error object
        throw error;
    }
};

const getNotifications = async (userId, options = {}) => {
    const { limit = 10, page = 1, unreadOnly = false } = options;
    const skip = (page - 1) * limit;
    const query = { recipient: userId };

    if (unreadOnly) {
        query.read = false;
    }

    try {
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        const totalCount = await Notification.countDocuments(query);

        return {
            notifications,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalCount,
        };
    } catch (error) {
        console.error(`Error fetching notifications for user ${userId}:`, error);
        throw error;
    }
};

const markAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId }, // Ensure user owns the notification
            { read: true },
            { new: true } // Return the updated document
        );

        if (!notification) {
            console.log(`Notification ${notificationId} not found or user ${userId} mismatch.`);
            return null; // Or throw an error
        }
        return notification;
    } catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
        throw error;
    }
};

const markAllAsRead = async (userId) => {
    try {
        const result = await Notification.updateMany(
            { recipient: userId, read: false },
            { read: true }
        );
        // console.log(`Marked ${result.nModified} notifications as read for user ${userId}`); // Removed informational log
        return result; // Contains information like nModified
    } catch (error) {
        console.error(`Error marking all notifications as read for user ${userId}:`, error);
        throw error;
    }
};

const updateSettings = async (userId, settings) => {
    try {
        // Assuming settings is an object like { enabled: true, types: {...} }
        // Use $set to update only the provided fields within notificationSettings
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { notificationSettings: settings } },
            { new: true, runValidators: true } // Return updated doc, run schema validators
        );

        if (!updatedUser) {
            console.log(`User ${userId} not found for updating notification settings.`);
            return null; // Or throw error
        }
        return updatedUser.notificationSettings;
    } catch (error) {
        console.error(`Error updating notification settings for user ${userId}:`, error);
        throw error;
    }
};


module.exports = {
    setIoInstance,
    addUserSocket,
    removeUserSocket,
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    updateSettings,
};