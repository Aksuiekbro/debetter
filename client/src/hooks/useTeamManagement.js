import { useState, useCallback } from 'react';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

export const useTeamManagement = (
  tournamentId,
  initialTeams = [],
  setTeams, // Direct setter from useTournamentData
  entrants = [], // Needed for dialog dropdowns
  showNotification,
  refreshData // Function to refetch all tournament data
) => {
  const [openTeamDialog, setOpenTeamDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', leader: '', speaker: '' });

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const [loadingTeams, setLoadingTeams] = useState(false); // Loading state for team operations

  const handleOpenTeamDialog = useCallback((editMode = false, team = null) => {
    setIsEditing(editMode);
    if (editMode && team) {
      // Ensure we use IDs for the form state if available
      setTeamForm({ name: team.name, leader: team.leaderId || '', speaker: team.speakerId || '' });
      setEditId(team.id);
    } else {
      setTeamForm({ name: '', leader: '', speaker: '' });
      setEditId(null);
    }
    setOpenTeamDialog(true);
  }, []);

  const handleCloseTeamDialog = useCallback(() => {
    setOpenTeamDialog(false);
    setIsEditing(false);
    setEditId(null);
    setTeamForm({ name: '', leader: '', speaker: '' });
  }, []);

  const handleTeamFormChange = useCallback((e) => {
    setTeamForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmitTeam = useCallback(async () => {
    setLoadingTeams(true);
    try {
      const payload = {
        tournamentId: tournamentId,
        name: teamForm.name,
        leader: teamForm.leader, // Send IDs
        speaker: teamForm.speaker, // Send IDs
      };

      let response;
      if (isEditing) {
        // Edit existing team
        response = await fetch(`${api.baseUrl}/api/debates/teams/${editId}`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Add new team
        response = await fetch(`${api.baseUrl}/api/debates/teams`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} team`);
      }

      showNotification(`Team ${isEditing ? 'updated' : 'added'} successfully`, 'success');
      handleCloseTeamDialog();
      await refreshData(); // Refresh all data to get the latest state

    } catch (error) {
      console.error('Error submitting team:', error);
      showNotification(error.message || 'Failed to save team', 'error');
    } finally {
      setLoadingTeams(false);
    }
  }, [isEditing, editId, teamForm, tournamentId, showNotification, handleCloseTeamDialog, refreshData]);

  const handleDeleteTeam = useCallback((id) => {
    setDeleteItemId(id);
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
    setDeleteItemId(null);
  }, []);

  const confirmDeleteTeam = useCallback(async () => {
    setLoadingTeams(true);
    // TODO: Implement API call for deleting a team if endpoint exists
    // For now, simulate local deletion and show notification
    try {
      // Example: await fetch(`${api.baseUrl}/api/debates/teams/${deleteItemId}`, { method: 'DELETE', headers: getAuthHeaders() });
      // console.warn("API endpoint for team deletion not implemented. Simulating local deletion."); // Removed dev note

      // Optimistic update (remove locally) - remove if API call is added
      setTeams(prevTeams => prevTeams.filter(t => t.id !== deleteItemId));

      showNotification('Team deleted successfully (simulated)', 'success');
      handleCloseDeleteDialog();
      // await refreshData(); // Uncomment if API call is added

    } catch (error) {
      console.error('Error deleting team:', error);
      showNotification('Failed to delete team', 'error');
    } finally {
      setLoadingTeams(false);
      handleCloseDeleteDialog(); // Ensure dialog closes even on error
    }
  }, [deleteItemId, showNotification, handleCloseDeleteDialog, setTeams /* remove setTeams if API call added */]);

  const randomizeTeams = useCallback(async () => {
    setLoadingTeams(true);
    try {
      // Filter out judges from entrants
      const debaters = entrants.filter(entrant => entrant.role !== 'judge');
      if (debaters.length < 2) {
        throw new Error('Need at least 2 debaters to form teams');
      }

      // Prepare team data based on shuffled debaters
      const shuffledDebaters = [...debaters].sort(() => Math.random() - 0.5);
      const teamDataForDb = [];
      for (let i = 0; i < Math.floor(shuffledDebaters.length / 2); i++) {
        const debater1 = shuffledDebaters[i * 2];
        const debater2 = shuffledDebaters[i * 2 + 1];
        teamDataForDb.push({
          name: `Team ${i + 1}`, // Server might override name
          leader: debater1.id,
          speaker: debater2.id,
        });
      }

      const response = await fetch(`${api.baseUrl}/api/debates/${tournamentId}/randomize-teams`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: teamDataForDb }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save randomized teams: ${errorText}`);
      }

      showNotification('Teams randomized successfully!', 'success');
      await refreshData(); // Refresh data to get server-generated teams

      // Handle odd number notification (optional, could be done in UI)
      if (shuffledDebaters.length % 2 !== 0) {
         showNotification(`Note: One debater (${shuffledDebaters[shuffledDebaters.length-1].name}) was left without a team.`, 'info');
      }

    } catch (error) {
      console.error('Error randomizing teams:', error);
      showNotification(error.message || 'Failed to randomize teams', 'error');
    } finally {
      setLoadingTeams(false);
    }
  }, [tournamentId, entrants, showNotification, refreshData]);


  return {
    openTeamDialog,
    isEditingTeam: isEditing,
    editTeamId: editId,
    teamForm,
    loadingTeams,
    handleOpenTeamDialog,
    handleCloseTeamDialog,
    handleTeamFormChange,
    handleSubmitTeam,
    handleDeleteTeam,
    randomizeTeams,
    // Delete dialog state and handlers
    openDeleteDialog,
    handleCloseDeleteDialog,
    confirmDeleteTeam,
  };
};