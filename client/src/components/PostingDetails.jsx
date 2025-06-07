import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Avatar,
  Button,
  useTheme
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const PostingDetails = () => {
  const { id, postingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(null);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const navigate = useNavigate();
  const theme = useTheme();
  
  useEffect(() => {
    fetchPostingDetails();
  }, [id, postingId]);
  
  const fetchPostingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/debates/${id}/postings/${postingId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch posting details');
      }
      
      const data = await response.json();
      setPosting(data);
    } catch (error) {
      console.error('Error fetching posting details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if the current user is a participant in this debate
  const getUserParticipationDetails = () => {
    if (!posting || !userId) return null;
    
    // Check if user is in team1
    const inTeam1 = posting.team1?.members?.some(member => 
      (member.user?._id === userId) || (member.userId?._id === userId) || (member.userId === userId)
    );
    
    // Check if user is in team2
    const inTeam2 = posting.team2?.members?.some(member => 
      (member.user?._id === userId) || (member.userId?._id === userId) || (member.userId === userId)
    );
    
    if (!inTeam1 && !inTeam2) return null;
    
    const userTeam = inTeam1 ? 'team1' : 'team2';
    const userTeamObj = inTeam1 ? posting.team1 : posting.team2;
    const userTeamName = inTeam1 ? posting.team1?.name : posting.team2?.name;
    
    // Get the user's role in the team
    let userRole = '';
    let userMember = null;
    
    if (inTeam1) {
      userMember = posting.team1?.members?.find(m => 
        (m.user?._id === userId) || (m.userId?._id === userId) || (m.userId === userId)
      );
    } else {
      userMember = posting.team2?.members?.find(m => 
        (m.user?._id === userId) || (m.userId?._id === userId) || (m.userId === userId)
      );
    }
    
    userRole = userMember?.role === 'leader' ? 'Leader' : 'Speaker';
    
    // Check if user's team won
    const isWinner = posting.winner === (inTeam1 ? posting.team1?._id : posting.team2?._id);
    
    return {
      userTeam,
      userTeamObj,
      userTeamName,
      userRole,
      isWinner,
      inTeam1,
      inTeam2
    };
  };
  
  const userParticipation = getUserParticipationDetails();
  
  const getUserIndividualScore = () => {
    if (!posting?.evaluation?.individualScores || !userParticipation) return null;
    
    const { userRole } = userParticipation;
    return posting.evaluation.individualScores.find(
      score => score.role.toLowerCase().includes(userRole.toLowerCase())
    );
  };
  
  const userScore = getUserIndividualScore();
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading posting details...
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  if (!posting) {
    return (
      <Container maxWidth="lg" sx={{ mt: 5 }}>
        <Alert severity="info">No posting details found.</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Back navigation */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        {userParticipation && (
          <Chip 
            icon={<PersonIcon />}
            label={`You participated as ${userParticipation.userRole} in ${userParticipation.userTeamName || 'your team'}`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
            Game Details
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Tournament:</strong> {posting.tournamentTitle || 'APF Debate'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip 
              label={`Status: ${posting.status || 'Scheduled'}`}
              color={posting.status === 'completed' ? 'success' : 'primary'}
            />
            <Chip label={`Game ID: ${posting._id}`} variant="outlined" />
            {posting.location && <Chip label={`Location: ${posting.location}`} variant="outlined" />}
          </Box>
          <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'secondary.main' }}>
            {posting.useCustomModel ? 'Custom Debate Model:' : 'Theme:'}
          </Typography>
          
          {posting.useCustomModel ? (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, maxHeight: '300px', overflow: 'auto' }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {posting.theme || 'No custom model text available'}
              </Typography>
            </Paper>
          ) : (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {posting.theme}
            </Typography>
          )}
          
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2,
                  borderLeft: userParticipation?.inTeam1 ? `4px solid ${theme.palette.primary.main}` : undefined,
                  bgcolor: userParticipation?.inTeam1 ? 'rgba(50, 205, 50, 0.05)' : undefined
                }}
              >
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Team 1 (Government)
                  {userParticipation?.inTeam1 && (
                    <Chip size="small" label="Your Team" color="primary" sx={{ ml: 1 }} />
                  )}
                </Typography>
                <Typography variant="body1">
                  {posting.team1?.name || 'Team 1'}
                </Typography>
                {posting.team1?.members && posting.team1.members.length > 0 ? (
                  <Box sx={{ mt: 1 }}>
                    {posting.team1.members.map((member, index) => (
                      <Typography 
                        variant="body2" 
                        key={index}
                        sx={{
                          fontWeight: (member.user?._id === userId || member.userId?._id === userId || member.userId === userId) ? 'bold' : 'normal',
                          color: (member.user?._id === userId || member.userId?._id === userId || member.userId === userId) ? 'primary.main' : 'inherit'
                        }}
                      >
                        <strong>{member.role === 'leader' ? 'Leader' : 'Speaker'}:</strong> {member.user?.username || 'Not specified'}
                        {(member.user?._id === userId || member.userId?._id === userId || member.userId === userId) && ' (You)'}
                      </Typography>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2">No team members specified</Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2,
                  borderLeft: userParticipation?.inTeam2 ? `4px solid ${theme.palette.primary.main}` : undefined,
                  bgcolor: userParticipation?.inTeam2 ? 'rgba(50, 205, 50, 0.05)' : undefined
                }}
              >
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Team 2 (Opposition)
                  {userParticipation?.inTeam2 && (
                    <Chip size="small" label="Your Team" color="primary" sx={{ ml: 1 }} />
                  )}
                </Typography>
                <Typography variant="body1">
                  {posting.team2?.name || 'Team 2'}
                </Typography>
                {posting.team2?.members && posting.team2.members.length > 0 ? (
                  <Box sx={{ mt: 1 }}>
                    {posting.team2.members.map((member, index) => (
                      <Typography 
                        variant="body2" 
                        key={index}
                        sx={{
                          fontWeight: (member.user?._id === userId || member.userId?._id === userId || member.userId === userId) ? 'bold' : 'normal',
                          color: (member.user?._id === userId || member.userId?._id === userId || member.userId === userId) ? 'primary.main' : 'inherit'
                        }}
                      >
                        <strong>{member.role === 'leader' ? 'Leader' : 'Speaker'}:</strong> {member.user?.username || 'Not specified'}
                        {(member.user?._id === userId || member.userId?._id === userId || member.userId === userId) && ' (You)'}
                      </Typography>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2">No team members specified</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {posting.winner && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Chip 
                icon={<EmojiEventsIcon />}
                label={`Winner: ${posting.winnerTeamName || 'Team'}`} 
                color="success" 
                sx={{ fontSize: '1.1rem', py: 2, px: 3 }} 
              />
              
              {userParticipation?.isWinner && (
                <Typography variant="subtitle1" color="success.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                  Congratulations! Your team won this debate.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
      
      {posting.status === 'completed' && posting.evaluation && (
        <>
          {/* For user's feedback highlight */}
          {userParticipation && (
            <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                Your Debate Performance
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary.main">
                        Team Score
                      </Typography>
                      <Typography variant="h3" color="primary.main" gutterBottom>
                        {posting.evaluation[`${userParticipation.userTeam}Score`] || '0'} points
                      </Typography>
                      <Typography variant="body1">
                        {posting.evaluation[`${userParticipation.userTeam}Comments`] || 'No specific feedback provided.'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                {userScore && (
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary.main">
                          Your Individual Performance ({userParticipation.userRole})
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(50, 205, 50, 0.1)', borderRadius: 1, width: '30%' }}>
                            <Typography variant="body1" gutterBottom>Matter</Typography>
                            <Typography variant="h5" color="primary.main">{userScore.matter}/30</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(50, 205, 50, 0.1)', borderRadius: 1, width: '30%' }}>
                            <Typography variant="body1" gutterBottom>Method</Typography>
                            <Typography variant="h5" color="primary.main">{userScore.method}/30</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(50, 205, 50, 0.1)', borderRadius: 1, width: '30%' }}>
                            <Typography variant="body1" gutterBottom>Manner</Typography>
                            <Typography variant="h5" color="primary.main">{userScore.manner}/30</Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mt: 2 }}>
                          Total Score: {userScore.matter + userScore.method + userScore.manner}/90
                        </Typography>
                        
                        <Box sx={{ mt: 2, bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Matter</strong> - Quality of arguments, logic, and evidence
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Method</strong> - Structure, organization, and strategic approach
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Manner</strong> - Delivery, persuasiveness, and speaking style
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}
          
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
            Judge's Evaluation
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Overall Feedback
                </Typography>
                <Typography variant="body1">
                  {posting.evaluation.comments || 'No overall comments provided.'}
                </Typography>
              </CardContent>
            </Card>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Team 1 Score
                      {userParticipation?.inTeam1 && (
                        <Chip size="small" label="Your Team" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {posting.evaluation.team1Score || '0'} points
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {posting.evaluation.team1Comments || 'No specific comments provided.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Team 2 Score
                      {userParticipation?.inTeam2 && (
                        <Chip size="small" label="Your Team" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {posting.evaluation.team2Score || '0'} points
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {posting.evaluation.team2Comments || 'No specific comments provided.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
            Speech Transcriptions
          </Typography>
          
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Leader Gov</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Leader Opp</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Speaker Gov</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Speaker Opp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Resolution</Typography>
                    <Typography variant="body2">{posting.transcription?.leaderGov?.resolution || 'No transcription available'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" color="primary" gutterBottom>Definition</Typography>
                    <Typography variant="body2">{posting.transcription?.leaderGov?.definition || 'No transcription available'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" color="primary" gutterBottom>Status Quo</Typography>
                    <Typography variant="body2">{posting.transcription?.leaderGov?.statusQuo || 'No transcription available'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" color="primary" gutterBottom>Arguments</Typography>
                    <Typography variant="body2">{posting.transcription?.leaderGov?.arguments || 'No transcription available'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Definition Challenge</Typography>
                    <Typography variant="body2">{posting.transcription?.leaderOpp?.definitionChallenge || 'No transcription available'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" color="primary" gutterBottom>Rebuttal</Typography>
                    <Typography variant="body2">{posting.transcription?.leaderOpp?.rebuttal || 'No transcription available'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" color="primary" gutterBottom>Arguments</Typography>
                    <Typography variant="body2">{posting.transcription?.leaderOpp?.arguments || 'No transcription available'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Extension</Typography>
                    <Typography variant="body2">{posting.transcription?.speakerGov?.extension || 'No transcription available'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" color="primary" gutterBottom>Rebuttal</Typography>
                    <Typography variant="body2">{posting.transcription?.speakerGov?.rebuttal || 'No transcription available'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" color="primary" gutterBottom>Arguments</Typography>
                    <Typography variant="body2">{posting.transcription?.speakerGov?.arguments || 'No transcription available'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Extension</Typography>
                    <Typography variant="body2">{posting.transcription?.speakerOpp?.extension || 'No transcription available'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" color="primary" gutterBottom>Rebuttal</Typography>
                    <Typography variant="body2">{posting.transcription?.speakerOpp?.rebuttal || 'No transcription available'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    
                    <Typography variant="subtitle2" color="primary" gutterBottom>Arguments</Typography>
                    <Typography variant="body2">{posting.transcription?.speakerOpp?.arguments || 'No transcription available'}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          
          {posting.evaluation.individualScores && (
            <>
              <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
                Individual Performance Scores
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Speaker</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Matter (30)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Method (30)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Manner (30)</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total (90)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {posting.evaluation.individualScores.map((score, index) => {
                      // Check if this score belongs to the current user
                      const isCurrentUser = userParticipation?.userRole?.toLowerCase() === score.role.toLowerCase();
                      
                      return (
                        <TableRow 
                          key={index}
                          sx={{ 
                            bgcolor: isCurrentUser ? 'rgba(50, 205, 50, 0.1)' : undefined,
                            '& td': {
                              fontWeight: isCurrentUser ? 'bold' : 'normal'
                            }
                          }}
                        >
                          <TableCell>
                            {score.role}
                            {isCurrentUser && ' (You)'}
                          </TableCell>
                          <TableCell>{score.speaker}</TableCell>
                          <TableCell>{score.matter}</TableCell>
                          <TableCell>{score.method}</TableCell>
                          <TableCell>{score.manner}</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            {score.matter + score.method + score.manner}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default PostingDetails;