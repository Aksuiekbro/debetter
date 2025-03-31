import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTournamentDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${api.baseUrl}/api/tournaments/${id}`, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setTournament(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tournament details:', error);
        setError('Failed to load tournament details. Please try again later.');
        setLoading(false);
      }
    };

    fetchTournamentDetail();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/tournaments')}
        >
          Back to Tournaments
        </Button>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4">
          Tournament not found
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/tournaments')}
        >
          Back to Tournaments
        </Button>
      </Container>
    );
  }

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'upcoming': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };
  
  // Format dates for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {tournament.name}
          </Typography>
          <Chip 
            label={tournament.status?.replace('_', ' ') || 'Unknown'}
            color={getStatusColor(tournament.status)}
            sx={{ mt: 1 }}
          />
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/tournaments')}
        >
          Back to Tournaments
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Description
        </Typography>
        <Typography paragraph>
          {tournament.description}
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Location
            </Typography>
            <Typography>
              {tournament.location}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Dates
            </Typography>
            <Typography>
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Teams
      </Typography>
      <Grid container spacing={2}>
        {tournament.teams && tournament.teams.map((team) => (
          <Grid item xs={12} sm={6} md={4} key={team._id || team.id}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">
                {team.name}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {tournament.winner && (
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'success.light' }}>
          <Typography variant="h6" gutterBottom>
            Tournament Winner
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {tournament.winner.name}
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default TournamentDetail; 