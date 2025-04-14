import { useState, useCallback, useEffect } from 'react';
import axios from 'axios'; // Import axios for API calls
import { useAuth } from '../contexts/AuthContext'; // To get user token
import { useParams } from 'react-router-dom'; // To get tournamentId

// Manages state and logic for adding/deleting tournament participants (entrants)
export const useEntrantManagement = (refreshData, showNotification) => {
  const { tournamentId } = useParams(); // Get tournamentId from URL
  const { user } = useAuth(); // Get user for token
  const [openEntrantDialog, setOpenEntrantDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [entrantForm, setEntrantForm] = useState({ userId: '', role: 'Debater' }); // Updated form state

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null); // Store userId for deletion
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [availableUsers, setAvailableUsers] = useState([]); // State for users list

  const handleOpenEntrantDialog = useCallback((editMode = false, entrant = null) => {
    setIsEditing(editMode);
    // Editing is not part of this task scope, focusing on Add/Delete
    // if (editMode && entrant) {
    //   setEntrantForm({ userId: entrant.userId, role: entrant.tournamentRole }); // Adjust based on actual entrant object structure
    //   setEditId(entrant.userId);
    // } else {
      setEntrantForm({ userId: '', role: 'Debater' }); // Reset for adding
      setEditId(null);
    // }
    setOpenEntrantDialog(true);
  }, []);

  const handleCloseEntrantDialog = useCallback(() => {
    setOpenEntrantDialog(false);
    // Reset form and editing state on close
    setIsEditing(false);
    setEditId(null);
    setEntrantForm({ userId: '', role: 'Debater' }); // Reset form
  }, []);

  // Specific handler for Autocomplete or direct input changes
  const handleEntrantFormChange = useCallback((name, value) => {
    setEntrantForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Fetch users who can be added (e.g., not already participants)
  // This is a placeholder - the actual API endpoint might need refinement
  const fetchAvailableUsers = useCallback(async () => {
    if (!user?.token) return; // Need token
    setLoading(true);
    try {
      // TODO: Ideally, this endpoint should exclude users already in the tournament
      const response = await axios.get('/api/users', { // Assuming a general user list endpoint
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setAvailableUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('Failed to fetch users list', 'error');
      setAvailableUsers([]); // Clear on error
    } finally {
      setLoading(false);
    }
  }, [user?.token, showNotification]);

  // Fetch users when the dialog opens
  useEffect(() => {
    if (openEntrantDialog) {
      fetchAvailableUsers();
    }
  }, [openEntrantDialog, fetchAvailableUsers]);

  const handleSubmitEntrant = useCallback(async () => {
    if (!entrantForm.userId || !entrantForm.role) {
      showNotification('Please select a user and a role.', 'warning');
      return;
    }
    if (!user?.token || !tournamentId) {
      showNotification('Authentication error or missing tournament ID.', 'error');
      return;
    }

    setLoading(true);
    try {
      // API Call to add participant
      await axios.post(
        `/api/debates/${tournamentId}/participants`,
        { userId: entrantForm.userId, role: entrantForm.role },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      showNotification('Participant added successfully', 'success');
      handleCloseEntrantDialog();
      refreshData(); // Refresh the tournament data to show the new participant
    } catch (error) {
      console.error('Error adding participant:', error);
      const errorMsg = error.response?.data?.message || 'Failed to add participant';
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [entrantForm, tournamentId, user?.token, showNotification, handleCloseEntrantDialog, refreshData]);

  // Renamed id to userId for clarity
  const handleDeleteEntrant = useCallback((userId) => {
    setDeleteUserId(userId); // Store the userId to delete
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
    setDeleteUserId(null);
  }, []);

  const confirmDeleteEntrant = useCallback(async () => {
    if (!deleteUserId || !user?.token || !tournamentId) {
       showNotification('Cannot delete participant: Missing ID or authentication.', 'error');
       return;
    }
    setLoading(true);
    try {
      // API Call to delete participant
      await axios.delete(
        `/api/debates/${tournamentId}/participants/${deleteUserId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      showNotification('Participant deleted successfully', 'success');
      handleCloseDeleteDialog();
      refreshData(); // Refresh the tournament data
    } catch (error) {
      console.error('Error deleting participant:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete participant';
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [deleteUserId, tournamentId, user?.token, showNotification, handleCloseDeleteDialog, refreshData]);

  return {
    loading,                  // Expose loading state
    openEntrantDialog,
    isEditingEntrant: isEditing,
    entrantForm,
    availableUsers,           // Expose users list for dialog
    handleOpenEntrantDialog,
    handleCloseEntrantDialog,
    handleEntrantFormChange,
    handleSubmitEntrant,
    handleDeleteEntrant,
    openDeleteDialog,
    handleCloseDeleteDialog,
    confirmDeleteEntrant,
  };
};