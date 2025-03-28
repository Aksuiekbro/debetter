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
  CardContent
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

const PostingDetails = () => {
  const { id, postingId } = useParams();
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(null);
  const [error, setError] = useState('');
  
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
            Theme: {posting.theme}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Team 1 (Government)
                </Typography>
                <Typography variant="body1">
                  {posting.team1?.name || 'Team 1'}
                </Typography>
                {posting.team1Members && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Leader:</strong> {posting.team1Members.leader?.username || 'Not specified'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Speaker:</strong> {posting.team1Members.speaker?.username || 'Not specified'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Team 2 (Opposition)
                </Typography>
                <Typography variant="body1">
                  {posting.team2?.name || 'Team 2'}
                </Typography>
                {posting.team2Members && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Leader:</strong> {posting.team2Members.leader?.username || 'Not specified'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Speaker:</strong> {posting.team2Members.speaker?.username || 'Not specified'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {posting.winner && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Chip 
                label={`Winner: ${posting.winnerTeamName || 'Team'}`} 
                color="success" 
                sx={{ fontSize: '1.1rem', py: 2, px: 3 }} 
              />
            </Box>
          )}
        </Box>
      </Paper>
      
      {posting.status === 'completed' && posting.evaluation && (
        <>
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
                    {posting.evaluation.individualScores.map((score, index) => (
                      <TableRow key={index}>
                        <TableCell>{score.role}</TableCell>
                        <TableCell>{score.speaker}</TableCell>
                        <TableCell>{score.matter}</TableCell>
                        <TableCell>{score.method}</TableCell>
                        <TableCell>{score.manner}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {score.matter + score.method + score.manner}
                        </TableCell>
                      </TableRow>
                    ))}
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