import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import useTranslation
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
import GavelIcon from '@mui/icons-material/Gavel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import JudgePanel from './JudgePanel';
import TournamentGrid from './TournamentGrid';

const DebateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(); // Initialize useTranslation
  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    const fetchDebateDetails = async () => {
      try {
        setLoading(true);
        const response = await api.client.get(`/api/debates/${id}`);
        
        if (!response.data) {
          throw new Error('No data received from server');
        }
        
        const data = response.data;
        // console.log('Received debate data:', data); // Removed debug log
        
        // Only attempt to join if we have valid data and conditions are met
        if (data && userRole === 'judge' && data.creator._id === userId && 
            !data.participants.some(p => p._id === userId || p._id?.toString() === userId)) {
          try {
            await handleJoinDebate();
          } catch (joinError) {
            console.error('Error joining debate:', joinError);
            // Still set the debate data even if join fails
            setDebate(data);
          }
        } else {
          setDebate(data);
        }
      } catch (error) {
        console.error('Error fetching debate details:', error);
        // Set error state and show user-friendly message
        alert(error.response?.data?.message || t('debateDetails.loadFailedAlert', 'Failed to load debate details. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchDebateDetails();
    }
  }, [id, navigate, userId, userRole]);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await api.client.get(api.endpoints.profile);
        if (response.data) {
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (localStorage.getItem('token')) {
      getCurrentUser();
    }
  }, []);

  const canJoinDebate = () => {
    if (!debate || !currentUser) return false;

    if (debate.format === 'tournament') {
      if (currentUser.role === 'judge') {
        return (debate.participants.filter(p => p.role === 'judge').length) < 8;
      }
      return (debate.participants.filter(p => p.role !== 'judge').length) < 32;
    }
    
    return debate.participants.length < (debate.maxParticipants || 6);
  };

  const handleJoinDebate = async () => {
    try {
      setActionLoading(true);
      if (!api.validateToken()) {
        navigate('/login');
        return;
      }

      if (!canJoinDebate()) {
        alert(currentUser?.role === 'judge' ? t('debateDetails.maxJudgesReachedAlert', 'Maximum judges reached') : t('debateDetails.debateFullAlert', 'This debate is full'));
        return;
      }

      const response = await api.client.post(`/api/debates/${id}/join`);
      setDebate(response.data);
    } catch (error) {
      console.error('Error joining debate:', error);
      alert(error.response?.data?.message || t('debateDetails.joinFailedAlert', 'Failed to join debate'));
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
      alert(error.response?.data?.message || t('debateDetails.leaveFailedAlert', 'Failed to leave debate'));
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

  // Helper functions to check tournament state
  const isTournamentOpenForRegistration = () => {
    if (!debate || debate.format !== 'tournament' || debate.status !== 'upcoming') {
      return false;
    }

    // Check registration deadline
    if (debate.registrationDeadline) {
      const now = new Date();
      const deadline = new Date(debate.registrationDeadline);
      return now < deadline;
    }

    return true;
  };

  const handleRegisterTeam = () => {
    navigate(`/debates/${id}/register-team`);
  };

  const getParticipantDisplay = () => {
    if (!debate) return "";

    if (debate.format === 'tournament') {
      const counts = {
        debaters: debate.participants.filter(p => p.role !== 'judge').length,
        judges: debate.participants.filter(p => p.role === 'judge').length
      };

      return (
        <Stack direction="row" spacing={1}>
          <Chip 
            icon={<GroupsIcon />} 
            label={t('debateDetails.debatersCountChip', 'Debaters: {{count}}/32', { count: counts.debaters })}
            color="primary"
            variant="outlined"
          />
          <Chip 
            icon={<GavelIcon />} 
            label={t('debateDetails.judgesCountChip', 'Judges: {{count}}/8', { count: counts.judges })}
            color="secondary"
            variant="outlined"
          />
        </Stack>
      );
    }

    return (
      <Box display="inline-block">
        <Chip 
          icon={<GroupsIcon />} 
          label={t('debateDetails.participantsCountChip', 'Participants: {{current}}/{{max}}', { current: debate.participants.length, max: debate.maxParticipants })}
          color="primary"
          variant="outlined"
        />
      </Box>
    );
  };

  const renderParticipantInfo = () => {
    if (!debate) return null;

    const debaters = debate.participants.filter(p => p.role !== 'judge');
    const judges = debate.participants.filter(p => p.role === 'judge');

    return (
      <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
          {debate.format === 'tournament' ? t('debateDetails.tournamentParticipantsTitle', 'Tournament Participants') : t('debateDetails.participantsTitle', 'Participants')}
        </Typography>

        <Box sx={{ mb: 2 }}>
          {debate.format === 'tournament' ? (
            <>
              <Typography component="div" variant="body2" color="primary" gutterBottom>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>{t('debateDetails.debatersLabel', 'Debaters:')}</span>
                  <strong>{debaters.length}/32</strong>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('debateDetails.judgesLabel', 'Judges:')}</span>
                  <strong>{judges.length}/8</strong>
                </Box>
              </Typography>
            </>
          ) : (
            <Typography component="div" variant="body2" color="primary" gutterBottom>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('debateDetails.totalParticipantsLabel', 'Total Participants:')}</span>
                <strong>{debate.participants.length}/{debate.maxParticipants}</strong>
              </Box>
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {debate.format === 'tournament' && (
          <>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              {t('debateDetails.judgesSectionTitle', 'Judges')}
            </Typography>
            <List dense>
              {judges.map((judge) => (
                <ListItem key={judge._id}>
                  <ListItemAvatar>
                    <Avatar><GavelIcon /></Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={judge.username} secondary={t('debateDetails.judgeRole', 'Judge')} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom>
              {t('debateDetails.debatersSectionTitle', 'Debaters')}
            </Typography>
          </>
        )}

        <List dense={debate.format === 'tournament'}>
          {(debate.format === 'tournament' ? debaters : debate.participants).map((participant) => (
            <ListItem key={participant._id}>
              <ListItemAvatar>
                <Avatar>
                  {participant.role === 'judge' ? <GavelIcon /> : <PersonIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary={participant.username}
                secondary={debate.format !== 'tournament' && participant.role === 'judge' ? t('debateDetails.judgeRole', 'Judge') : t('debateDetails.debaterRole', 'Debater')}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>{t('debateDetails.loadingMessage', 'Loading debate details...')}</Typography>
      </Container>
    );
  }

  if (!debate) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>{t('debateDetails.notFoundMessage', 'Debate not found')}</Typography>
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
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="h4" sx={{ color: 'primary.main', mb: 2 }}>
              {debate.title}
            </Typography>
            
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip 
                icon={<AccessTimeIcon />} 
                label={`${t('debateDetails.statusLabel', 'Status:')} ${debate.status}`}
                color="primary"
                variant="outlined"
              />
              <Chip 
                icon={<GradeIcon />} 
                label={`${t('debateDetails.difficultyLabel', 'Difficulty:')} ${debate.difficulty}`}
                color="primary"
                variant="outlined"
              />
              {getParticipantDisplay()}
            </Box>

            <Typography variant="body1" sx={{ mb: 4 }}>
              {debate.description}
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                {t('debateDetails.detailsTitle', 'Details')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" component="span">
                      <strong>{t('debateDetails.categoryLabel', 'Category:')}</strong>
                    </Typography>
                    <Typography variant="body2" component="span">
                      {debate.category}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" component="span">
                      <strong>{t('debateDetails.startDateLabel', 'Start Date:')}</strong>
                    </Typography>
                    <Typography variant="body2" component="span">
                      {new Date(debate.startDate).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            {/* Tournament Bracket Display */}
            {debate.format === 'tournament' && (
              <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                  {t('debateDetails.tournamentBracketTitle', 'Tournament Bracket')}
                </Typography>
                {debate.tournamentRounds && debate.tournamentRounds.length > 0 ? (
                  <TournamentGrid rounds={debate.tournamentRounds} />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    {t('debateDetails.bracketGenerationMessage', 'Tournament bracket will be generated once all participants have joined.')}
                  </Typography>
                )}
              </Box>
            )}

            {debate && (
              <Box sx={{ mt: 3 }}>
                {/* Team Registration Button for Tournaments */}
                {debate.format === 'tournament' && isTournamentOpenForRegistration() && (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<GroupAddIcon />}
                    onClick={handleRegisterTeam}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    {t('debateDetails.registerTeamButton', 'Register Your Team')}
                  </Button>
                )}
                
                {isParticipant() ? (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleLeaveDebate}
                    fullWidth
                    disabled={actionLoading || (debate.format === 'tournament' && currentUser?.role === 'judge' && debate.creator._id === currentUser._id)}
                  >
                    {actionLoading ? t('debateDetails.processingButton', 'Processing...') :
                     (debate.format === 'tournament' && currentUser?.role === 'judge' && debate.creator._id === currentUser._id) ?
                     t('debateDetails.judgeCannotLeaveOwnDebateButton', 'Tournament Judges Cannot Leave Their Own Debates') : t('debateDetails.leaveDebateButton', 'Leave This Debate')}
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
                      {actionLoading ? t('debateDetails.processingButton', 'Processing...') :
                       debate.format === 'tournament' ?
                       (currentUser?.role === 'judge' ? t('debateDetails.joinAsJudgeButton', 'Join as Judge') : t('debateDetails.joinAsDebaterButton', 'Join as Debater')) :
                       t('debateDetails.joinDebateButton', 'Join This Debate')}
                    </Button>
                  )
                )}
                
                {debate.format === 'tournament' && !canJoinDebate() && (
                  <Typography variant="body2" color="error" sx={{ mt: 1, textAlign: 'center' }}>
                    {currentUser?.role === 'judge' ?
                      t('debateDetails.maxJudgesReachedMessage', 'Maximum number of judges reached') :
                      t('debateDetails.maxDebatersReachedMessage', 'Maximum number of debaters reached')}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Tournament Status Section */}
            {debate.format === 'tournament' && debate.status !== 'completed' && (
              <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                  {t('debateDetails.tournamentStatusTitle', 'Tournament Status')}
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t('debateDetails.requiredParticipantsTitle', 'Required Participants')}
                    </Typography>
                    <Typography variant="body1">
                      {t('debateDetails.requiredDebatersCount', '• Debaters: {{count}}/32', { count: debate.participants.filter(p => p.role !== 'judge').length })}
                    </Typography>
                    <Typography variant="body1">
                      {t('debateDetails.requiredJudgesCount', '• Judges: {{count}}/8', { count: debate.participants.filter(p => p.role === 'judge').length })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="textSecondary">
                      {t('debateDetails.statusLabel', 'Status:')} {debate.status.charAt(0).toUpperCase() + debate.status.slice(1)}
                    </Typography>
                    {debate.status === 'upcoming' && (
                      <Typography variant="body2" color="textSecondary">
                        {t('debateDetails.tournamentStartMessage', 'Tournament will begin once all required participants have joined.')}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Add Registration Info */}
                  {isTournamentOpenForRegistration() && (
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        {t('debateDetails.registrationOpenTitle', 'Registration Open')}
                      </Typography>
                      <Typography variant="body2">
                        {t('debateDetails.deadlineLabel', 'Deadline:')} {new Date(debate.registrationDeadline).toLocaleString()}
                      </Typography>
                      <Button 
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIcon={<GroupAddIcon />}
                        onClick={handleRegisterTeam}
                        sx={{ mt: 1 }}
                      >
                        {t('debateDetails.registerTeamButton', 'Register Team')}
                      </Button>
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}
            
            {renderParticipantInfo()}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DebateDetails;