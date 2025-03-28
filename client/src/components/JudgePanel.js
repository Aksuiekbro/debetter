import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import JudgeGameCard from './JudgeGameCard';
import ApfJudgeEvaluation from './ApfJudgeEvaluation';
import { getAuthHeaders } from '../utils/auth';
import { api } from '../config/api';

const JudgePanel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedGames, setAssignedGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);

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
    } catch (error) {
      console.error('Error fetching assigned games:', error);
      setError('Failed to load your assigned games. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setShowEvaluation(true);
  };

  const handleCloseEvaluation = () => {
    setShowEvaluation(false);
    setSelectedGame(null);
  };

  const handleSubmitEvaluation = async (evaluationData) => {
    try {
      console.log('Submitting evaluation:', evaluationData);
      
      // Use the tournament ID as the debate ID for the API endpoint
      const debateId = selectedGame.tournamentId;
      
      // Submit evaluation to API
      const response = await fetch(`${api.baseUrl}/api/apf/${debateId}/evaluate`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evaluationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit evaluation');
      }
      
      // Update local state to reflect the evaluated status
      setAssignedGames(prevGames => 
        prevGames.map(game => 
          game.id === evaluationData.gameId 
            ? { ...game, status: 'evaluated' } 
            : game
        )
      );
      
      // Close the evaluation panel
      handleCloseEvaluation();
      
      // Refresh the games list
      fetchAssignedGames();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Failed to submit evaluation: ' + error.message);
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
          <Typography variant="h4" gutterBottom>
            Judge Panel
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label={`Pending (${pendingGames.length})`} />
              <Tab label={`Completed (${completedGames.length})`} />
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
                    Your assigned debates requiring evaluation
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
                          You have no pending debates to evaluate
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
              
              {tabValue === 1 && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Your completed evaluations
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
                          You have no completed evaluations
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
    </Container>
  );
};

export default JudgePanel;