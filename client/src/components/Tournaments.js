import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Paper
} from '@mui/material';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

const Tournaments = () => {
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true); // Ensure loading is true at the start
      setError(null);
      try {
        // Fetch from the correct tournaments endpoint
        const response = await fetch(`${api.baseUrl}/api/tournaments`, {
          headers: getAuthHeaders()
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('[Tournaments] Raw data received from /api/tournaments:', JSON.stringify(data, null, 2)); // Log raw data

        // Ensure data is in the expected format (e.g., { tournaments: [...] } or just [...])
        let fetchedTournaments = [];
        if (Array.isArray(data)) {
          fetchedTournaments = data;
        } else if (data && Array.isArray(data.tournaments)) { // Adjust if API returns { tournaments: [...] }
          fetchedTournaments = data.tournaments;
        } else if (data && Array.isArray(data.data?.tournaments)) { // Adjust if API returns { data: { tournaments: [...] } }
           fetchedTournaments = data.data.tournaments;
        }

        // Map data using Debate model fields
        const tournamentsData = fetchedTournaments.map(t => ({
          ...t,
          id: t._id, // Use _id and map to id
          title: t.title || t.topic || 'Untitled Tournament', // Use title or topic from Debate model
          // Calculate participants/teams count
          participantsCount: t.participants?.length || t.teams?.length || 0 // Adjust based on Debate model structure if needed
        }));
        console.log('[Tournaments] Mapped tournamentsData:', JSON.stringify(tournamentsData, null, 2)); // Log mapped data

        setTournaments(tournamentsData);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setError(t('tournamentsList.errorLoading', 'Failed to load tournaments. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [t]); // Add t to dependency array

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
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('tournamentsList.title', 'Tournaments')}
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 3,
        mt: 3
      }}>
        {tournaments.map((tournament) => (
          <Card key={tournament.id} sx={{ p: 2 }}> {/* Use mapped tournament.id */}
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {tournament.title} {/* Use mapped title */}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {/* Display start date */}
                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'Date N/A'}
              </Typography>
              <Typography variant="body2">
                {/* Use mapped participantsCount */}
                {t('tournamentsList.participantsLabel', 'Participants/Teams: ')}{tournament.participantsCount}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                component={Link}
                to={`/tournaments/${tournament.id}/manage`}
                variant="contained"
                fullWidth
              >
                {t('tournamentsList.manageButton', 'Manage Tournament')}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Container>
  );
};

export default Tournaments;