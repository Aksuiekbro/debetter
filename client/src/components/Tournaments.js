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
      try {
        const response = await fetch(`${api.baseUrl}/api/debates`, {
          headers: getAuthHeaders()
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Filter for tournament debates and format data
        const tournaments = Array.isArray(data)
          ? data.filter(d => d.format === 'tournament')
               .map(t => ({
                 ...t,
                 id: t._id,
                 title: t.title || t.topic, // Fallback to topic if title doesn't exist
                 participants: t.participants || []
               }))
          : [];
        setTournaments(tournaments);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setError(t('tournamentsList.errorLoading', 'Failed to load tournaments. Please try again later.'));
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

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
          <Card key={tournament._id} sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {tournament.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {new Date(tournament.createdAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2">
                {t('tournamentsList.participantsLabel', 'Participants: ')}{tournament.participants?.length || 0}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                component={Link}
                to={`/tournaments/${tournament._id}/manage`}
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