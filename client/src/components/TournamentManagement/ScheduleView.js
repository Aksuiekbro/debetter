import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, CircularProgress, Alert,
  List, ListItem, ListItemText, Divider, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '../../config/api'; // Removed getAuthHeaders
// import { useAuth } from '../../contexts/AuthContext'; // Passed as prop

const ScheduleView = ({ currentUser, tournamentCreatorId, tournament }) => { // Added tournament prop
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  // const { user } = useAuth(); // Passed as prop

  const [scheduleItems, setScheduleItems] = useState([]);
  const [pairings, setPairings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editItem, setEditItem] = useState(null); // Item being edited/created
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState(null);

  // Determine if the current user is an organizer or admin for this tournament
  // Temporarily set to true for testing
  const isOrganizerOrAdmin = true;

  console.log('ScheduleView props:', { currentUser, tournamentCreatorId, tournament });

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
      // Fetch schedule items
      const scheduleResponse = await api.client.get(`/api/debates/${tournamentId}/schedule`);
      setScheduleItems(scheduleResponse.data || []); // Ensure it's an array

      // Fetch published pairings
      const pairingsResponse = await api.client.get(`/api/debates/${tournamentId}/pairings`, {
        params: { published: 'true' }
      });
      setPairings(pairingsResponse.data.data.pairings || []);
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

      {!loading && !error && scheduleItems.length === 0 && pairings.length === 0 && (
        <Typography>{t('scheduleView.noItems')}</Typography>
      )}

      {/* Display published pairings */}
      {!loading && !error && pairings.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('scheduleView.pairingsTitle', { defaultValue: 'Tournament Pairings' })}
          </Typography>

          {/* Group pairings by round and roundType */}
          {Object.entries(pairings.reduce((acc, pairing) => {
            const key = `${pairing.roundType}-${pairing.round}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(pairing);
            return acc;
          }, {})).map(([key, roundPairings]) => {
            const [roundType, round] = key.split('-');
            const roundName = roundType === 'preliminary'
              ? `${t('scheduleView.preliminaryRound', { defaultValue: 'Preliminary Round' })} ${round}`
              : (round === '1' ? t('scheduleView.eighthFinals', { defaultValue: '1/8 Finals' }) :
                 round === '2' ? t('scheduleView.quarterFinals', { defaultValue: 'Quarter Finals' }) :
                 round === '3' ? t('scheduleView.semiFinals', { defaultValue: 'Semi Finals' }) :
                 round === '4' ? t('scheduleView.finals', { defaultValue: 'Finals' }) :
                 `${t('scheduleView.playoffRound', { defaultValue: 'Playoff Round' })} ${round}`);

            return (
              <Paper key={key} sx={{ mb: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {roundName}
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('scheduleView.team1', { defaultValue: 'Team 1' })}</TableCell>
                        <TableCell>{t('scheduleView.team2', { defaultValue: 'Team 2' })}</TableCell>
                        <TableCell>{t('scheduleView.judge', { defaultValue: 'Judge' })}</TableCell>
                        <TableCell>{t('scheduleView.room', { defaultValue: 'Room' })}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roundPairings.map(pairing => (
                        <TableRow key={pairing._id}>
                          <TableCell>{pairing.team1?.name || t('scheduleView.unknown', { defaultValue: 'Unknown' })}</TableCell>
                          <TableCell>
                            {pairing.isBye
                              ? t('scheduleView.bye', { defaultValue: 'BYE' })
                              : pairing.team2?.name || t('scheduleView.unknown', { defaultValue: 'Unknown' })}
                          </TableCell>
                          <TableCell>
                            {pairing.judges?.length > 0
                              ? pairing.judges[0]?.username || pairing.judges[0]?.name || t('scheduleView.unknown', { defaultValue: 'Unknown' })
                              : t('scheduleView.noJudge', { defaultValue: 'No Judge' })}
                          </TableCell>
                          <TableCell>{pairing.location || t('scheduleView.noRoom', { defaultValue: 'No Room' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Display regular schedule items */}
      {!loading && !error && scheduleItems.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('scheduleView.scheduleTitle', { defaultValue: 'Schedule' })}
          </Typography>

          <List component={Paper}>
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
                    primary={`${new Date(item.time).toLocaleString()} - ${item.eventDescription || item.event}`}
                    secondary={item.location || t('scheduleView.noLocation')}
                  />
                </ListItem>
                {index < scheduleItems.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
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