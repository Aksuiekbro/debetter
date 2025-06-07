import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import api from '../../utils/api'; // Assuming api client is here
import { getAuthHeaders } from '../../utils/auth'; // Assuming auth helper is here

const ParticipantStandings = () => {
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  const [standingsData, setStandingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();
        const response = await api.get(`/debates/${tournamentId}/participant-standings`, { headers });
        // Assuming the API returns the data directly in response.data
        // Add rank based on the sorted order from the backend
        const rankedData = response.data.map((participant, index) => ({
          ...participant,
          rank: index + 1,
        }));
        setStandingsData(rankedData);
      } catch (err) {
        console.error('Error fetching participant standings:', err);
        setError(t('participantStandings.fetchError', 'Failed to fetch participant standings. Please try again.'));
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchStandings();
    }
  }, [tournamentId, t]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t('participantStandings.title', 'Participant Standings')}
      </Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="participant standings table">
          <TableHead>
            <TableRow>
              <TableCell>{t('participantStandings.rank', 'Rank')}</TableCell>
              <TableCell>{t('participantStandings.name', 'Name')}</TableCell>
              <TableCell align="right">{t('participantStandings.totalScore', 'Total Score')}</TableCell>
              <TableCell align="right">{t('participantStandings.avgScore', 'Avg Score')}</TableCell>
              <TableCell align="right">{t('participantStandings.gamesPlayed', 'Games Played')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {standingsData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {t('participantStandings.noData', 'No participant standings available yet.')}
                </TableCell>
              </TableRow>
            ) : (
              standingsData.map((participant) => (
                <TableRow
                  key={participant.id || participant._id} // Use participant.id or participant._id
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {participant.rank}
                  </TableCell>
                  <TableCell>{participant.name}</TableCell>
                  <TableCell align="right">{participant.totalScore?.toFixed(2) ?? 'N/A'}</TableCell>
                  <TableCell align="right">{participant.averageScore?.toFixed(2) ?? 'N/A'}</TableCell>
                  <TableCell align="right">{participant.gamesPlayed ?? 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ParticipantStandings;