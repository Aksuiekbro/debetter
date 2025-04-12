import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  List, ListItem, ListItemText, Divider, Paper, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
// Assuming api config and auth context are correctly pathed relative to this new file location
import { api } from '../../config/api'; // Removed getAuthHeaders
// import { useAuth } from '../../contexts/AuthContext'; // No longer needed here, passed as prop

// Renamed component
const AnnouncementsFeedView = ({ currentUser, tournamentCreatorId }) => {
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  // const { user } = useAuth(); // currentUser is now passed as a prop

  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createError, setCreateError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if the current user is an organizer or admin for this tournament
  const isOrganizerOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser._id === tournamentCreatorId);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetching from the original announcements endpoint
      const response = await api.client.get(`/api/debates/${tournamentId}/announcements`);
      setAnnouncements(response.data);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      // Updated translation key
      setError(t('announcementsFeedView.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [tournamentId, t]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);
    try {
      // Headers are automatically added by the axios interceptor in api.js
      // Posting to the original announcements endpoint
      await api.client.post(`/api/debates/${tournamentId}/announcements`, {
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
      });

      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      setShowCreateForm(false); // Hide form after successful submission
      await fetchAnnouncements(); // Refetch announcements
    } catch (err) {
      console.error("Error creating announcement:", err);
      // Updated translation key
      setCreateError(err.response?.data?.message || t('announcementsFeedView.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    setCreateError(null); // Clear previous errors when toggling
  };

  // Note: No main title here as it will be handled by the container tab
  return (
    <Box sx={{ pt: 2 }}> {/* Adjusted padding */}
      {/* Removed main title Typography - will be handled by parent Tabs */}
      {/* <Typography variant="h5" gutterBottom>{t('announcementsFeedView.title')}</Typography> */}

      {isOrganizerOrAdmin && !showCreateForm && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={toggleCreateForm}
          sx={{ mb: 2 }}
        >
          {/* Updated translation key */}
          {t('announcementsFeedView.createButton')}
        </Button>
      )}

      {isOrganizerOrAdmin && showCreateForm && (
        <Paper sx={{ p: 2, mb: 3 }}>
          {/* Updated translation key */}
          <Typography variant="h6" gutterBottom>{t('announcementsFeedView.createFormTitle')}</Typography>
          <Box component="form" onSubmit={handleCreateAnnouncement} noValidate>
            <TextField
              // Updated translation key
              label={t('announcementsFeedView.formTitleLabel')}
              fullWidth
              margin="normal"
              value={newAnnouncementTitle}
              onChange={(e) => setNewAnnouncementTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <TextField
              // Updated translation key
              label={t('announcementsFeedView.formContentLabel')}
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={newAnnouncementContent}
              onChange={(e) => setNewAnnouncementContent(e.target.value)}
              required
              disabled={isSubmitting}
            />
            {createError && <Alert severity="error" sx={{ mt: 1 }}>{createError}</Alert>}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={toggleCreateForm} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || !newAnnouncementTitle || !newAnnouncementContent}
              >
                {/* Updated translation key */}
                {isSubmitting ? <CircularProgress size={24} /> : t('announcementsFeedView.submitButton')}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && announcements.length === 0 && (
        // Updated translation key
        <Typography>{t('announcementsFeedView.noAnnouncements')}</Typography>
      )}

      {!loading && !error && announcements.length > 0 && (
        <List>
          {announcements.map((announcement, index) => (
            <React.Fragment key={announcement._id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={announcement.title}
                  secondary={
                    <>
                      <Typography
                        sx={{ display: 'block' }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {announcement.content}
                      </Typography>
                      <Typography
                        sx={{ display: 'block', mt: 1 }}
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {/* Assuming author info and date are available */}
                        {/* {`Posted by ${announcement.author?.username || 'Admin'} on ${new Date(announcement.createdAt).toLocaleString()}`} */}
                         {/* Updated translation key */}
                         {`${t('announcementsFeedView.postedOn')} ${new Date(announcement.createdAt).toLocaleString()}`}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < announcements.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

// Updated export name
export default AnnouncementsFeedView;