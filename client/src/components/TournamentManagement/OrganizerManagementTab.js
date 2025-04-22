import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Autocomplete,
  TextField,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { api } from '../../config/api';
import { getAuthHeaders } from '../../utils/auth';

const OrganizerManagementTab = ({
  tournamentId,
  currentOrganizers = [], // Array of organizer User IDs
  allParticipants = [], // Array of potential organizers (combined entrants/judges)
  showNotification,
  refreshData, // To refresh tournament data after update
  currentUser // Needed to ensure creator doesn't remove themselves (optional check)
}) => {
  const { t } = useTranslation();
  const [organizerIds, setOrganizerIds] = useState(currentOrganizers);
  const [potentialOrganizers, setPotentialOrganizers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // User selected in Autocomplete
  const [loading, setLoading] = useState(false);

  // Effect to update local state when prop changes
  useEffect(() => {
    setOrganizerIds(currentOrganizers);
  }, [currentOrganizers]);

  // Effect to prepare the list of potential organizers (excluding current ones and the creator)
  useEffect(() => {
    const creatorId = currentUser?._id; // Assuming creator info is in currentUser for simplicity, might need adjustment
    const potential = allParticipants
      .filter(p => p.id && p.id !== creatorId && !organizerIds.includes(p.id)) // Exclude creator and current organizers
      .map(p => ({ id: p.id, label: `${p.name} (${p.email || 'No Email'})` })); // Format for Autocomplete
    setPotentialOrganizers(potential);
  }, [allParticipants, organizerIds, currentUser]);

  const handleAddOrganizer = () => {
    if (selectedUser && !organizerIds.includes(selectedUser.id)) {
      setOrganizerIds(prev => [...prev, selectedUser.id]);
      setSelectedUser(null); // Clear selection
    }
  };

  const handleRemoveOrganizer = (userIdToRemove) => {
    setOrganizerIds(prev => prev.filter(id => id !== userIdToRemove));
  };

  const handleSaveChanges = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${api.baseUrl}/api/debates/${tournamentId}/organizers`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizerIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update organizers');
      }

      showNotification('Organizers updated successfully', 'success');
      await refreshData(); // Refresh the main tournament data

    } catch (error) {
      console.error('Error updating organizers:', error);
      showNotification(error.message || 'Failed to update organizers', 'error');
      // Optionally revert local state on error?
      // setOrganizerIds(currentOrganizers);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, organizerIds, showNotification, refreshData]);

  // Helper to get organizer name from ID (requires allParticipants prop)
  const getOrganizerName = (userId) => {
    const participant = allParticipants.find(p => p.id === userId);
    return participant ? participant.name : 'Unknown User';
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('organizerManagement.title', 'Manage Organizers')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('organizerManagement.description', 'Add or remove users who can help manage this tournament.')}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('organizerManagement.currentOrganizers', 'Current Organizers:')}
        </Typography>
        {organizerIds.length === 0 ? (
          <Typography sx={{ fontStyle: 'italic' }}>{t('organizerManagement.noOrganizers', 'No additional organizers assigned.')}</Typography>
        ) : (
          <List dense>
            {organizerIds.map(userId => (
              <ListItem
                key={userId}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveOrganizer(userId)} color="error">
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={getOrganizerName(userId)} />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Autocomplete
          options={potentialOrganizers}
          getOptionLabel={(option) => option.label || ''}
          value={selectedUser}
          onChange={(event, newValue) => {
            setSelectedUser(newValue);
          }}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('organizerManagement.addUser', 'Add User as Organizer')}
              variant="outlined"
              size="small"
            />
          )}
          sx={{ flexGrow: 1 }}
          noOptionsText={t('organizerManagement.noUsersAvailable', 'No available users')}
        />
        <Button
          variant="contained"
          onClick={handleAddOrganizer}
          disabled={!selectedUser}
          startIcon={<AddIcon />}
        >
          {t('common.button.add', 'Add')}
        </Button>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleSaveChanges}
        disabled={loading || JSON.stringify(currentOrganizers) === JSON.stringify(organizerIds)} // Disable if no changes
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : t('common.button.saveChanges', 'Save Changes')}
      </Button>
    </Paper>
  );
};

export default OrganizerManagementTab;
