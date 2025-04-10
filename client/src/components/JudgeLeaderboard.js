import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Alert,
  Paper,
  Box
} from '@mui/material';
import { api } from '../config/api'; // Assuming api client is here
import { getAuthHeaders } from '../utils/auth'; // Assuming auth helper is here

const JudgeLeaderboard = () => {
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          throw new Error(t('judgeLeaderboard.errorAuth'));
        }
        const response = await api.get(`/debates/${tournamentId}/judges/leaderboard`, { headers });
        setLeaderboardData(response.data);
      } catch (err) {
        console.error("Error fetching judge leaderboard:", err);
        setError(err.response?.data?.message || err.message || t('judgeLeaderboard.errorFetch'));
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchLeaderboard();
    } else {
      setError(t('judgeLeaderboard.errorNoId'));
      setLoading(false);
    }
  }, [tournamentId, t]); // Added t to dependency array

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {t('judgeLeaderboard.title')}
        </Typography>
        {loading && (
          <Box display="flex" justifyContent="center" sx={{ my: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}
        {!loading && !error && leaderboardData.length === 0 && (
           <Typography align="center" sx={{ my: 2 }}>{t('judgeLeaderboard.noData')}</Typography>
        )}
        {!loading && !error && leaderboardData.length > 0 && (
          <List>
            {leaderboardData.map((judge, index) => (
              <ListItem key={judge.id || index} divider>
                <ListItemAvatar>
                  {/* Display rank number */}
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {index + 1}
                  </Avatar>
                  {/* Optionally display photo if available and preferred */}
                  {/* <Avatar alt={judge.name} src={judge.photo || undefined} sx={{ bgcolor: 'secondary.main' }}>
                    {!judge.photo ? judge.name.charAt(0) : null}
                  </Avatar> */}
                </ListItemAvatar>
                <ListItemText
                  primary={judge.name}
                  secondary={`${t('judgeLeaderboard.rankLabel')}: ${judge.judgeRole || t('judgeLeaderboard.rankUnknown')}`} // Using judgeRole as rank
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default JudgeLeaderboard;