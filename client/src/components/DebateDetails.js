import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GradeIcon from '@mui/icons-material/Grade';
import GroupsIcon from '@mui/icons-material/Groups';
import JudgePanel from './JudgePanel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TournamentGrid from './TournamentGrid';

const DebateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);  // Add this state
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    const fetchDebateDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5001/api/debates/${id}`, {
          headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
          handleUnauthorized(navigate);
          return;
        }
        const data = await response.json();
        if (response.ok) {
          // If the user is the judge that created the debate, automatically add them as participant
          if (userRole === 'judge' && data.creator._id === userId && !data.participants.some(p => p._id === userId)) {
            await handleJoinDebate();
          } else {
            setDebate(data);
          }
        } else {
          console.error('Error:', data.message);
        }
      } catch (error) {
        console.error('Error fetching debate details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDebateDetails();
  }, [id, navigate, userId, userRole]);

  const canJoinDebate = () => {
    if (!debate) return false;

    const currentParticipants = debate.participants.filter(p => p.role !== 'judge');
    
    if (debate.format === 'tournament') {
      // For tournaments, limit to 32 participants (excluding judges)
      return currentParticipants.length < 32;
    }

    // For standard debates, use maxParticipants
    return debate.participants.length < debate.maxParticipants;
  };

  const handleJoinDebate = async () => {
    try {
      setActionLoading(true);
      if (!api.validateToken()) {
        navigate('/login');
        return;
      }

      if (!canJoinDebate()) {
        alert('This debate is full');
        return;
      }

      const response = await api.client.post(`/api/debates/${id}/join`);
      setDebate(response.data);
    } catch (error) {
      console.error('Error joining debate:', error);
      alert(error.response?.data?.message || 'Failed to join debate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveDebate = async () => {
    try {
      setActionLoading(true);
      if (!api.validateToken()) {
        navigate('/login');
        return;
      }

      const response = await api.client.post(`/api/debates/${id}/leave`);
      setDebate(response.data);
    } catch (error) {
      console.error('Error leaving debate:', error);
      alert(error.response?.data?.message || 'Failed to leave debate');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper function to check if user is a participant
  const isParticipant = () => {
    return debate?.participants.some(p => p._id === userId || p._id?.toString() === userId) || 
           (userRole === 'judge' && debate?.creator._id === userId);
  };

  // Add function to update debate state
  const handleDebateUpdate = (updatedDebate) => {
    setDebate(updatedDebate);
  };

  const getParticipantDisplay = () => {
    if (debate.format === 'tournament') {
      const currentCount = debate.participants.filter(p => p.role !== 'judge').length;
      return `${currentCount}/32`;
    }
    return `${debate.participants.length}/${debate.maxParticipants}`;
  };

  const renderTournamentInfo = () => {
    if (debate.format !== 'tournament') return null;

    return (
      <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)', mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon />
          Tournament Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Format:</strong> {debate.mode === 'solo' ? 'Solo Tournament (32 participants)' : 'Duo Tournament (16 teams of 2)'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Current Participants:</strong> {debate.participants.filter(p => p.role !== 'judge').length}/32
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body1">
              <strong>Judges:</strong> {debate.participants.filter(p => p.role === 'judge').length}/8
            </Typography>
          </Grid>
          {debate.registrationDeadline && (
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Registration Deadline:</strong> {new Date(debate.registrationDeadline).toLocaleDateString()}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    );
  };

  const renderTournamentBracket = () => {
    if (debate.format !== 'tournament' || !debate.tournamentRounds) return null;

    return (
      <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)', mb: 3 }}>
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon />
          Tournament Bracket
        </Typography>
        <Box sx={{ overflow: 'auto' }}>
          <TournamentGrid rounds={debate.tournamentRounds} />
        </Box>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading debate details...</Typography>
      </Container>
    );
  }

  if (!debate) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Debate not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Show JudgePanel for judges when debate is ready */}
      {userRole === 'judge' && debate?.status !== 'completed' && (
        <Box sx={{ mb: 3 }}>
          <JudgePanel 
            debate={debate} 
            onUpdateDebate={handleDebateUpdate} 
          />
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {debate.format === 'tournament' && renderTournamentInfo()}
          {debate.format === 'tournament' && renderTournamentBracket()}
          <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="h4" sx={{ color: 'primary.main', mb: 2 }}>
              {debate.title}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              <Chip 
                icon={<AccessTimeIcon />} 
                label={`Status: ${debate.status}`}
                color="primary"
                variant="outlined"
              />
              <Chip 
                icon={<GradeIcon />} 
                label={`Difficulty: ${debate.difficulty}`}
                color="primary"
                variant="outlined"
              />
              <Chip 
                icon={<GroupsIcon />} 
                label={`Participants: ${getParticipantDisplay()}`}
                color="primary"
                variant="outlined"
              />
              {debate.format === 'tournament' && (
                <Chip 
                  icon={<GroupsIcon />} 
                  label={`Format: ${debate.mode === 'solo' ? 'Solo Tournament' : 'Duo Tournament'}`}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>

            <Typography variant="body1" sx={{ mb: 4 }}>
              {debate.description}
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Category:</strong> {debate.category}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Start Date:</strong> {new Date(debate.startDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Created By:</strong> {debate.creator?.username || 'Unknown'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            {debate && (
              <Box sx={{ mt: 3 }}>
                {isParticipant() ? (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleLeaveDebate}
                    fullWidth
                    disabled={actionLoading || (userRole === 'judge' && debate.creator._id === userId)}
                  >
                    {actionLoading ? 'Processing...' : 
                     (userRole === 'judge' && debate.creator._id === userId) ? 
                     'Judges Cannot Leave Their Own Debates' : 'Leave This Debate'}
                  </Button>
                ) : (
                  canJoinDebate() && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleJoinDebate}
                      fullWidth
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Join This Debate'}
                    </Button>
                  )
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Team Assignment Section */}
            {debate.status === 'team-assignment' && (
              <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                  Team Assignment
                </Typography>
                {/* Team assignment content */}
              </Paper>
            )}

            {/* Participants Section */}
            <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                Participants
              </Typography>
              <List>
                {debate.participants.map((participant, index) => (
                  <React.Fragment key={participant._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={participant.username}
                        secondary={participant.role === 'judge' ? 'Judge' : 'Debater'}
                      />
                    </ListItem>
                    {index < debate.participants.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DebateDetails;