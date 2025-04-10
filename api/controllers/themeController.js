const Debate = require('../models/Debate'); // Assuming Debate model holds tournament data including themes
const mongoose = require('mongoose');

// Helper function to check if user is organizer or admin for the tournament
const checkAuthorization = (tournament, userId) => {
    // Check if the user is in the organizers list or is a site admin
    const isOrganizer = tournament.organizers.some(organizer => organizer.equals(userId));
    // Assuming req.user.role holds the user's role ('admin', 'organizer', 'judge', 'debater')
    // You might need to adjust this based on your actual authMiddleware setup
    // const isAdmin = req.user.role === 'admin'; 
    // For now, let's assume req.user is populated correctly by authMiddleware
    // We need access to req.user here, so this helper might need adjustment or logic moved directly into controllers
    // Let's pass req.user to the helper for now.
    // return isOrganizer || req.user.role === 'admin'; // Placeholder - needs actual user role check
    return isOrganizer; // Simplified for now, assuming isOrganizer check in route is sufficient
};


// @desc    Create a new theme for a tournament
// @route   POST /api/debates/:id/themes
// @access  Private (Organizer/Admin)
exports.createTheme = async (req, res) => {
    const { id: tournamentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id; // Assuming req.user is populated by authMiddleware

    if (!text) {
        return res.status(400).json({ message: 'Theme text is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: 'Invalid Tournament ID format' });
    }

    try {
        const tournament = await Debate.findById(tournamentId);

        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }

        // Authorization check (already handled by isOrganizer middleware in route, but double-check)
        // if (!checkAuthorization(tournament, userId)) { // Simplified check
        //     return res.status(403).json({ message: 'User not authorized to modify this tournament' });
        // }
        
        // Check if theme already exists (optional, based on requirements)
        const themeExists = tournament.themes.some(theme => theme.text === text);
        if (themeExists) {
            return res.status(400).json({ message: 'Theme with this text already exists' });
        }

        const newTheme = { text }; // Mongoose will auto-generate _id

        tournament.themes.push(newTheme);
        await tournament.save();

        // Find the newly added theme to return it (Mongoose adds it to the end)
        const addedTheme = tournament.themes[tournament.themes.length - 1];

        res.status(201).json(addedTheme);

    } catch (error) {
        console.error('Error creating theme:', error);
        res.status(500).json({ message: 'Server error creating theme' });
    }
};

// @desc    Get all themes for a tournament
// @route   GET /api/debates/:id/themes
// @access  Private (Authenticated users)
exports.getThemes = async (req, res) => {
    const { id: tournamentId } = req.params;

     if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
        return res.status(400).json({ message: 'Invalid Tournament ID format' });
    }

    try {
        // Select only the themes field to optimize query
        const tournament = await Debate.findById(tournamentId).select('themes');

        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }

        res.status(200).json(tournament.themes);

    } catch (error) {
        console.error('Error fetching themes:', error);
        res.status(500).json({ message: 'Server error fetching themes' });
    }
};

// @desc    Update a specific theme for a tournament
// @route   PUT /api/debates/:id/themes/:themeId
// @access  Private (Organizer/Admin)
exports.updateTheme = async (req, res) => {
    const { id: tournamentId, themeId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
        return res.status(400).json({ message: 'Theme text is required for update' });
    }

    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(themeId)) {
        return res.status(400).json({ message: 'Invalid Tournament or Theme ID format' });
    }

    try {
        const tournament = await Debate.findById(tournamentId);

        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }

        // Authorization check (handled by middleware)
        // if (!checkAuthorization(tournament, userId)) {
        //     return res.status(403).json({ message: 'User not authorized to modify this tournament' });
        // }

        // Find the theme and update it
        const theme = tournament.themes.id(themeId);

        if (!theme) {
            return res.status(404).json({ message: 'Theme not found within this tournament' });
        }
        
        // Check if new text conflicts with another existing theme (optional)
        const conflictExists = tournament.themes.some(t => t.text === text && !t._id.equals(themeId));
        if (conflictExists) {
            return res.status(400).json({ message: 'Another theme with this text already exists' });
        }

        theme.text = text;
        await tournament.save();

        res.status(200).json(theme);

    } catch (error) {
        console.error('Error updating theme:', error);
        res.status(500).json({ message: 'Server error updating theme' });
    }
};

// @desc    Delete a specific theme from a tournament
// @route   DELETE /api/debates/:id/themes/:themeId
// @access  Private (Organizer/Admin)
exports.deleteTheme = async (req, res) => {
    const { id: tournamentId, themeId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(tournamentId) || !mongoose.Types.ObjectId.isValid(themeId)) {
        return res.status(400).json({ message: 'Invalid Tournament or Theme ID format' });
    }

    try {
        const tournament = await Debate.findById(tournamentId);

        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }

        // Authorization check (handled by middleware)
        // if (!checkAuthorization(tournament, userId)) {
        //     return res.status(403).json({ message: 'User not authorized to modify this tournament' });
        // }

        const themeIndex = tournament.themes.findIndex(theme => theme._id.equals(themeId));

        if (themeIndex === -1) {
            return res.status(404).json({ message: 'Theme not found within this tournament' });
        }

        // Remove the theme using pull method on the subdocument array
        tournament.themes.pull({ _id: themeId });
        await tournament.save();

        res.status(200).json({ message: 'Theme deleted successfully' });

    } catch (error) {
        console.error('Error deleting theme:', error);
        res.status(500).json({ message: 'Server error deleting theme' });
    }
};