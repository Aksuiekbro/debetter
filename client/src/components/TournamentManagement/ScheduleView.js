import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, CircularProgress, Alert,
  List, ListItem, ListItemText, Divider, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '../../config/api'; // Removed getAuthHeaders
// import { useAuth } from '../../contexts/AuthContext'; // Passed as prop

const ScheduleView = ({ currentUser, tournamentCreatorId }) => {
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  // const { user } = useAuth(); // Passed as prop

  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editItem, setEditItem] = useState(null); // Item being edited/created
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState(null);

  // Determine if the current user is an organizer or admin for this tournament
  const isOrganizerOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser._id === tournamentCreatorId);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!tournamentId) {
      // Don't fetch if tournamentId is not yet available
      setError(t('scheduleView.missingIdError')); // Optional: Provide specific feedback
      setLoading(false);
      return;
    }
    try {
      const response = await api.client.get(`/api/debates/${tournamentId}/schedule`);
      setScheduleItems(response.data || []); // Ensure it's an array
    } catch (err) {
      console.error("Error fetching schedule:", err);
      setError(t('scheduleView.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [tournamentId, t]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleOpenDialog = (item = null) => {
    setEditItem(item ? { ...item } : { time: '', event: '', location: '' }); // Reset or load item
    setIsDialogOpen(true);
    setDialogError(null);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setIsDialogOpen(false);
    setEditItem(null);
  };

  const handleDialogChange = (e) => {
    const { name, value } = e.target;
    setEditItem(prev => ({ ...prev, [name]: value }));
  };

  const handleDialogSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setDialogError(null);
    // Headers are automatically added by the axios interceptor in api.js
    const url = editItem?._id
      ? `/api/debates/${tournamentId}/schedule/${editItem._id}`
      : `/api/debates/${tournamentId}/schedule`;
    const method = editItem?._id ? 'put' : 'post';

    try {
      await api.client[method](url, editItem); // Use api.client
      handleCloseDialog();
      await fetchSchedule(); // Refresh list
    } catch (err) {
      console.error(`Error ${editItem?._id ? 'updating' : 'creating'} schedule item:`, err);
      setDialogError(err.response?.data?.message || t(`scheduleView.${editItem?._id ? 'updateError' : 'createError'}`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm(t('scheduleView.confirmDelete'))) return;
    setIsSubmitting(true); // Use submitting state to disable buttons during delete
    setError(null); // Clear main error
    // Headers are automatically added by the axios interceptor in api.js
    try {
      await api.client.delete(`/api/debates/${tournamentId}/schedule/${itemId}`); // Use api.client
      await fetchSchedule(); // Refresh list
    } catch (err) {
      console.error("Error deleting schedule item:", err);
      // Show error temporarily, maybe using a snackbar in a real app
      setError(err.response?.data?.message || t('scheduleView.deleteError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t('scheduleView.title')}</Typography>

      {isOrganizerOrAdmin && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ mb: 2 }}
          disabled={isSubmitting}
        >
          {t('scheduleView.addItemButton')}
        </Button>
      )}

      {loading && <CircularProgress />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && scheduleItems.length === 0 && (
        <Typography>{t('scheduleView.noItems')}</Typography>
      )}

      {!loading && !error && scheduleItems.length > 0 && (
        <List component={Paper} sx={{ mb: 2 }}>
          {scheduleItems.map((item, index) => (
            <React.Fragment key={item._id}>
              <ListItem
                secondaryAction={
                  isOrganizerOrAdmin ? (
                    <>
                      <IconButton edge="end" aria-label="edit" onClick={() => handleOpenDialog(item)} disabled={isSubmitting}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteItem(item._id)} disabled={isSubmitting} sx={{ ml: 1 }}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  ) : null
                }
              >
                <ListItemText
                  primary={`${item.time} - ${item.event}`}
                  secondary={item.location || t('scheduleView.noLocation')}
                />
              </ListItem>
              {index < scheduleItems.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editItem?._id ? t('scheduleView.editDialogTitle') : t('scheduleView.createDialogTitle')}</DialogTitle>
        <Box component="form" onSubmit={handleDialogSubmit}>
          <DialogContent>
            {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
            <TextField
              autoFocus
              margin="dense"
              name="time"
              label={t('scheduleView.formTimeLabel')}
              type="text" // Consider using TimePicker or specific format instructions
              fullWidth
              variant="outlined"
              value={editItem?.time || ''}
              onChange={handleDialogChange}
              required
              disabled={isSubmitting}
            />
            <TextField
              margin="dense"
              name="event"
              label={t('scheduleView.formEventLabel')}
              type="text"
              fullWidth
              variant="outlined"
              value={editItem?.event || ''}
              onChange={handleDialogChange}
              required
              disabled={isSubmitting}
            />
            <TextField
              margin="dense"
              name="location"
              label={t('scheduleView.formLocationLabel')}
              type="text"
              fullWidth
              variant="outlined"
              value={editItem?.location || ''}
              onChange={handleDialogChange}
              disabled={isSubmitting}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isSubmitting}>{t('common.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting || !editItem?.time || !editItem?.event}>
              {isSubmitting ? <CircularProgress size={24} /> : (editItem?._id ? t('common.save') : t('common.create'))}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ScheduleView;