const ApfEvaluation = require('../models/ApfEvaluation');
const Debate = require('../models/Debate');
const User = require('../models/User');

// Get APF tabulation/standings
exports.getApfTabulation = async (req, res) => {
  try {
    // Get tournament ID from request (if filtering for a specific tournament)
    const { tournamentId } = req.query;
    
    // Build filter object
    const filter = tournamentId ? { debateId: tournamentId } : {};
    
    // Get all evaluations
    const evaluations = await ApfEvaluation.find(filter)
      .populate('winningTeam', 'name members')
      .populate('debateId', 'title teams');
      
    // Process results to get team standings
    // Teams object to track wins and scores
    const teamsMap = {};
    
    // Process each evaluation
    evaluations.forEach(evaluation => {
      const winningTeamId = evaluation.winningTeam._id.toString();
      
      if (!teamsMap[winningTeamId]) {
        teamsMap[winningTeamId] = {
          id: winningTeamId,
          name: evaluation.winningTeam.name,
          wins: 0,
          score: 0,
          rank: 0
        };
      }
      
      // Increment wins for the winning team
      teamsMap[winningTeamId].wins += 1;
      
      // Calculate and add score
      const governmentScore = 
        (evaluation.scores.leaderGovernment?.totalScore || 0) + 
        (evaluation.scores.speakerGovernment?.totalScore || 0);
      
      const oppositionScore = 
        (evaluation.scores.leaderOpposition?.totalScore || 0) + 
        (evaluation.scores.speakerOpposition?.totalScore || 0);
      
      // Add score to the winning team
      if (evaluation.debateId.teams && evaluation.debateId.teams.length > 0) {
        // Find if winning team was government or opposition
        const isGovernment = evaluation.debateId.teams.some(team => 
          team.side === 'proposition' && 
          team._id.toString() === winningTeamId
        );
        
        teamsMap[winningTeamId].score += isGovernment ? governmentScore : oppositionScore;
      }
    });
    
    // Convert to array and sort by wins (primary) and score (secondary)
    let standings = Object.values(teamsMap).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.score - a.score;
    });
    
    // Assign ranks
    standings = standings.map((team, index) => ({
      ...team,
      rank: index + 1
    }));
    
    res.json(standings);
  } catch (error) {
    console.error('Error getting APF tabulation:', error);
    res.status(500).json({ message: error.message });
  }
};

// Submit APF debate evaluation
exports.submitApfEvaluation = async (req, res) => {
  try {
    const { debateId } = req.params;
    const {
      scores,
      winningTeam,
      notes
    } = req.body;
    
    // Check if debate exists
    const debate = await Debate.findById(debateId);
    if (!debate) {
      return res.status(404).json({ message: 'Debate not found' });
    }
    
    // Check if user is a judge for this debate
    const isJudge = debate.participants.some(
      p => p._id.toString() === req.user._id.toString() && p.role === 'judge'
    );
    
    if (!isJudge) {
      return res.status(403).json({ message: 'Only judges can submit evaluations' });
    }
    
    // Check if judge has already submitted an evaluation
    const existingEvaluation = await ApfEvaluation.findOne({
      debateId: debateId,
      judgeId: req.user._id
    });
    
    if (existingEvaluation) {
      return res.status(400).json({ message: 'You have already evaluated this debate' });
    }
    
    // Create new evaluation
    const evaluation = new ApfEvaluation({
      debateId,
      judgeId: req.user._id,
      scores,
      winningTeam,
      notes
    });
    
    await evaluation.save();
    
    // Update team stats in the debate
    if (debate.teams && debate.teams.length > 0) {
      // Find winning team
      const winningTeamObj = debate.teams.find(team => team._id.toString() === winningTeam);
      
      if (winningTeamObj) {
        // Increment wins
        winningTeamObj.wins += 1;
        
        // Calculate scores from evaluation and add to team
        if (winningTeamObj.side === 'proposition') {
          const propositionScore = 
            (scores.leaderGovernment?.totalScore || 0) + 
            (scores.speakerGovernment?.totalScore || 0);
          
          winningTeamObj.points += propositionScore;
        } else {
          const oppositionScore = 
            (scores.leaderOpposition?.totalScore || 0) + 
            (scores.speakerOpposition?.totalScore || 0);
          
          winningTeamObj.points += oppositionScore;
        }
        
        await debate.save();
      }
    }
    
    res.status(201).json({ 
      message: 'Evaluation submitted successfully',
      evaluation
    });
  } catch (error) {
    console.error('Error submitting APF evaluation:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get judge's assigned APF debates
exports.getJudgeAssignedDebates = async (req, res) => {
  try {
    // Find debates where the user is assigned as a judge
    const debates = await Debate.find({
      'participants': { 
        $elemMatch: { 
          _id: req.user._id,
          role: 'judge'
        }
      },
      'format': 'APF'
    })
    .populate('teams.members', 'username')
    .sort({ startDate: 1 })
    .lean();
    
    // Check which debates have already been evaluated by this judge
    const evaluatedDebateIds = await ApfEvaluation.find({
      judgeId: req.user._id
    }).distinct('debateId');
    
    // Format response for the judge panel
    const formattedDebates = debates.map(debate => {
      // Check if this debate has been evaluated
      const isEvaluated = evaluatedDebateIds.some(id => 
        id.toString() === debate._id.toString()
      );
      
      // Get teams information
      const teams = debate.teams || [];
      const governmentTeam = teams.find(t => t.side === 'proposition') || {};
      const oppositionTeam = teams.find(t => t.side === 'opposition') || {};
      
      return {
        id: debate._id,
        title: debate.title,
        startTime: debate.startDate,
        duration: debate.duration || 60,
        location: debate.location || 'TBD',
        team1: {
          id: governmentTeam._id || 'team1',
          name: governmentTeam.name || 'Government Team'
        },
        team2: {
          id: oppositionTeam._id || 'team2',
          name: oppositionTeam.name || 'Opposition Team'
        },
        theme: debate.description || 'No theme specified',
        status: isEvaluated ? 'evaluated' : 'pending'
      };
    });
    
    res.json(formattedDebates);
  } catch (error) {
    console.error('Error getting assigned debates:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a specific APF evaluation
exports.getApfEvaluation = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    
    const evaluation = await ApfEvaluation.findById(evaluationId)
      .populate('debateId', 'title description startDate teams')
      .populate('judgeId', 'username')
      .populate('winningTeam', 'name');
      
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    res.json(evaluation);
  } catch (error) {
    console.error('Error getting APF evaluation:', error);
    res.status(500).json({ message: error.message });
  }
};