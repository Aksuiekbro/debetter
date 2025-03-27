const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findById(decoded.id).select('-password');
            
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server error in auth middleware' });
    }
};

// Middleware to check if user is an organizer
exports.isOrganizer = async (req, res, next) => {
    try {
        if (req.user.role !== 'organizer' && !req.user.isAdmin()) {
            return res.status(403).json({ message: 'Not authorized as organizer' });
        }
        next();
    } catch (error) {
        console.error('Organizer check error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Middleware to check if user is an admin
// For the purpose of this implementation, we'll consider the first organizer user as admin
// In a production environment, you would have a separate admin role
exports.isAdmin = async (req, res, next) => {
    try {
        // Find the first created organizer user
        const adminUser = await User.findOne({ role: 'organizer' }).sort('createdAt');
        
        if (req.user && adminUser && req.user._id.toString() === adminUser._id.toString()) {
            next();
        } else {
            res.status(403).json({ 
                message: 'Access denied: Only administrators can perform this action' 
            });
        }
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ message: 'Server error checking admin status' });
    }
};

// For test data generation, require organizer or admin role
exports.canGenerateTestData = async (req, res, next) => {
    try {
        if (req.user.role !== 'organizer' && !req.user.isAdmin()) {
            return res.status(403).json({ message: 'Only organizers can generate test data' });
        }
        next();
    } catch (error) {
        console.error('Test data generation auth error:', error);
        res.status(500).json({ message: error.message });
    }
};