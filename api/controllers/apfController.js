const ApfEvaluation = require('../models/ApfEvaluation');
const Debate = require('../models/Debate');
const User = require('../models/User');

// Get APF tabulation/standings
exports.getApfTabulation = async (req, res) => {
  try {
    // Get tournament ID from request (if filtering for a specific tournament)
    const { tournamentId } = req.query;
    const specificTournamentId = tournamentId || req.params.tournamentId;
    
    console.log('Fetching APF tabulation for tournament:', specificTournamentId);
    
    // Build filter object based on the tournament ID
    const filter = specificTournamentId ? { debateId: specificTournamentId } : {};
    
    console.log('Using filter:', filter);
    
    // Get all evaluations
    const evaluations = await ApfEvaluation.find(filter)
      .populate('winningTeam', 'name members')
      .populate('debateId', 'title teams');
    
    console.log(`Found ${evaluations.length} evaluations for tabulation`);
      
    // Process results to get team standings
    // Teams object to track wins and scores
    const teamsMap = {};
    
    // Process each evaluation
    evaluations.forEach(evaluation => {
      if (!evaluation.winningTeam || !evaluation.winningTeam._id) {
        console.log('Skipping evaluation without valid winning team:', evaluation._id);
        return; // Skip evaluations without proper winning team data
      }
      
      const winningTeamId = evaluation.winningTeam._id.toString();
      console.log('Processing evaluation with winning team:', winningTeamId);
      
      if (!teamsMap[winningTeamId]) {
        teamsMap[winningTeamId] = {
          id: winningTeamId,
          name: evaluation.winningTeam.name || 'Unknown Team',
          wins: 0,
          score: 0,
          rank: 0
        };
      }
      
      // Increment wins for the winning team
      teamsMap[winningTeamId].wins += 1;
      
      // Calculate scores based on the new scoring structures
      let governmentScore = 0;
      let oppositionScore = 0;
      
      // Try to get scores from the new detailed structure first
      if (evaluation.speakerScores) {
        // Add up all speaker scores from the detailed structure
        const leaderGov = evaluation.speakerScores.leader_gov?.totalPoints || 0;
        const speakerGov = evaluation.speakerScores.speaker_gov?.totalPoints || 0;
        const leaderOpp = evaluation.speakerScores.leader_opp?.totalPoints || 0;
        const speakerOpp = evaluation.speakerScores.speaker_opp?.totalPoints || 0;
        
        governmentScore = leaderGov + speakerGov;
        oppositionScore = leaderOpp + speakerOpp;
      } 
      // Fall back to legacy scores if needed
      else if (evaluation.scores) {
        governmentScore = 
          (evaluation.scores.leaderGovernment?.totalScore || 0) + 
          (evaluation.scores.speakerGovernment?.totalScore || 0);
        
        oppositionScore = 
          (evaluation.scores.leaderOpposition?.totalScore || 0) + 
          (evaluation.scores.speakerOpposition?.totalScore || 0);
      }
      
      // Determine if the winning team was government or opposition
      let winningTeamScore = 0;
      
      if (evaluation.debateId && evaluation.debateId.teams && evaluation.debateId.teams.length > 0) {
        // Find if winning team was government or opposition in this debate
        const winningTeamWasGovernment = evaluation.debateId.teams.some(team => 
          team.side === 'proposition' && team._id.toString() === winningTeamId
        );
        
        winningTeamScore = winningTeamWasGovernment ? governmentScore : oppositionScore;
        console.log(`Team ${winningTeamId} was ${winningTeamWasGovernment ? 'Government' : 'Opposition'}, adding ${winningTeamScore} points`);
      } else {
        // If we can't determine side, just add both scores (suboptimal fallback)
        winningTeamScore = governmentScore + oppositionScore;
        console.log(`Could not determine team side, adding total points: ${winningTeamScore}`);
      }
      
      teamsMap[winningTeamId].score += winningTeamScore;
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
    
    console.log(`Returning ${standings.length} teams in standings`);
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
      speakerScores,
      teamScores,
      transcriptions,
      winningTeamId,
      gameId,
      notes
    } = req.body;
    
    console.log('Evaluation submission received:');
    console.log('- debateId (params):', debateId);
    console.log('- gameId (body):', gameId);
    console.log('- winningTeamId:', winningTeamId);
    
    // Check if debate exists
    const debate = await Debate.findById(debateId);
    if (!debate) {
      console.log('Debate not found with ID:', debateId);
      return res.status(404).json({ message: 'Debate not found' });
    }
    
    // Check if user is a judge for this debate
    let isJudge = false;
    
    // First, check the participants array (if each participant is an object with _id and role)
    if (debate.participants && debate.participants.length > 0 && 
        typeof debate.participants[0] === 'object' && debate.participants[0]._id) {
      isJudge = debate.participants.some(
        p => p._id.toString() === req.user._id.toString() && p.role === 'judge'
      );
    }
    
    // If not found, check if participants are just user IDs and check postings judges
    if (!isJudge && debate.postings && debate.postings.length > 0) {
      isJudge = debate.postings.some(posting => 
        posting.judges && posting.judges.some(judgeId => 
          judgeId.toString() === req.user._id.toString()
        )
      );
    }
    
    console.log('Judge check result:', isJudge);
    
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
    
    // Create new evaluation with both legacy and new data structures
    const evaluation = new ApfEvaluation({
      debateId,
      judgeId: req.user._id,
      scores, // Legacy scores (if provided)
      speakerScores, // New detailed speaker scores
      teamScores, // Team criteria scores
      transcriptions, // Speech transcriptions
      winningTeam: winningTeamId,
      notes
    });
    
    await evaluation.save();
    
    // Update debate posting status to completed
    if (debate.postings && debate.postings.length > 0) {
      // Find the relevant posting by ID
      const relevantPosting = debate.postings.find(posting => 
        posting._id.toString() === req.body.gameId
      );
      
      if (relevantPosting) {
        relevantPosting.status = 'completed';
        relevantPosting.winner = winningTeamId;
        
        // Store additional evaluation information in the posting
        relevantPosting.evaluation = {
          evaluationId: evaluation._id,
          team1Score: speakerScores?.leader_gov?.totalPoints + speakerScores?.speaker_gov?.totalPoints || 0,
          team2Score: speakerScores?.leader_opp?.totalPoints + speakerScores?.speaker_opp?.totalPoints || 0,
          comments: notes
        };
        
        // Find the winning team in the tournament teams
        const winningTeamObject = debate.teams?.find(team => team._id.toString() === winningTeamId);
        
        if (winningTeamObject) {
          // Initialize properties if they don't exist
          winningTeamObject.wins = winningTeamObject.wins || 0;
          winningTeamObject.points = winningTeamObject.points || 0;
          
          // Increment wins count
          winningTeamObject.wins += 1;
          
          // Add points to the winning team (based on their own scores)
          if (debate.teams.some(team => team._id.toString() === winningTeamId && team.members.some(m => m.role === 'leader' && m.userId)) ||
              winningTeamObject._id.toString() === relevantPosting.team1.toString()) {
            // It's team1/Government team
            winningTeamObject.points += relevantPosting.evaluation.team1Score;
          } else {
            // It's team2/Opposition team  
            winningTeamObject.points += relevantPosting.evaluation.team2Score;
          }
          
          console.log(`Updated winning team: ${winningTeamObject.name}, Wins: ${winningTeamObject.wins}, Points: ${winningTeamObject.points}`);
        } else {
          console.log('Could not find winning team object in tournament teams');
        }
        
        await debate.save();
      } else {
        console.log('Could not find posting with ID:', req.body.gameId);
        console.log('Available posting IDs:', debate.postings.map(p => p._id.toString()));
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
    console.log('Fetching judge assignments for user:', req.user._id);
    
    // Find tournaments where the user is a judge through participants array
    // OR where the user is directly assigned as a judge to a posting
    const tournaments = await Debate.find({
      $or: [
        // Check if user is in participants array as a judge
        {
          'participants': { 
            $elemMatch: { 
              _id: req.user._id,
              role: 'judge'
            }
          },
          'format': 'tournament'
        },
        // Check if user is directly assigned as a judge to any posting
        {
          'postings.judges': req.user._id,
          'format': 'tournament'
        }
      ]
    })
    // Populate teams with their members
    .populate({
      path: 'teams',
      // Deeply populate the team members' user data
      populate: {
        path: 'members.userId',
        model: 'User',
        select: 'username email _id' // Include essential user fields
      }
    })
    .populate('participants', 'username email role judgeRole')
    // Also directly populate all user references
    .populate({
      path: 'postings.judges',
      model: 'User',
      select: 'username email _id'
    })
    .sort({ startDate: 1 });
    
    console.log(`Found ${tournaments.length} tournaments for judge`);
    
    // Get all APF postings where this judge is assigned
    const assignedGames = [];
    
    for (const tournament of tournaments) {
      console.log(`Processing tournament: ${tournament.title}, ID: ${tournament._id}`);
      console.log(`Tournament has ${tournament.teams?.length || 0} teams and ${tournament.postings?.length || 0} postings`);
      
      if (tournament.postings && tournament.postings.length > 0) {
        // Filter postings where this judge is assigned
        const judgePostings = tournament.postings.filter(posting => 
          posting.judges.some(judge => 
            // Handle both populated and unpopulated judges
            (typeof judge === 'object' ? judge._id.toString() : judge.toString()) === req.user._id.toString()
          )
        );
        
        console.log(`Found ${judgePostings.length} postings assigned to this judge`);
        
        for (const posting of judgePostings) {
          console.log(`Processing posting: ${posting._id}, Teams: ${posting.team1} vs ${posting.team2}`);
          
          // Find team details with debug logging
          const team1 = tournament.teams.find(t => t._id.toString() === posting.team1.toString());
          const team2 = tournament.teams.find(t => t._id.toString() === posting.team2.toString());
          
          console.log(`Team1 found: ${!!team1}, Team2 found: ${!!team2}`);
          if (team1) console.log(`Team1 name: ${team1.name}, members: ${team1.members?.length || 0}`);
          if (team2) console.log(`Team2 name: ${team2.name}, members: ${team2.members?.length || 0}`);
          
          // Extract team member details for UI with improved debugging
          let team1Members = {
            leader: null,
            speaker: null
          };
          
          let team2Members = {
            leader: null,
            speaker: null 
          };
          
          // Process team 1 members
          if (team1 && team1.members && team1.members.length > 0) {
            const leaderMember = team1.members.find(m => m.role === 'leader');
            const speakerMember = team1.members.find(m => m.role === 'speaker');
            
            console.log(`Team1 leader member:`, leaderMember);
            console.log(`Team1 speaker member:`, speakerMember);
            
            if (leaderMember && leaderMember.userId) {
              // If userId is already populated, use it directly
              if (typeof leaderMember.userId === 'object') {
                team1Members.leader = leaderMember.userId;
              } else {
                // Otherwise, create a partial object with just the ID
                team1Members.leader = {
                  _id: leaderMember.userId,
                  username: `Leader (${team1.name})`
                };
              }
              console.log(`Team1 leader user data:`, team1Members.leader);
            }
            
            if (speakerMember && speakerMember.userId) {
              // If userId is already populated, use it directly
              if (typeof speakerMember.userId === 'object') {
                team1Members.speaker = speakerMember.userId;
              } else {
                // Otherwise, create a partial object with just the ID
                team1Members.speaker = {
                  _id: speakerMember.userId,
                  username: `Speaker (${team1.name})`
                };
              }
              console.log(`Team1 speaker user data:`, team1Members.speaker);
            }
          }
          
          // Process team 2 members
          if (team2 && team2.members && team2.members.length > 0) {
            const leaderMember = team2.members.find(m => m.role === 'leader');
            const speakerMember = team2.members.find(m => m.role === 'speaker');
            
            console.log(`Team2 leader member:`, leaderMember);
            console.log(`Team2 speaker member:`, speakerMember);
            
            if (leaderMember && leaderMember.userId) {
              // If userId is already populated, use it directly
              if (typeof leaderMember.userId === 'object') {
                team2Members.leader = leaderMember.userId;
              } else {
                // Otherwise, create a partial object with just the ID
                team2Members.leader = {
                  _id: leaderMember.userId,
                  username: `Leader (${team2.name})`
                };
              }
              console.log(`Team2 leader user data:`, team2Members.leader);
            }
            
            if (speakerMember && speakerMember.userId) {
              // If userId is already populated, use it directly
              if (typeof speakerMember.userId === 'object') {
                team2Members.speaker = speakerMember.userId;
              } else {
                // Otherwise, create a partial object with just the ID
                team2Members.speaker = {
                  _id: speakerMember.userId,
                  username: `Speaker (${team2.name})`
                };
              }
              console.log(`Team2 speaker user data:`, team2Members.speaker);
            }
          }
          
          // Find other judges assigned to this posting
          const otherJudges = posting.judges
            .filter(judgeId => {
              const judgeIdStr = typeof judgeId === 'object' ? judgeId._id.toString() : judgeId.toString();
              return judgeIdStr !== req.user._id.toString();
            })
            .map(judgeId => {
              // If judge is already populated
              if (typeof judgeId === 'object' && judgeId._id) {
                return {
                  id: judgeId._id,
                  name: judgeId.username || 'Unknown Judge',
                  role: judgeId.judgeRole || 'Judge'
                };
              }
              
              // Otherwise, look for judge data in participants
              const judgeData = tournament.participants.find(p => 
                p._id.toString() === judgeId.toString()
              );
              
              return judgeData ? {
                id: judgeData._id,
                name: judgeData.username,
                role: judgeData.judgeRole || 'Judge'
              } : {
                id: judgeId,
                name: 'Unknown Judge',
                role: 'Judge'
              };
            })
            .filter(judge => judge !== null);
          
          // Check if judge has already submitted an evaluation
          const isEvaluated = posting.status === 'completed';
          
          // Prepare data for formatted leader and speaker objects
          const formatUserObject = (user) => {
            if (!user) return null;
            
            // Handle populated user object
            if (user._id) {
              return {
                id: user._id,
                name: user.username || 'Unknown User'
              };
            } 
            // Handle user ID string (fallback)
            else if (typeof user === 'string') {
              return {
                id: user,
                name: 'Unknown User'
              };
            }
            
            return null;
          };
          
          // Format the posting for the judge panel
          assignedGames.push({
            id: posting._id,
            tournamentId: tournament._id,
            title: tournament.title,
            startTime: tournament.startDate,
            duration: tournament.duration || 60,
            location: posting.location || 'TBD',
            team1: {
              id: team1?._id || posting.team1,
              name: team1?.name || 'Team 1',
              // Include member details with improved data handling
              leader: formatUserObject(team1Members.leader),
              speaker: formatUserObject(team1Members.speaker)
            },
            team2: {
              id: team2?._id || posting.team2,
              name: team2?.name || 'Team 2',
              // Include member details with improved data handling
              leader: formatUserObject(team2Members.leader),
              speaker: formatUserObject(team2Members.speaker)
            },
            theme: posting.theme || 'No theme specified',
            status: isEvaluated ? 'evaluated' : 'pending',
            otherJudges: otherJudges,
            // Additional useful information for the frontend
            category: tournament.category,
            difficulty: tournament.difficulty,
            evaluationId: posting.evaluation?.evaluationId || null
          });
        }
      }
    }
    
    console.log(`Returning ${assignedGames.length} assigned games for judge`);
    res.json(assignedGames);
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