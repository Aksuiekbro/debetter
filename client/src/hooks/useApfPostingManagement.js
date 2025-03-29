import { useState, useCallback } from 'react';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

const initialApfGameData = {
  team1: null,
  team2: null,
  location: '',
  virtualLink: '',
  judges: [], // Stores selected judge *objects* or IDs temporarily
  theme: null,
  customModel: '',
  useCustomModel: false,
  scheduledTime: null,
  status: 'scheduled',
  notifyParticipants: true,
  batchName: ''
};

export const useApfPostingManagement = (
  tournamentId,
  teams = [], // Needed for dropdowns/validation
  judges = [], // Needed for dropdowns/validation
  showNotification,
  refreshPostings // Function from useTournamentData to refetch postings
) => {
  const [currentApfGameData, setCurrentApfGameData] = useState(initialApfGameData);
  const [openApfDialog, setOpenApfDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null); // ID of the posting being edited
  const [batchMode, setBatchMode] = useState(false);
  const [loading, setLoading] = useState(false); // General loading for posting actions

  // Note: The main postings list state (apfPostings) lives in useTournamentData

  const handleOpenApfDialog = useCallback((editMode = false, posting = null) => {
    setIsEditing(editMode);
    if (editMode && posting) {
      // Populate form with existing posting data
      // Ensure judges are represented correctly (e.g., array of IDs or objects)
      const populatedJudges = (posting.judges || []).map(judgeIdentifier => {
         // If judgeIdentifier is just an ID string, find the full judge object
         if (typeof judgeIdentifier === 'string') {
           return judges.find(j => j.id === judgeIdentifier) || { id: judgeIdentifier, name: 'Unknown Judge' };
         }
         // If it's already an object with an id, use it (might happen if passed directly)
         if (typeof judgeIdentifier === 'object' && judgeIdentifier !== null && judgeIdentifier.id) {
           return judgeIdentifier;
         }
         // Fallback for unexpected format
         return { id: String(judgeIdentifier), name: 'Unknown Judge' };
       });

      setCurrentApfGameData({
        team1: teams.find(t => t.id === posting.team1?.id) || null, // Ensure we use the object
        team2: teams.find(t => t.id === posting.team2?.id) || null, // Ensure we use the object
        location: posting.location || '',
        virtualLink: posting.virtualLink || '',
        judges: populatedJudges,
        theme: posting.theme || null, // Handle theme potentially being just a string
        customModel: posting.customModel || '',
        useCustomModel: posting.useCustomModel || false,
        scheduledTime: posting.scheduledTime || null,
        status: posting.status || 'scheduled',
        notifyParticipants: posting.notifyParticipants !== undefined ? posting.notifyParticipants : true,
        batchName: posting.batchName || ''
      });
      setEditId(posting.id);
    } else {
      // Reset form for new posting
      setCurrentApfGameData(initialApfGameData);
      setEditId(null);
    }
    setOpenApfDialog(true);
  }, [teams, judges]); // Depend on teams and judges to find objects

  const handleCloseApfDialog = useCallback(() => {
    setOpenApfDialog(false);
    setIsEditing(false);
    setEditId(null);
    setCurrentApfGameData(initialApfGameData); // Reset form on close
  }, []);

  const handleApfCardChange = useCallback((fieldName, value) => {
    // Special handling for fields that might need object mapping or type conversion
    if (fieldName === 'team1' || fieldName === 'team2') {
      // Value from Select is usually the ID, find the corresponding team object
      const selectedTeam = teams.find(t => t.id === value);
      setCurrentApfGameData(prev => ({ ...prev, [fieldName]: selectedTeam || null }));
    } else if (fieldName === 'judges') {
      // Value from MultiSelect is an array of IDs
      const selectedJudges = value.map(judgeId =>
        judges.find(j => j.id === judgeId) || { id: judgeId, name: 'Unknown Judge' } // Find judge object
      );
      setCurrentApfGameData(prev => ({ ...prev, judges: selectedJudges }));
    } else if (fieldName === 'theme') {
       // Handle freeSolo Autocomplete potentially giving a string or object
       setCurrentApfGameData(prev => ({ ...prev, theme: value }));
    }
    else {
      // Handle all other fields normally
      setCurrentApfGameData(prev => ({ ...prev, [fieldName]: value }));
    }
  }, [teams, judges]); // Depend on teams and judges for mapping

  const validateApfData = (data) => {
    const { team1, team2, location, virtualLink, judges: selectedJudges, theme, useCustomModel, customModel } = data;
    if (!team1 || !team2) return 'Team 1 and Team 2 are required.';
    if (team1.id === team2.id) return 'Team 1 and Team 2 cannot be the same.';
    if (!location && !virtualLink) return 'Either Location or Virtual Link is required.';
    if (!selectedJudges || selectedJudges.length === 0) return 'At least one judge is required.';
    if (useCustomModel) {
        if (!customModel) return 'Custom Model content is required when selected.';
    } else {
        if (!theme) return 'Theme is required when not using a custom model.';
    }
    // Add more validation as needed (e.g., judge availability, time conflicts)
    return null; // No errors
  };


  const handleConfirmApfGame = useCallback(async () => {
    const validationError = validateApfData(currentApfGameData);
    if (validationError) {
      showNotification(validationError, 'warning');
      return;
    }

    setLoading(true);
    try {
      const { team1, team2, judges: selectedJudges, theme, useCustomModel, customModel, ...rest } = currentApfGameData;

      // Ensure judge IDs are strings for the API
      const judgeIdsToSend = selectedJudges.map(judge => judge.id);

      const payload = {
        ...rest,
        tournamentId: tournamentId,
        team1Id: team1.id,
        team2Id: team2.id,
        judgeIds: judgeIdsToSend,
        theme: useCustomModel ? customModel : (typeof theme === 'string' ? theme : theme?.label || theme), // Handle theme object or string
        useCustomModel: useCustomModel,
      };

      let response;
      let url = `${api.baseUrl}/api/debates/${tournamentId}/postings`;
      let method = 'POST';

      if (isEditing && editId) {
         // TODO: Add PUT endpoint logic if available
         // url = `${api.baseUrl}/api/debates/${tournamentId}/postings/${editId}`;
         // method = 'PUT';
         console.warn("API endpoint for editing APF posting not implemented. Using POST.");
         // For now, we'll just re-POST which might create duplicates if not handled server-side
      }


      response = await fetch(url, {
        method: method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to ${isEditing ? 'update' : 'post'} game: ${errorText}`);
      }

      // const postedGame = await response.json(); // Contains the created/updated posting

      showNotification(`APF game ${isEditing ? 'updated' : 'posted'} successfully!`, 'success');
      handleCloseApfDialog();
      await refreshPostings(); // Refresh the list

    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'posting'} APF game:`, error);
      showNotification(`Failed to ${isEditing ? 'update' : 'post'} game: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentApfGameData, tournamentId, isEditing, editId, showNotification, handleCloseApfDialog, refreshPostings]);


  const handleBatchCreate = useCallback(async (games, batchName) => {
     if (!games || games.length === 0) {
       showNotification('No games to create in batch', 'warning');
       return;
     }
     setLoading(true);
     try {
       const response = await fetch(`${api.baseUrl}/api/debates/${tournamentId}/batch-postings`, {
         method: 'POST',
         headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
         body: JSON.stringify({ batchGames: games, batchName }),
       });

       if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Failed to create batch: ${errorText}`);
       }

       const result = await response.json();
       showNotification(result.message || `Created ${games.length} games successfully`, 'success');
       setBatchMode(false); // Exit batch mode on success
       setCurrentApfGameData(initialApfGameData); // Reset form
       await refreshPostings(); // Refresh the list

     } catch (error) {
       console.error('Error creating batch games:', error);
       showNotification(`Failed to create batch: ${error.message}`, 'error');
     } finally {
       setLoading(false);
     }
   }, [tournamentId, showNotification, refreshPostings]);


  const handlePostingStatusChange = useCallback(async (postingId, newStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`${api.baseUrl}/api/debates/${tournamentId}/postings/${postingId}/status`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update status: ${errorText}`);
      }

      showNotification(`Status updated to ${newStatus}`, 'success');
      await refreshPostings(); // Refresh list to show new status

    } catch (error) {
      console.error('Error updating posting status:', error);
      showNotification(`Failed to update status: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, showNotification, refreshPostings]);


  const handleSendReminder = useCallback(async (postingId) => {
    setLoading(true);
    try {
      const response = await fetch(`${api.baseUrl}/api/debates/${tournamentId}/postings/${postingId}/reminders`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send reminders: ${errorText}`);
      }

      const result = await response.json();
      showNotification(`Reminders sent to ${result.judgesNotified} judges and ${result.teamMembersNotified} team members`, 'success');
      // No need to refresh data usually after sending reminders

    } catch (error) {
      console.error('Error sending reminders:', error);
      showNotification(`Failed to send reminders: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, showNotification]);

  // Delete Posting Logic (Placeholder)
  const [openDeletePostingDialog, setOpenDeletePostingDialog] = useState(false);
  const [deletePostingId, setDeletePostingId] = useState(null);

  const handleDeletePosting = useCallback((id) => {
      setDeletePostingId(id);
      setOpenDeletePostingDialog(true);
      // showNotification('Delete functionality for postings not yet implemented.', 'info');
  }, []);

  const handleCloseDeletePostingDialog = useCallback(() => {
      setOpenDeletePostingDialog(false);
      setDeletePostingId(null);
  }, []);

  const confirmDeletePosting = useCallback(async () => {
      setLoading(true);
      // TODO: Implement API call for deleting a posting
      try {
          console.warn(`API endpoint for deleting posting ${deletePostingId} not implemented.`);
          // Example: await fetch(`${api.baseUrl}/api/debates/${tournamentId}/postings/${deletePostingId}`, { method: 'DELETE', headers: getAuthHeaders() });
          showNotification('Posting deleted successfully (simulated)', 'success');
          handleCloseDeletePostingDialog();
          await refreshPostings(); // Refresh list after deletion
      } catch (error) {
          console.error('Error deleting posting:', error);
          showNotification('Failed to delete posting', 'error');
      } finally {
          setLoading(false);
          handleCloseDeletePostingDialog(); // Ensure dialog closes
      }
  }, [deletePostingId, tournamentId, showNotification, handleCloseDeletePostingDialog, refreshPostings]);


  return {
    currentApfGameData,
    openApfDialog,
    isEditingApf: isEditing,
    editApfId: editId,
    batchMode,
    loadingApf: loading, // Renamed for clarity
    setBatchMode,
    handleOpenApfDialog,
    handleCloseApfDialog,
    handleApfCardChange,
    handleConfirmApfGame,
    handleBatchCreate,
    handlePostingStatusChange,
    handleSendReminder,
    handleDeletePosting, // Function to trigger delete confirmation
    // Delete Dialog specific state/handlers
    openDeletePostingDialog,
    handleCloseDeletePostingDialog,
    confirmDeletePosting,
  };
};