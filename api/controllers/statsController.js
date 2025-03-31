const Debate = require('../models/Debate');
const User = require('../models/User');

// Get statistics for the authenticated user
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all debates where user participated
        const userDebates = await Debate.find({
            $or: [
                { 'teams.debaters': userId },
                { 'judges': userId }
            ]
        });

        // Calculate statistics
        const participatedDebates = userDebates.length;
        let wins = 0;
        let totalPoints = 0;

        userDebates.forEach(debate => {
            // Check if user was in winning team
            debate.teams.forEach(team => {
                if (team.debaters.includes(userId) && team.isWinner) {
                    wins++;
                }
                // Sum up points if available
                if (team.debaters.includes(userId) && team.points) {
                    totalPoints += team.points;
                }
            });
        });

        const winRate = participatedDebates > 0 ? Math.round((wins / participatedDebates) * 100) : 0;

        res.json({
            participatedDebates,
            wins,
            totalPoints,
            winRate
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ message: 'Error retrieving user statistics' });
    }
};

// Get community-wide statistics
exports.getCommunityStats = async (req, res) => {
    try {
        // Get counts from different collections
        const activeUsers = await User.countDocuments({ active: true });
        
        const debatesHosted = await Debate.countDocuments();
        
        // Count active tournaments (not completed)
        const activeTournaments = await Debate.countDocuments({
            format: 'tournament',
            status: { $ne: 'completed' }
        });

        // Count unique teams across all debates
        const teamsFormed = await Debate.aggregate([
            { $unwind: '$teams' },
            { $group: { _id: null, count: { $sum: 1 } } }
        ]).then(result => result[0]?.count || 0);

        res.json({
            activeUsers,
            debatesHosted,
            activeTournaments,
            teamsFormed
        });
    } catch (error) {
        console.error('Error getting community stats:', error);
        res.status(500).json({ message: 'Error retrieving community statistics' });
    }
}; 