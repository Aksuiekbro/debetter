const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('[DEBUG] Extracted Token:', token); // Added for debugging
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            console.log('[DEBUG] Decoded Token Payload:', decoded); // Added for debugging
            const userLookupTimeout = 10000; // 10 seconds
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => {
                    const timeoutError = new Error('User lookup timed out');
                    timeoutError.name = 'TimeoutError'; // Custom name for easier identification
                    reject(timeoutError);
                }, userLookupTimeout)
            );

            const userPromise = User.findById(decoded.id).select('-password'); // Original query

            // Race the user lookup against the timeout
            const user = await Promise.race([userPromise, timeoutPromise]);
            console.log('[DEBUG] User found in DB:', JSON.stringify(user, null, 2)); // Added for debugging

            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('[DEBUG] Auth middleware inner error (Token verification/User lookup):', error, 'Token:', token); // Enhanced logging
            // Handle specific errors from the try block above
            if (error.name === 'TimeoutError') {
                // Handle the specific timeout error from Promise.race
                return res.status(503).json({ message: 'User lookup timed out' });
            } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                // Handle JWT verification errors specifically
                return res.status(401).json({ message: 'Not authorized, token failed' });
            } else {
                // For any other errors caught here (e.g., unexpected DB errors not caught by timeout,
                // or other errors from jwt.verify if they occur),
                // rethrow to be handled by the outer catch block as a general server error.
                throw error;
            }
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server error in auth middleware' });
    }
};

// Middleware to check if user is an organizer
exports.isOrganizer = async (req, res, next) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Not authorized as organizer' });
        }
        next();
    } catch (error) {
        console.error('Organizer check error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Admin functionality removed - only organizers have special permissions now

// For test data generation, require organizer role
exports.canGenerateTestData = async (req, res, next) => {
    try {
        console.log('[DEBUG] User object received by canGenerateTestData:', JSON.stringify(req.user, null, 2)); // Added for debugging
        console.log('[DEBUG] Role check:', req.user.role, '=== "organizer" ->', req.user.role === 'organizer'); // Added for debugging
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can generate test data' });
        }
        next();
    } catch (error) {
        console.error('Test data generation auth error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Middleware factory to check for specific roles
exports.requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            // This should ideally be caught by 'authenticate' middleware first
            return res.status(401).json({ message: 'Not authenticated' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied: Requires one of the following roles: ${roles.join(', ')}`
            });
        }
        next();
    };
};
