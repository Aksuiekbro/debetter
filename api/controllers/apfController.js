const ApfEvaluation = require('../models/ApfEvaluation');
const Debate = require('../models/Debate');
const User = require('../models/User');
const tournamentService = require('../services/tournamentService'); // Import TournamentService

// Get APF tabulation/standings
// Get APF tabulation/standings
exports.getApfTabulation = async (req, res) => {
  try {
    // Get tournament ID from request
    const { tournamentId } = req.query;
    const specificTournamentId = tournamentId || req.params.tournamentId;

    if (!specificTournamentId) {
      return res.status(400).json({ message: 'Tournament ID is required' });
    }

    // console.log('Fetching APF tabulation for tournament:', specificTournamentId); // Removed debug log

    // Fetch the Debate document and populate the teams array
    const debate = await Debate.findById(specificTournamentId).populate({
        path: 'teams',
        select: 'name wins points losses' // Select necessary fields
    });

    if (!debate) {
      // Keep log for not found
      console.log('Tournament (Debate) not found with ID:', specificTournamentId);
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (!debate.teams || debate.teams.length === 0) {
      // Keep log for no teams found
      console.log('No teams found in the tournament:', specificTournamentId);
      // Return empty standings if no teams exist
      return res.json([]);
    }

    // console.log(`Found ${debate.teams.length} teams in tournament ${specificTournamentId}`); // Removed debug log

    // Map teams to the required standings format
    let standings = debate.teams.map(team => ({
      id: team._id,
      name: team.name,
      wins: team.wins || 0, // Default to 0 if undefined
      points: team.points || 0, // Default to 0 if undefined
      losses: team.losses || 0, // Include losses if available
      rank: 0 // Initialize rank
    }));

    // Sort by wins (descending) and then points (descending)
    standings.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.points - a.points;
    });

    // Assign ranks based on the sorted order
    standings = standings.map((team, index) => ({
      ...team,
      rank: index + 1
    }));

    // console.log(`Returning ${standings.length} teams in standings for tournament ${specificTournamentId}`); // Removed debug log
    res.json(standings);

  } catch (error) {
    console.error('Error getting APF tabulation:', error);
    res.status(500).json({ message: 'Error fetching tournament standings', error: error.message });
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
    
    // console.log('Evaluation submission received:'); // Removed debug log
    // console.log('- debateId (params):', debateId); // Removed debug log
    // console.log('- gameId (body):', gameId); // Removed debug log
    // console.log('- winningTeamId:', winningTeamId); // Removed debug log
    
    // Check if debate exists
    const debate = await Debate.findById(debateId);
    if (!debate) {
      // Keep log for not found
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
    
    // console.log('Judge check result:', isJudge); // Removed debug log
    
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
          
          // console.log(`Updated winning team: ${winningTeamObject.name}, Wins: ${winningTeamObject.wins}, Points: ${winningTeamObject.points}`); // Removed debug log
        } else {
          // Keep log for not found
          console.log('Could not find winning team object in tournament teams');
        }

        // Find the losing team and update losses
        const losingTeamObject = debate.teams?.find(team => team._id.toString() !== winningTeamId && (team._id.toString() === relevantPosting.team1.toString() || team._id.toString() === relevantPosting.team2.toString()));

        if (losingTeamObject) {
          losingTeamObject.losses = (losingTeamObject.losses || 0) + 1;
          // Add 1 participation point for the losing team
          losingTeamObject.points = (losingTeamObject.points || 0) + 1;
          
          // console.log(`Updated losing team: ${losingTeamObject.name}, Losses: ${losingTeamObject.losses}, Points: ${losingTeamObject.points}`); // Removed debug log
        } else {
           // Keep log for not found
           console.log('Could not find losing team object in tournament teams');
        }
          const losingTeamId = losingTeamObject ? losingTeamObject._id.toString() : null; // Define ID for later use

        // Mark the teams array as modified before saving
        debate.markModified('teams');
        // console.log('[BEFORE SAVE] Losing Team Object:', JSON.stringify(losingTeamObject)); // Removed debug log
        try {
            await debate.save();
            // console.log('[AFTER SAVE] debate.save() completed successfully.'); // Removed debug log
            // Optionally fetch the losing team again AFTER save to confirm
            if (losingTeamId) { // Check if losingTeamId was found earlier
                const savedDebate = await Debate.findById(debateId);
                const savedLosingTeam = savedDebate.teams.find(t => t._id.toString() === losingTeamId);
                // console.log('[AFTER SAVE] Losing Team Object from DB:', JSON.stringify(savedLosingTeam)); // Removed debug log
            } else {
                // console.log('[AFTER SAVE] Skipping DB check for losing team as it was not identified earlier.'); // Removed debug log
            }
        } catch (saveError) {
            console.error('[SAVE ERROR] Error during debate.save():', saveError);
            // Decide how to handle save error - maybe rethrow or add to response?
            // For now, just log and continue, but consider rethrowing or sending error response
        }

        // console.log('[BEFORE SAVE] Attempting debate.save() after marking teams modified...'); // Removed debug log
        // --- Try to advance winner in bracket ---
        if (relevantPosting && relevantPosting.round != null && relevantPosting.matchNumber != null) {
          // console.log(`[submitApfEvaluation] Posting has round/match info. Attempting to advance winner in bracket...`); // Removed debug log
          try {
            await tournamentService.advanceWinnerInBracket(
              debateId,
              relevantPosting.round,
              relevantPosting.matchNumber,
              winningTeamId // Pass the winning team ID
            );
            // console.log(`[submitApfEvaluation] Bracket advancement successful for Round ${relevantPosting.round}, Match ${relevantPosting.matchNumber}.`); // Removed debug log
          } catch (bracketError) {
            console.error(`[submitApfEvaluation] Error advancing winner in bracket for Round ${relevantPosting.round}, Match ${relevantPosting.matchNumber}:`, bracketError);
            // Decide if this error should affect the response to the client.
            // For now, we'll just log it and continue, as the evaluation was saved.
          }
        } else {
            // console.log(`[submitApfEvaluation] Posting ${relevantPosting?._id} missing round/match info, skipping bracket advancement.`); // Removed debug log
        }
        // --- End bracket advancement ---
      } else {
        // Keep log for not found
        console.log('Could not find posting with ID:', req.body.gameId);
        // console.log('Available posting IDs:', debate.postings.map(p => p._id.toString())); // Removed debug log
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
    // console.log('Fetching judge assignments for user:', req.user._id); // Removed debug log
    
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
    
    // console.log(`Found ${tournaments.length} tournaments for judge`); // Removed debug log
    
    // Get all APF postings where this judge is assigned
    const assignedGames = [];
    
    for (const tournament of tournaments) {
      // console.log(`Processing tournament: ${tournament.title}, ID: ${tournament._id}`); // Removed debug log
      // console.log(`Tournament has ${tournament.teams?.length || 0} teams and ${tournament.postings?.length || 0} postings`); // Removed debug log
      
      if (tournament.postings && tournament.postings.length > 0) {
        // Filter postings where this judge is assigned
        const judgePostings = tournament.postings.filter(posting => 
          posting.judges.some(judge => 
            // Handle both populated and unpopulated judges
            (typeof judge === 'object' ? judge._id.toString() : judge.toString()) === req.user._id.toString()
          )
        );
        
        // console.log(`Found ${judgePostings.length} postings assigned to this judge`); // Removed debug log
        
        for (const posting of judgePostings) {
          // console.log(`Processing posting: ${posting._id}, Teams: ${posting.team1} vs ${posting.team2}`); // Removed debug log
          
          // Find team details with debug logging
          const team1 = tournament.teams.find(t => t._id.toString() === posting.team1.toString());
          const team2 = tournament.teams.find(t => t._id.toString() === posting.team2.toString());
          
          // console.log(`Team1 found: ${!!team1}, Team2 found: ${!!team2}`); // Removed debug log
          // if (team1) console.log(`Team1 name: ${team1.name}, members: ${team1.members?.length || 0}`); // Removed debug log
          if (team2) console.log(`Team2 name: ${team2.name}, members: ${team2.members?.length || 0}`);
          
          // Check if both teams were found before proceeding
          if (!team1 || !team2) {
            console.warn(`[getJudgeAssignedDebates] Skipping posting ${posting._id} in tournament ${tournament._id} due to missing team data. Team1 found: ${!!team1}, Team2 found: ${!!team2}`);
            continue; // Skip to the next posting in this tournament
          }

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
            
            // console.log(`Team1 leader member:`, leaderMember); // Removed debug log
            // console.log(`Team1 speaker member:`, speakerMember); // Removed debug log
            
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
              // console.log(`Team1 leader user data:`, team1Members.leader); // Removed debug log
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
              // console.log(`Team1 speaker user data:`, team1Members.speaker); // Removed debug log
            }
          }
          
          // Process team 2 members
          if (team2 && team2.members && team2.members.length > 0) {
            const leaderMember = team2.members.find(m => m.role === 'leader');
            const speakerMember = team2.members.find(m => m.role === 'speaker');
            
            // console.log(`Team2 leader member:`, leaderMember); // Removed debug log
            // console.log(`Team2 speaker member:`, speakerMember); // Removed debug log
            
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
              // console.log(`Team2 leader user data:`, team2Members.leader); // Removed debug log
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
              // console.log(`Team2 speaker user data:`, team2Members.speaker); // Removed debug log
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
            title: tournament.title.replace('{{debateTitle}} - ', ''), // Clean up placeholder if present
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
    
    // console.log(`Returning ${assignedGames.length} assigned games for judge`); // Removed debug log
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

// Get debater-specific feedback for a completed posting
exports.getDebaterFeedback = async (req, res) => {
  try {
    const { debateId, postingId } = req.params;
    const userId = req.user._id;

    // console.log(`Fetching feedback for user ${userId}, debate ${debateId}, posting ${postingId}`); // Removed debug log

    // 1. Fetch Debate with populated teams and members
    const debate = await Debate.findById(debateId).populate({
      path: 'teams',
      populate: {
        path: 'members.userId',
        model: 'User',
        select: 'username _id' // Select necessary fields
      }
    });

    if (!debate) {
      // Keep log for not found
      console.log(`Debate not found: ${debateId}`);
      return res.status(404).json({ message: 'Debate not found' });
    }

    // 2. Find the specific posting
    const posting = debate.postings.find(p => p._id.toString() === postingId);

    if (!posting) {
      // Keep log for not found
      console.log(`Posting not found: ${postingId} in debate ${debateId}`);
      return res.status(404).json({ message: 'Posting not found' });
    }

    // 3. Check if posting is completed
    if (posting.status !== 'completed') {
      // Keep log for status check
      console.log(`Posting ${postingId} is not completed (status: ${posting.status})`);
      return res.status(400).json({ message: 'Feedback is not available until the posting is completed' });
    }

    // 4. Identify user's team and role for this posting
    let userTeam = null;
    let userRole = null;
    let teamSide = null; // 'gov' or 'opp'

    for (const team of debate.teams) {
      const member = team.members.find(m => m.userId && m.userId._id.toString() === userId.toString());
      if (member) {
        // Check if this team participated in this specific posting
        if (posting.team1.toString() === team._id.toString()) {
          userTeam = team;
          userRole = member.role; // 'leader' or 'speaker'
          teamSide = 'gov'; // Team 1 is Government
          break;
        } else if (posting.team2.toString() === team._id.toString()) {
          userTeam = team;
          userRole = member.role; // 'leader' or 'speaker'
          teamSide = 'opp'; // Team 2 is Opposition
          break;
        }
      }
    }

    if (!userTeam || !userRole) {
      // Keep log for user not participant
      console.log(`User ${userId} not found as a participant in posting ${postingId}`);
      return res.status(403).json({ message: 'You did not participate in this specific debate posting' });
    }

    // console.log(`User ${userId} identified as ${userRole} on team ${userTeam.name} (${teamSide})`); // Removed debug log

    // 5. Determine the speaker key
    let speakerKey = null;
    if (teamSide === 'gov') {
      speakerKey = userRole === 'leader' ? 'leader_gov' : 'speaker_gov';
    } else { // teamSide === 'opp'
      speakerKey = userRole === 'leader' ? 'leader_opp' : 'speaker_opp';
    }

    // console.log(`Determined speaker key: ${speakerKey}`); // Removed debug log

    // 6. Fetch the Evaluation using the ID from the posting
    if (!posting.evaluation || !posting.evaluation.evaluationId) {
        // Keep log for missing evaluation ref
        console.log(`Posting ${postingId} is completed but missing evaluation reference.`);
        return res.status(404).json({ message: 'Evaluation data not found for this posting' });
    }

    const evaluation = await ApfEvaluation.findById(posting.evaluation.evaluationId);

    if (!evaluation) {
        // Keep log for evaluation not found
        console.log(`Evaluation not found with ID: ${posting.evaluation.evaluationId}`);
        return res.status(404).json({ message: 'Evaluation data could not be retrieved' });
    }

    // 7. Extract scores and feedback
    if (!evaluation.speakerScores || !evaluation.speakerScores[speakerKey]) {
        // Keep log for scores missing
        console.log(`Speaker scores missing or key ${speakerKey} not found in evaluation ${evaluation._id}`);
        return res.status(404).json({ message: 'Specific scores and feedback not found for your role in this evaluation' });
    }

    const feedbackData = evaluation.speakerScores[speakerKey];

    // 8. Return the data
    res.json({
      scores: feedbackData.criteriaRatings || {}, // Ensure scores object exists
      feedback: feedbackData.feedback || '', // Ensure feedback string exists
      judgeId: evaluation.judgeId // Include judge ID for reference
    });

  } catch (error) {
    console.error(`Error fetching debater feedback for user ${req.user?._id}, posting ${req.params?.postingId}:`, error);
    res.status(500).json({ message: 'An error occurred while fetching your feedback', error: error.message });
  }
};
