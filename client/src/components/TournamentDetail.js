import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { useTranslation } from 'react-i18next'; // Import useTranslation
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
import { Snackbar, Alert } from '@mui/material'; // For notifications
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

const TournamentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(); // Initialize useTranslation
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Get user context
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    const fetchTournamentDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${api.baseUrl}/api/debates/${id}`, {
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
        setError(t('tournamentDetail.errorFailed', 'Failed to load tournament details. Please try again later.'));
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
          {t('tournamentDetail.backButton', 'Back to Tournaments')}
        </Button>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4">
          {t('tournamentDetail.errorNotFound', 'Tournament not found')}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/tournaments')}
        >
          {t('tournamentDetail.backButton', 'Back to Tournaments')}
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

  // Handle tournament registration
  const handleRegister = async () => {
    if (!user) {
      setRegistrationError(t('tournamentDetail.registerErrorAuth', 'You must be logged in to register.'));
      return;
    }
    setIsRegistering(true);
    setRegistrationError(null);
    setRegistrationSuccess(false);
    try {
      // NOTE: Assuming the endpoint is /api/tournaments/:id/join, not /api/debates/:id/join
      const response = await fetch(`${api.baseUrl}/api/tournaments/${id}/join`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Registration successful
      setRegistrationSuccess(true);
      // Optionally refresh tournament data or update UI state
      // For now, just show success message. A full refresh might be better.
      // fetchTournamentDetail(); // Re-fetch data to update participant list/button state
      // Or update local state if participants list is managed locally
      setTournament(prev => ({
        ...prev,
        // Assuming the backend returns the updated tournament or we add the user manually
        participants: [...(prev.participants || []), user._id] 
      }));

    } catch (error) {
      console.error('Error registering for tournament:', error);
      setRegistrationError(error.message || t('tournamentDetail.registerErrorGeneral', 'Failed to register for the tournament.'));
    } finally {
      setIsRegistering(false);
    }
  };

  // Determine if the registration button should be shown
  const canRegister = tournament?.status === 'upcoming' && user && 
                      !(tournament?.participants?.some(p => p === user._id) || 
                        tournament?.teams?.some(team => team.members?.includes(user._id))); // Check participants and team members

  // Determine if user can manage the tournament
  const isUserDataValid = user && user._id && user._id !== 'placeholder_id'; // Add check for placeholder
  const isTournamentDataValid = tournament && tournament.creator;
  const canManage = isUserDataValid && isTournamentDataValid &&
                    (user.role === 'admin' || user._id === tournament.creator._id); // CORRECT COMPARISON


  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1">
            {tournament.name}
          </Typography>
          <Chip 
            label={tournament.status ? t(`tournamentDetail.status.${tournament.status}`, tournament.status.replace('_', ' ')) : t('tournamentDetail.statusUnknown', 'Unknown')}
            color={getStatusColor(tournament.status)}
            sx={{ mt: 1 }}
          />
        </Box>
        <Box> {/* Wrap buttons in a Box for layout */}
          {/* Conditional Manage Button */}
          {/* Debugging logs for Manage Button */}
          {(() => {
            // Logging remains, but definitions are moved outside
            // Update logging
            console.log('[TournamentDetail] Checking Manage Button Visibility:');
            console.log('  User:', user ? `ID: ${user._id}, Role: ${user.role}` : 'Not loaded');
            console.log('  Tournament:', tournament ? `Creator ID: ${tournament.creator}` : 'Not loaded');
            console.log('  Is User Data Valid?:', isUserDataValid);
            console.log('  Is Tournament Data Valid?:', isTournamentDataValid);
            if (isUserDataValid && isTournamentDataValid) {
                console.log('  Comparison (user._id === tournament.creator):', user._id === tournament.creator);
            }
            console.log('  Can Manage:', canManage);
            return null; // JSX requires an element or null to be returned
          })()}
          {/* Corrected condition: Check user, tournament, tournament.creator, role, and compare IDs */}
          {canManage && (
            <Button
              variant="contained"
              color="warning" // Using warning color for visibility
              component={Link}
              to={`/tournaments/${id}/manage`} // Assuming this is the management route
              sx={{ mr: 2 }} // Add margin like other buttons
            >
              {t('tournamentDetail.manageButton', 'Manage Tournament')}
            </Button>
          )}
          {/* End Conditional Manage Button */}

          <Button
            variant="contained"
            color="secondary" // Use secondary color to differentiate
            component={Link}
            to={`/tournaments/${id}/judge-leaderboard`}
            sx={{ mr: 2 }} // Add some margin to the right
          >
            {t('tournamentDetail.judgeLeaderboardButton', 'Judge Leaderboard')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/tournaments')}
          >
            {t('tournamentDetail.backButton', 'Back to Tournaments')}
          </Button>
        </Box>
          {canRegister && (
            <Button
              variant="contained"
              color="success" // Use success color for joining
              onClick={handleRegister}
              disabled={isRegistering}
              sx={{ mr: 2 }} // Add margin if needed
            >
              {isRegistering ? <CircularProgress size={24} /> : t('tournamentDetail.registerButton', 'Join Tournament')}
            </Button>
          )}
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('tournamentDetail.descriptionLabel', 'Description')}
        </Typography>
        <Typography paragraph>
          {tournament.description}
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              {t('tournamentDetail.locationLabel', 'Location')}
            </Typography>
            <Typography>
              {tournament.location}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              {t('tournamentDetail.datesLabel', 'Dates')}
            </Typography>
            <Typography>
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        {t('tournamentDetail.teamsLabel', 'Teams')}
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
            {t('tournamentDetail.winnerLabel', 'Tournament Winner')}
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {tournament.winner.name}
          </Typography>
        </Paper>
      )}

      {/* Snackbar for notifications */}
      <Snackbar open={!!registrationError} autoHideDuration={6000} onClose={() => setRegistrationError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setRegistrationError(null)} severity="error" sx={{ width: '100%' }}>
          {registrationError}
        </Alert>
      </Snackbar>
      <Snackbar open={registrationSuccess} autoHideDuration={6000} onClose={() => setRegistrationSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setRegistrationSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {t('tournamentDetail.registerSuccess', 'Successfully registered for the tournament!')}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TournamentDetail; 