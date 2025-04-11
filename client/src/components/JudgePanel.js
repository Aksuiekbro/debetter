import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import JudgeGameCard from './JudgeGameCard';
import ApfJudgeEvaluation from './ApfJudgeEvaluation';
import { getAuthHeaders } from '../utils/auth';
import { api } from '../config/api';

const JudgePanel = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedGames, setAssignedGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchAssignedGames();
  }, []);

  // Check for navigation state to directly open evaluation
  useEffect(() => {
    if (location.state?.selectedGame) {
      console.log('Received selectedGame from navigation state:', location.state.selectedGame);
      setSelectedGame(location.state.selectedGame);
      setShowEvaluation(true);
      // Clear the state to prevent re-triggering on refresh/back navigation
      navigate('.', { replace: true, state: {} }); 
    }
  }, [location.state, navigate]);


  const fetchAssignedGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch assigned games from API
      const response = await fetch(`${api.baseUrl}/api/apf/assignments`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assigned games: ${response.status}`);
      }

      const games = await response.json();
      console.log('Fetched assigned games:', games);
      setAssignedGames(games);
      if (games && games.length > 0) {
        console.log('[useJudgeAssignments] Processed assignedGames[0]:', JSON.stringify(games[0], null, 2));
      }
    } catch (error) {
      console.error('Error fetching assigned games:', error);
      setError(t('judgePanel.loadError', 'Failed to load your assigned games. Please try again later.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = (game) => {
    // Navigate to the ActiveJudgeInterface for the selected game
    // Ensure we use debateId and postingId as expected by the ActiveJudgeInterface route
    // Assuming the 'game' object from '/api/apf/assignments' has these properties
    console.log(`[JudgePanel] Navigating to game. Debate ID: ${game.tournamentId}, Posting ID: ${game.id}`); // Use correct props
    navigate(`/judge/${game.tournamentId}/${game.id}`); // Use correct props
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
    setSelectedGame(null);
  };

  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };

  const handleSubmitEvaluation = async (evaluationData) => {
    try {
      console.log('Submitting evaluation:', evaluationData);
      
      // Use the tournament ID as the debate ID for the API endpoint
      const debateId = selectedGame.tournamentId;
      
      // Ensure we have all required fields 
      if (!debateId || !evaluationData.gameId || !evaluationData.winningTeamId) {
        console.error('Missing required data:', { debateId, gameId: evaluationData.gameId, winningTeamId: evaluationData.winningTeamId });
        setNotification({
          open: true,
          message: t('judgePanel.missingDataError', 'Missing required evaluation data. Please try again.'),
          severity: 'error'
        });
        return;
      }
      
      // Submit evaluation to API
      const response = await fetch(`${api.baseUrl}/api/apf/${debateId}/evaluate`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...evaluationData,
          // Ensure we're sending the proper ID format as expected by the server
          gameId: evaluationData.gameId.toString(),
          tournamentId: debateId.toString(),
          winningTeamId: evaluationData.winningTeamId.toString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('judgePanel.submitError', 'Failed to submit evaluation'));
      }
      
      // Update local state to reflect the evaluated status
      setAssignedGames(prevGames => 
        prevGames.map(game => 
          game.id === evaluationData.gameId 
            ? { ...game, status: 'evaluated' } 
            : game
        )
      );
      
      // Show success notification
      setNotification({
        open: true,
        message: t('judgePanel.submitSuccess', 'Evaluation submitted successfully!'),
        severity: 'success'
      });
      
      // Close the evaluation panel
      handleCloseEvaluation();
      
      // Refresh the games list
      fetchAssignedGames();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setNotification({
        open: true,
        message: t('judgePanel.submitError', 'Failed to submit evaluation: {{message}}', { message: error.message }),
        severity: 'error'
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const pendingGames = assignedGames.filter(game => game.status === 'pending');
  const completedGames = assignedGames.filter(game => game.status === 'evaluated');

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {showEvaluation && selectedGame ? (
        <ApfJudgeEvaluation 
          game={selectedGame} 
          onClose={handleCloseEvaluation} 
          onSubmitEvaluation={handleSubmitEvaluation}
        />
      ) : (
        <Paper elevation={3} sx={{ p: 3 }}>
          {assignedGames.length > 0 && console.log('[JudgePanel] Title value being rendered:', assignedGames[0]?.title)}
          <Typography variant="h4" gutterBottom>
            {assignedGames.length > 0 ? `${t('judgePanel.title', 'Judge Panel')} - ${assignedGames[0].title.replace('{{debateTitle}} - ', '')}` : t('judgePanel.title', 'Judge Panel')}
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={t('judgePanel.tabPending', 'Pending ({{count}})', { count: pendingGames.length })} />
              <Tab label={t('judgePanel.tabCompleted', 'Completed ({{count}})', { count: completedGames.length })} />
            </Tabs>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          ) : (
            <>
              {tabValue === 0 && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('judgePanel.pendingSubtitle', 'Your assigned debates requiring evaluation')}
                  </Typography>
                  <Grid container spacing={3}>
                    {pendingGames.length > 0 ? (
                      pendingGames.map((game) => (
                        <Grid item xs={12} md={6} key={game.id}>
                          <JudgeGameCard 
                            game={game} 
                            onClick={handleGameSelect} 
                          />
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                          {t('judgePanel.noPending', 'You have no pending debates to evaluate')}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
              
              {tabValue === 1 && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('judgePanel.completedSubtitle', 'Your completed evaluations')}
                  </Typography>
                  <Grid container spacing={3}>
                    {completedGames.length > 0 ? (
                      completedGames.map((game) => (
                        <Grid item xs={12} md={6} key={game.id}>
                          <JudgeGameCard 
                            game={game} 
                            onClick={() => navigate(`/debates/${game.tournamentId}/postings/${game.id}`)} 
                          />
                        </Grid>
                      ))
                    ) : (
                      <Grid item xs={12}>
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                          {t('judgePanel.noCompleted', 'You have no completed evaluations')}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
            </>
          )}
        </Paper>
      )}
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default JudgePanel;