import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import JudgeGameCard from './JudgeGameCard';
import ApfJudgeEvaluation from './ApfJudgeEvaluation';
import { getAuthHeaders } from '../utils/auth';

const JudgePanel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignedGames, setAssignedGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchAssignedGames();
  }, []);

  const fetchAssignedGames = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch from your API
      // For now, using mock data
      const mockGames = [
        {
          id: 'game1',
          format: 'APF',
          startTime: new Date().setHours(12, 0, 0),
          duration: 60,
          location: '203 кабинет',
          team1: { id: 'team1', name: 'team 1' },
          team2: { id: 'team2', name: 'team 2' },
          theme: 'Health care has to be free',
          status: 'pending'
        },
        {
          id: 'game2',
          format: 'APF',
          startTime: new Date().setHours(14, 0, 0),
          duration: 60,
          location: '204 кабинет',
          team1: { id: 'team3', name: 'team 3' },
          team2: { id: 'team4', name: 'team 4' },
          theme: 'Technology addiction is a serious problem',
          status: 'pending'
        },
      ];
      
      // Simulate API call delay
      setTimeout(() => {
        setAssignedGames(mockGames);
        setLoading(false);
      }, 500);
      
      // For actual implementation:
      // const response = await fetch('http://localhost:5001/api/debates/assigned', {
      //   headers: getAuthHeaders()
      // });
      // if (response.ok) {
      //   const games = await response.json();
      //   setAssignedGames(games);
      // }
    } catch (error) {
      console.error('Error fetching assigned games:', error);
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
      
      // Update local state to reflect the evaluated status
      setAssignedGames(prevGames => 
        prevGames.map(game => 
          game.id === evaluationData.gameId 
            ? { ...game, status: 'evaluated' } 
            : game
        )
      );
      
      // In a real implementation, you would submit to API:
      // await fetch(`http://localhost:5001/api/debates/${evaluationData.gameId}/evaluate`, {
      //   method: 'POST',
      //   headers: {
      //     ...getAuthHeaders(),
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(evaluationData)
      // });
      
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Failed to submit evaluation. Please try again.');
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
                            onClick={() => alert('This evaluation has already been submitted')} 
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