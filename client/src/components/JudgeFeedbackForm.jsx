import React, { useState } from 'react';
import { Box, Typography, Rating, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { api } from '../config/api'; // Corrected path and imports, removed getAuthHeaders

const JudgeFeedbackForm = ({ postingId, judgeId, judgeName, onSubmitSuccess }) => {
  const { t } = useTranslation();
  const [ratings, setRatings] = useState({
    clarity: 0,
    fairness: 0,
    knowledge: 0,
  });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRatingChange = (criterion, newValue) => {
    setRatings(prev => ({ ...prev, [criterion]: newValue }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const payload = {
      criteriaRatings: ratings,
      comment: comment,
    };

    try {
      // Headers are automatically added by the axios interceptor in api.js
      await api.client.post(`/api/postings/${postingId}/judge-feedback/${judgeId}`, payload);
      setSuccess(true);
      setLoading(false);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      // Optionally reset form or close modal here
      setRatings({ clarity: 0, fairness: 0, knowledge: 0 });
      setComment('');
    } catch (err) {
      console.error("Error submitting judge feedback:", err);
      setError(err.response?.data?.message || t('judgeFeedbackForm.submitErrorDefault'));
      setLoading(false);
    }
  };

  if (success) {
    return <Alert severity="success">{t('judgeFeedbackForm.submitSuccess')}</Alert>;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('judgeFeedbackForm.title', { judgeName })}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 2 }}>
        <Typography component="legend">{t('judgeFeedbackForm.clarity')}</Typography>
        <Rating
          name="clarity"
          value={ratings.clarity}
          onChange={(event, newValue) => {
            handleRatingChange('clarity', newValue);
          }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography component="legend">{t('judgeFeedbackForm.fairness')}</Typography>
        <Rating
          name="fairness"
          value={ratings.fairness}
          onChange={(event, newValue) => {
            handleRatingChange('fairness', newValue);
          }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography component="legend">{t('judgeFeedbackForm.knowledge')}</Typography>
        <Rating
          name="knowledge"
          value={ratings.knowledge}
          onChange={(event, newValue) => {
            handleRatingChange('knowledge', newValue);
          }}
        />
      </Box>

      <TextField
        label={t('judgeFeedbackForm.comments')}
        multiline
        rows={4}
        fullWidth
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        margin="normal"
      />

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : t('judgeFeedbackForm.submitButton')}
      </Button>
    </Box>
  );
};

export default JudgeFeedbackForm;