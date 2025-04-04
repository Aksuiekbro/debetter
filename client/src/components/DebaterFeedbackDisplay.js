import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const DebaterFeedbackDisplay = () => {
  const { t } = useTranslation();
  const { debateId, postingId } = useParams(); // Assuming IDs come from URL params
  const { getAuthHeaders } = useAuth();

  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/apf/feedback/${debateId}/${postingId}`, {
          headers: getAuthHeaders(),
        });
        setFeedbackData(response.data);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError(err.response?.data?.message || err.message || t('feedback.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    if (debateId && postingId) {
      fetchFeedback();
    } else {
      setError(t('feedback.missingIdsError'));
      setLoading(false);
    }
  }, [debateId, postingId, getAuthHeaders, t]);

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

  if (!feedbackData) {
    return <Alert severity="info">{t('feedback.noFeedbackFound')}</Alert>;
  }

  // Handle potential array of feedback (if multiple judges)
  const feedbackList = Array.isArray(feedbackData) ? feedbackData : [feedbackData];

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        {t('feedback.title')}
      </Typography>
      {feedbackList.map((feedbackItem, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          {feedbackList.length > 1 && (
            <Typography variant="h6" gutterBottom>
              {t('feedback.judgeFeedback', { judge: feedbackItem.judge?.username || `Judge ${index + 1}` })}
            </Typography>
          )}
          <Typography variant="body1" paragraph>
            <strong>{t('feedback.textualFeedbackLabel')}:</strong> {feedbackItem.feedback || t('feedback.noTextualFeedback')}
          </Typography>

          {feedbackItem.scores && Object.keys(feedbackItem.scores).length > 0 ? (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {t('feedback.scoresLabel')}:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 400, mt: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('feedback.criteriaHeader')}</TableCell>
                      <TableCell align="right">{t('feedback.scoreHeader')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(feedbackItem.scores).map(([criterion, score]) => (
                      <TableRow key={criterion}>
                        <TableCell component="th" scope="row">
                          {t(`feedback.criteria.${criterion}`, criterion)} {/* Attempt to translate criterion name */}
                        </TableCell>
                        <TableCell align="right">{score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Typography variant="body2">{t('feedback.noScoresProvided')}</Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};

export default DebaterFeedbackDisplay;