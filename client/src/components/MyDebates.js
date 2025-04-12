import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  Badge,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';
import GavelIcon from '@mui/icons-material/Gavel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// TabPanel component for the tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Define DebateCard outside MyDebates
const DebateCard = ({ debate, navigate, userRole, userId, judgeAssignments, loadingAssignments, t }) => { // Added t to props
  const isTournament = debate.format === 'tournament';
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'primary'; // Keep color logic
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
    // Status translation logic moved to where it's displayed
  };

  // Find judge assignments for this tournament
  const tournamentAssignments = userRole === 'judge'
    ? judgeAssignments.filter(assignment => assignment.tournamentId === debate._id)
    : [];

  // Check if there are completed postings with evaluations
  const hasCompletedGames = debate.postings && debate.postings.some(posting => 
    posting.status === 'completed' && posting.evaluation
  );

  // Check if this user is a participant in any of the teams
  const isParticipant = debate.postings && debate.postings.some(posting => {
    const team1HasUser = posting.team1Members && posting.team1Members.some(
      member => member.userId?._id === userId || member.userId === userId
    );
    const team2HasUser = posting.team2Members && posting.team2Members.some(
      member => member.userId?._id === userId || member.userId === userId
    );
    return team1HasUser || team2HasUser;
  });

  // Find all completed postings where the user is a participant
  const userCompletedPostings = debate.postings ? debate.postings.filter(posting => {
    if (posting.status !== 'completed' || !posting.evaluation) return false;
    
    const team1HasUser = posting.team1Members && posting.team1Members.some(
      member => member.userId?._id === userId || member.userId === userId
    );
    const team2HasUser = posting.team2Members && posting.team2Members.some(
      member => member.userId?._id === userId || member.userId === userId
    );
    
    return team1HasUser || team2HasUser;
  }) : [];

  return (
    <Card sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography gutterBottom variant="h5" component="div" sx={{ color: 'primary.main' }}>
            {debate.title}
            {isTournament && (
              <Chip
                size="small"
                label={t('myDebates.card.tournamentChip', 'Tournament')}
                color="secondary"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          
          {userRole === 'judge' && tournamentAssignments.length > 0 && (
            <Badge
              badgeContent={tournamentAssignments.length}
              color="primary"
              showZero={false}
              sx={{ mr: 1 }}
            >
              <Chip
                icon={<GavelIcon />}
                label={t('myDebates.card.judgeAssignmentsChip', 'Judge Assignments')}
                variant="outlined"
                color="primary"
                sx={{ ml: 2 }}
              />
            </Badge>
          )}
        </Box>
        
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label={`${t('myDebates.card.statusLabel', 'Status:')} ${t(`myDebates.status.${debate.status?.replace('-', '') || 'default'}`, debate.status || 'Unknown')}`}
            color={getStatusColor(debate.status)}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`${t('myDebates.card.categoryLabel', 'Category:')} ${debate.category}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            size="small"
            label={`${t('myDebates.card.difficultyLabel', 'Difficulty:')} ${debate.difficulty}`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" color="text.secondary">
          {debate.description}
        </Typography>
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('myDebates.card.startDateLabel', 'Start Date:')} {new Date(debate.startDate).toLocaleString()}
        </Typography>
        
        {/* Display assigned games for judges */}
        {userRole === 'judge' && tournamentAssignments.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t('myDebates.card.yourJudgeAssignmentsTitle', 'Your Judge Assignments')}
            </Typography>
            <Grid container spacing={2}>
              {tournamentAssignments.map((assignment, index) => (
                <Grid item xs={12} sm={6} key={assignment.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('myDebates.card.judgeAssignmentTitle', 'Judge Assignment #{{index}}', { index: index + 1 })}
                      </Typography>
                      
                      {/* Team 1 Section with Players */}
                      <Box sx={{ mb: 1.5, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {t('myDebates.card.team1GovLabel', 'Team 1 (Gov):')} {assignment.team1.name}
                        </Typography>
                        {assignment.team1.leader && (
                          <Typography variant="body2" sx={{ pl: 1 }}>
                            {t('myDebates.card.leaderRolePrefix', '• Leader:')} {assignment.team1.leader.name}
                          </Typography>
                        )}
                        {assignment.team1.speaker && (
                          <Typography variant="body2" sx={{ pl: 1 }}>
                            {t('myDebates.card.speakerRolePrefix', '• Speaker:')} {assignment.team1.speaker.name}
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Team 2 Section with Players */}
                      <Box sx={{ mb: 1.5, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="bold" color="secondary">
                          {t('myDebates.card.team2OppLabel', 'Team 2 (Opp):')} {assignment.team2.name}
                        </Typography>
                        {assignment.team2.leader && (
                          <Typography variant="body2" sx={{ pl: 1 }}>
                            {t('myDebates.card.leaderRolePrefix', '• Leader:')} {assignment.team2.leader.name}
                          </Typography>
                        )}
                        {assignment.team2.speaker && (
                          <Typography variant="body2" sx={{ pl: 1 }}>
                            {t('myDebates.card.speakerRolePrefix', '• Speaker:')} {assignment.team2.speaker.name}
                          </Typography>
                        )}
                      </Box>
                      
                      <Typography variant="body2">
                        <strong>{t('myDebates.card.themeLabel', 'Theme:')}</strong> {assignment.theme}
                      </Typography>
                      <Typography variant="body2">
                        <strong>{t('myDebates.card.locationLabel', 'Location:')}</strong> {assignment.location}
                      </Typography>
                      
                      {/* Other judges section */}
                      {assignment.otherJudges && assignment.otherJudges.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>{t('myDebates.card.coJudgesLabel', 'Co-Judges:')}</strong> {assignment.otherJudges.map(j => j.name).join(', ')}
                          </Typography>
                        </Box>
                      )}
                      
                      <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                        <Chip
                          size="small"
                          label={assignment.status === 'evaluated' ? t('myDebates.card.evaluatedStatus', 'Evaluated') : t('myDebates.card.pendingEvaluationStatus', 'Pending Evaluation')}
                          color={assignment.status === 'evaluated' ? 'success' : 'primary'}
                        />
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => {
                          if (assignment.status === 'evaluated' && assignment.evaluationId) {
                            // Navigate to evaluation details
                            navigate(`/debates/${assignment.tournamentId}/evaluation/${assignment.evaluationId}`);
                          } else {
                            // Navigate to judge panel with this game preselected
                            navigate('/judge-panel', { 
                              state: { selectedGame: assignment }
                            });
                          }
                        }}
                      >
                        {assignment.status === 'evaluated' ? t('myDebates.card.viewEvaluationButton', 'View Evaluation') : t('myDebates.card.evaluateButton', 'Evaluate')}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
        
        {/* Feedback & Evaluations Section for Participants */}
        {isParticipant && userCompletedPostings.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}>
              <EmojiEventsIcon sx={{ mr: 1 }} />
              {t('myDebates.card.feedbackTitle', 'Your Debate Feedback & Evaluations')}
            </Typography>
            <Grid container spacing={2}>
              {userCompletedPostings.map((posting, index) => {
                // Determine which team the user participated in
                const inTeam1 = posting.team1Members && posting.team1Members.some(
                  member => member.userId?._id === userId || member.userId === userId
                );
                const userTeam = inTeam1 ? 'team1' : 'team2';
                const userTeamName = inTeam1 ? posting.team1Name : posting.team2Name;
                const opponentTeamName = inTeam1 ? posting.team2Name : posting.team1Name;
                
                // Get the user's role in the team
                let userRole = '';
                if (inTeam1 && posting.team1Members) {
                  const member = posting.team1Members.find(m => m.userId?._id === userId || m.userId === userId);
                  userRole = member?.role === 'leader' ? t('myDebates.card.leaderRole', 'Leader') : t('myDebates.card.speakerRole', 'Speaker');
                } else if (!inTeam1 && posting.team2Members) {
                  const member = posting.team2Members.find(m => m.userId?._id === userId || m.userId === userId);
                  userRole = member?.role === 'leader' ? t('myDebates.card.leaderRole', 'Leader') : t('myDebates.card.speakerRole', 'Speaker');
                }
                
                // Get feedback for the user's team
                const teamFeedback = posting.evaluation[`${userTeam}Comments`];
                const teamScore = posting.evaluation[`${userTeam}Score`];
                
                // Check if this user's team won
                const isWinner = posting.winner === (inTeam1 ? posting.team1 : posting.team2);
                
                // Find individual scores for this user, if available
                let userScore = null;
                if (posting.evaluation.individualScores) {
                  userScore = posting.evaluation.individualScores.find(
                    score => score.role.toLowerCase().includes(userRole.toLowerCase())
                  );
                }
                
                return (
                  <Grid item xs={12} key={posting._id || index}>
                    <Card variant="outlined" sx={{ 
                      borderLeft: '4px solid',
                      borderColor: isWinner ? 'success.main' : 'primary.main',
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                            {t('myDebates.card.gameLabel', 'Game:')} {posting.theme}
                          </Typography>
                          {isWinner ? (
                            <Chip
                              label={t('myDebates.card.winnerChip', 'Winner')}
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              label={t('myDebates.card.completedChip', 'Completed')}
                              color="primary"
                              size="small"
                            />
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          <Chip size="small" label={`${t('myDebates.card.yourTeamLabel', 'Your Team:')} ${userTeamName || t('myDebates.card.teamPlaceholder', 'Team')}`} />
                          <Chip size="small" label={`${t('myDebates.card.roleLabel', 'Role:')} ${userRole}`} variant="outlined" />
                          <Chip size="small" label={`${t('myDebates.card.opponentLabel', 'Opponent:')} ${opponentTeamName || t('myDebates.card.teamPlaceholder', 'Team')}`} variant="outlined" />
                        </Box>
                        
                        <Grid container spacing={2}>
                          {/* Team Score */}
                          <Grid item xs={12} sm={6}>
                            <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                              <Typography variant="subtitle2" gutterBottom color="primary">
                                {t('myDebates.card.teamScoreTitle', 'Team Score')}
                              </Typography>
                              <Typography variant="h4" color="primary.main" gutterBottom>
                                {teamScore || '0'}{t('myDebates.card.pointsSuffix', ' points')}
                              </Typography>
                              <Typography variant="body2">
                                {teamFeedback || t('myDebates.card.noTeamFeedback', 'No specific team feedback provided.')}
                              </Typography>
                            </Paper>
                          </Grid>
                          
                          {/* Individual Score */}
                          {userScore && (
                            <Grid item xs={12} sm={6}>
                              <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom color="primary">
                                  {t('myDebates.card.individualPerformanceTitle', 'Individual Performance')}
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>{t('myDebates.card.matterLabel', 'Matter:')}</strong> {userScore.matter}/30
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>{t('myDebates.card.methodLabel', 'Method:')}</strong> {userScore.method}/30
                                </Typography>
                                <Typography variant="body2" gutterBottom>
                                  <strong>{t('myDebates.card.mannerLabel', 'Manner:')}</strong> {userScore.manner}/30
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                  {t('myDebates.card.totalLabel', 'Total:')} {userScore.matter + userScore.method + userScore.manner}/90
                                </Typography>
                              </Paper>
                            </Grid>
                          )}
                        </Grid>
                        
                        {/* Judge's Comments */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom color="primary">
                            {t('myDebates.card.judgesOverallCommentsTitle', "Judge's Overall Comments")}
                          </Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', pl: 1, borderLeft: '2px solid', borderColor: 'primary.light', py: 0.5 }}>
                            "{posting.evaluation.comments || t('myDebates.card.noOverallComments', 'No overall comments provided.')}"
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/debates/${debate._id}/postings/${posting._id}`)}
                        >
                          {t('myDebates.card.viewFullEvaluationButton', 'View Full Evaluation')}
                        </Button>
                        <Button
                          size="small"
                          color="secondary" // Use a different color to distinguish
                          onClick={() => navigate(`/feedback/${debate._id}/${posting._id}`)}
                        >
                          {t('myDebates.card.viewFeedbackButton', 'View Feedback')}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
        
        {/* Display tournament postings for regular participants */}
        {isTournament && debate.postings && debate.postings.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t('myDebates.card.tournamentGamesTitle', 'Tournament Games')}
            </Typography>
            <Grid container spacing={2}>
              {debate.postings.map((posting, index) => (
                <Grid item xs={12} sm={6} key={posting._id || index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('myDebates.card.gameTitle', 'Game #{{index}}', { index: index + 1 })}
                      </Typography>
                      
                      {/* Try to display team names if available */}
                      {posting.team1Name && posting.team2Name && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>{t('myDebates.card.teamsLabel', 'Teams:')}</strong> {posting.team1Name}{t('myDebates.card.vsSeparator', ' vs ')}{posting.team2Name}
                        </Typography>
                      )}
                      
                      {/* Display team members if available */}
                      {posting.team1Members && posting.team1Members.length > 0 && (
                        <Typography variant="body2" sx={{ mb: 1, fontSize: '0.8rem' }}>
                          <strong>{t('myDebates.card.team1Label', 'Team 1:')}</strong> {posting.team1Members.map(member => (
                            member.userId?.username ?
                              `${member.role === 'leader' ? t('myDebates.card.leaderRole', 'Leader') : t('myDebates.card.speakerRole', 'Speaker')}: ${member.userId.username}`
                              : null
                          )).filter(Boolean).join(', ')}
                        </Typography>
                      )}
                      
                      {posting.team2Members && posting.team2Members.length > 0 && (
                        <Typography variant="body2" sx={{ mb: 1, fontSize: '0.8rem' }}>
                          <strong>{t('myDebates.card.team2Label', 'Team 2:')}</strong> {posting.team2Members.map(member => (
                            member.userId?.username ?
                              `${member.role === 'leader' ? t('myDebates.card.leaderRole', 'Leader') : t('myDebates.card.speakerRole', 'Speaker')}: ${member.userId.username}`
                              : null
                          )).filter(Boolean).join(', ')}
                        </Typography>
                      )}
                      
                      <Typography variant="body2">
                        <strong>{t('myDebates.card.themeLabel', 'Theme:')}</strong> {posting.theme}
                      </Typography>
                      <Typography variant="body2">
                        <strong>{t('myDebates.card.locationLabel', 'Location:')}</strong> {posting.location}
                      </Typography>
                      {/* Use component="div" to avoid nesting div (Chip) inside p (Typography) */}
                      <Typography variant="body2" component="div">
                        <Chip
                          size="small"
                          label={posting.status === 'completed' ? t('myDebates.card.completedChip', 'Completed') : t('myDebates.card.scheduledStatus', 'Scheduled')}
                          color={posting.status === 'completed' ? 'success' : 'primary'}
                          sx={{ mt: 1 }}
                        />
                        {posting.winner && (
                          <Chip
                            size="small"
                            label={`${t('myDebates.card.winnerLabel', 'Winner:')} ${posting.winnerName || t('myDebates.card.teamPlaceholder', 'Team')}`}
                            color="success"
                            sx={{ mt: 1, ml: 1 }}
                          />
                        )}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        // Only disable if the assignments are still loading
                        disabled={loadingAssignments}
                        onClick={() => {
                          // console.log(`Button clicked for posting: ${posting._id}, status: ${posting.status}`); // Removed debug log
                          const isJudgeForPosting = userRole === 'judge' &&
                                                    posting.judges &&
                                                    posting.judges.some(judge => judge._id === userId);
                          // console.log(`User ID: ${userId}, Role: ${userRole}, Is Judge for Posting: ${isJudgeForPosting}`); // Removed debug log
                          
                          if (isJudgeForPosting && posting.status !== 'completed') {
                            // Get the actual team objects from debate.teams
                            const team1Obj = debate.teams ? debate.teams.find(t => 
                              t._id === posting.team1 || 
                              (posting.team1 && t._id.toString() === posting.team1.toString())
                            ) : null;
                            
                            const team2Obj = debate.teams ? debate.teams.find(t => 
                              t._id === posting.team2 || 
                              (posting.team2 && t._id.toString() === posting.team2.toString())
                            ) : null;
                            
                            // Log for debugging
                            // console.log('Found team1:', team1Obj?.name, 'team2:', team2Obj?.name); // Removed debug log
                            // console.log('Teams array:', debate.teams); // Removed debug log
                            // console.log('Posting team IDs:', posting.team1,  posting.team2); // Removed debug log
                            // console.log('Team members:', posting.team1Members, posting.team2Members); // Removed debug log
                            
                            // More robust game data preparation
                            let gameData = {
                              id: posting._id,
                              tournamentId: debate._id,
                              team1: {
                                id: posting.team1?._id || posting.team1,
                                name: team1Obj?.name || posting.team1Name || 'Team 1',
                                leader: null,
                                speaker: null
                              },
                              team2: {
                                id: posting.team2?._id || posting.team2,
                                name: team2Obj?.name || posting.team2Name || 'Team 2',
                                leader: null,
                                speaker: null
                              },
                              theme: posting.theme || 'No theme specified',
                              location: posting.location || 'TBD',
                              status: 'pending',
                              // Include any other required fields
                              startTime: new Date().toISOString()
                            };
                            
                            // Add team1 member details directly from posting data
                            if (posting.team1Members && posting.team1Members.length > 0) {
                              const leaderMember = posting.team1Members.find(m => m.role === 'leader');
                              const speakerMember = posting.team1Members.find(m => m.role === 'speaker');
                              
                              if (leaderMember?.userId) {
                                gameData.team1.leader = {
                                  id: typeof leaderMember.userId === 'object' ? leaderMember.userId._id : leaderMember.userId,
                                  name: leaderMember.userId.username || `Leader (${gameData.team1.name})`
                                };
                              }
                              
                              if (speakerMember?.userId) {
                                gameData.team1.speaker = {
                                  id: typeof speakerMember.userId === 'object' ? speakerMember.userId._id : speakerMember.userId,
                                  name: speakerMember.userId.username || `Speaker (${gameData.team1.name})`
                                };
                              }
                            }
                            // Fallback to team1Obj if posting.team1Members not available
                            else if (team1Obj?.members?.length > 0) {
                              const leaderMember = team1Obj.members.find(m => m.role === 'leader');
                              const speakerMember = team1Obj.members.find(m => m.role === 'speaker');
                              
                              if (leaderMember?.userId) {
                                gameData.team1.leader = {
                                  id: typeof leaderMember.userId === 'object' ? leaderMember.userId._id : leaderMember.userId,
                                  name: typeof leaderMember.userId === 'object' ? leaderMember.userId.username : `Leader (${team1Obj.name})`
                                };
                              }
                              
                              if (speakerMember?.userId) {
                                gameData.team1.speaker = {
                                  id: typeof speakerMember.userId === 'object' ? speakerMember.userId._id : speakerMember.userId,
                                  name: typeof speakerMember.userId === 'object' ? speakerMember.userId.username : `Speaker (${team1Obj.name})`
                                };
                              }
                            }
                            
                            // Add team2 member details directly from posting data
                            if (posting.team2Members && posting.team2Members.length > 0) {
                              const leaderMember = posting.team2Members.find(m => m.role === 'leader');
                              const speakerMember = posting.team2Members.find(m => m.role === 'speaker');
                              
                              if (leaderMember?.userId) {
                                gameData.team2.leader = {
                                  id: typeof leaderMember.userId === 'object' ? leaderMember.userId._id : leaderMember.userId,
                                  name: leaderMember.userId.username || `Leader (${gameData.team2.name})`
                                };
                              }
                              
                              if (speakerMember?.userId) {
                                gameData.team2.speaker = {
                                  id: typeof speakerMember.userId === 'object' ? speakerMember.userId._id : speakerMember.userId,
                                  name: speakerMember.userId.username || `Speaker (${gameData.team2.name})`
                                };
                              }
                            }
                            // Fallback to team2Obj if posting.team2Members not available
                            else if (team2Obj?.members?.length > 0) {
                              const leaderMember = team2Obj.members.find(m => m.role === 'leader');
                              const speakerMember = team2Obj.members.find(m => m.role === 'speaker');
                              
                              if (leaderMember?.userId) {
                                gameData.team2.leader = {
                                  id: typeof leaderMember.userId === 'object' ? leaderMember.userId._id : leaderMember.userId,
                                  name: typeof leaderMember.userId === 'object' ? leaderMember.userId.username : `Leader (${team2Obj.name})`
                                };
                              }
                              
                              if (speakerMember?.userId) {
                                gameData.team2.speaker = {
                                  id: typeof speakerMember.userId === 'object' ? speakerMember.userId._id : speakerMember.userId,
                                  name: typeof speakerMember.userId === 'object' ? speakerMember.userId.username : `Speaker (${team2Obj.name})`
                                };
                              }
                            }
                            
                            // console.log('Navigating to judge-panel with game data:', gameData); // Removed debug log
                            navigate('/judge-panel', { 
                              state: { selectedGame: gameData }
                            });
                          } else {
                            // console.log('Navigating to details page:', `/debates/${debate._id}/postings/${posting._id}`); // Removed debug log
                            navigate(`/debates/${debate._id}/postings/${posting._id}`);
                          }
                        }}
                      >
                        {posting.status === 'completed'
                          ? 'View Results'
                          : (userRole === 'judge' && posting.judges?.some(j => j._id === userId) ? 'Evaluate' : 'View Details')}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </CardContent>
      <CardActions>
        <Button
          size="small"
          color="primary"
          onClick={() => {
            if (debate.format === 'tournament') {
              navigate(`/tournaments/${debate._id}`);
            } else {
              navigate(`/debates/${debate._id}`);
            }
          }}
        >
          {t('myDebates.card.viewDetailsButton', 'View Details')}
        </Button>
        {debate.format === 'tournament' && (
          <Button
            size="small"
            color="primary"
            onClick={() => navigate(`/tournaments/${debate._id}`)}
          >
            Tournament Dashboard
          </Button>
        )}
        {userRole === 'judge' && tournamentAssignments.length > 0 && (
          <Button
            size="small"
            color="secondary"
            onClick={() => navigate('/judge-panel')}
          >
            Go to Judge Panel
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const MyDebates = () => {
  const { t } = useTranslation(); // Add useTranslation hook
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [debates, setDebates] = useState({ created: [], participated: [] });
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [judgeAssignments, setJudgeAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    fetchMyDebates();
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
    if (role === 'judge') {
      fetchJudgeAssignments();
    }
  }, []);

  const fetchMyDebates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/debates/user/mydebates`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch debates');
      }

      const data = await response.json();
      setDebates(data);
    } catch (error) {
      console.error('Error fetching debates:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchJudgeAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const response = await fetch(`${api.baseUrl}/api/apf/assignments`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch judge assignments');
      }

      const data = await response.json();
      setJudgeAssignments(data);
    } catch (error) {
      console.error('Error fetching judge assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your debates...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
        My Debates
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="debate tabs">
          <Tab label={t('myDebates.tabs.participated', 'Participated')} />
          <Tab label={t('myDebates.tabs.created', 'Created')} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {userRole === 'judge' && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/judge-panel')}
              startIcon={<GavelIcon />}
            >
              {judgeAssignments.filter(a => a.status === 'pending').length > 0
                ? t('myDebates.judgePanelButtonPending', 'Judge Panel ({{count}} pending)', { count: judgeAssignments.filter(a => a.status === 'pending').length })
                : t('myDebates.judgePanelButton', 'Judge Panel')}
            </Button>
          </Box>
        )}
        
        {debates.participated.length === 0 ? (
          <Alert severity="info">
            {t('myDebates.noParticipatedDebates', "You haven't joined any debates yet. Browse available debates to participate.")}
          </Alert>
        ) : (
          debates.participated.map(debate => (
            <DebateCard t={t}
              key={debate._id}
              debate={debate}
              navigate={navigate}
              userRole={userRole}
              userId={userId}
              judgeAssignments={judgeAssignments}
              loadingAssignments={loadingAssignments} // Pass loading state
            />
          ))
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {debates.created.length === 0 ? (
          <Alert severity="info">
            {t('myDebates.noCreatedDebates', "You haven't created any debates yet. Click the button below to host a new debate.")}
          </Alert>
        ) : (
          debates.created.map(debate => (
            <DebateCard t={t}
              key={debate._id}
              debate={debate}
              navigate={navigate}
              userRole={userRole}
              userId={userId}
              judgeAssignments={judgeAssignments}
              loadingAssignments={loadingAssignments} // Pass loading state
            />
          ))
        )}
        <Box textAlign="center" mt={3}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/host')}
          >
            {t('myDebates.hostNewDebateButton', 'Host a New Debate')}
          </Button>
        </Box>
      </TabPanel>
    </Container>
  );
};

export default MyDebates;