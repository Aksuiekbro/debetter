const teamService = require('../services/teamService');
const judgeService = require('../services/judgeService');
const Debate = require('../models/Debate');

// Get check-in status for a tournament (teams and judges)
exports.getCheckInStatus = async (req, res) => {
  try {
    const { id: tournamentId } = req.params; // Use 'id' from route param
    
    // Get teams with their check-in status
    const teams = await teamService.getTeamsForDebate(tournamentId);
    
    // Get judges with their check-in status
    const judges = await judgeService.getJudgesForTournament(tournamentId);
    
    // Return combined data
    res.status(200).json({
      success: true,
      data: {
        teams: teams.map(team => ({
          id: team._id.toString(),
          name: team.name,
          members: team.members.map(member => ({
            id: member.userId._id,
            name: member.userId.username,
            role: member.role
          })),
          club: team.club || '',
          city: team.city || '',
          institution: team.institution || '',
          isPresent: team.isPresent || false,
          checkedInAt: team.checkedInAt,
          checkedInBy: team.checkedInBy ? {
            id: team.checkedInBy._id,
            name: team.checkedInBy.username
          } : null
        })),
        judges: judges.map(judge => ({
          id: judge.id,
          name: judge.name,
          club: judge.club || '',
          judgeStatus: judge.judgeStatus || '',
          isPresent: judge.isPresent || false,
          checkedInAt: judge.checkedInAt,
          checkedInBy: judge.checkedInBy ? {
            id: judge.checkedInBy._id,
            name: judge.checkedInBy.username
          } : null
        }))
      }
    });
  } catch (error) {
    console.error('Error getting check-in status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get check-in status'
    });
  }
};

// Check in a team
exports.checkInTeam = async (req, res) => {
  try {
    const { id: tournamentId, teamId } = req.params; // Use 'id' from route param
    const userId = req.user._id;
    
    const team = await teamService.checkInTeam(tournamentId, teamId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Team checked in successfully',
      data: {
        id: team._id.toString(),
        name: team.name,
        isPresent: team.isPresent,
        checkedInAt: team.checkedInAt
      }
    });
  } catch (error) {
    console.error('Error checking in team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check in team'
    });
  }
};

// Check out a team
exports.checkOutTeam = async (req, res) => {
  try {
    const { id: tournamentId, teamId } = req.params; // Use 'id' from route param
    
    const team = await teamService.checkOutTeam(tournamentId, teamId);
    
    res.status(200).json({
      success: true,
      message: 'Team checked out successfully',
      data: {
        id: team._id.toString(),
        name: team.name,
        isPresent: team.isPresent
      }
    });
  } catch (error) {
    console.error('Error checking out team:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check out team'
    });
  }
};

// Check in a judge
exports.checkInJudge = async (req, res) => {
  try {
    const { id: tournamentId, judgeId } = req.params; // Use 'id' from route param
    const userId = req.user._id;
    
    const judge = await judgeService.checkInJudge(tournamentId, judgeId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Judge checked in successfully',
      data: {
        id: judge.id,
        name: judge.name,
        isPresent: judge.isPresent,
        checkedInAt: judge.checkedInAt
      }
    });
  } catch (error) {
    console.error('Error checking in judge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check in judge'
    });
  }
};

// Check out a judge
exports.checkOutJudge = async (req, res) => {
  try {
    const { id: tournamentId, judgeId } = req.params; // Use 'id' from route param
    
    const judge = await judgeService.checkOutJudge(tournamentId, judgeId);
    
    res.status(200).json({
      success: true,
      message: 'Judge checked out successfully',
      data: {
        id: judge.id,
        name: judge.name,
        isPresent: judge.isPresent
      }
    });
  } catch (error) {
    console.error('Error checking out judge:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check out judge'
    });
  }
};
