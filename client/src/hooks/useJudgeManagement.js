import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export const useJudgeManagement = (initialJudges = [], setJudges, showNotification, refreshData) => {
  const { tournamentId } = useParams();
  const { user } = useAuth();
  const [openJudgeDialog, setOpenJudgeDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [judgeForm, setJudgeForm] = useState({
    name: '',
    email: '',
    club: '',
    judgeStatus: '',
    judgeRank: 'Novice',
    yearsExperience: 0,
    courseLevel: '',
    isPresent: false
  });

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const handleOpenJudgeDialog = useCallback((editMode = false, judge = null) => {
    setIsEditing(editMode);
    if (editMode && judge) {
      setJudgeForm({
        name: judge.name,
        email: judge.email,
        club: judge.club || '',
        judgeStatus: judge.judgeStatus || '',
        judgeRank: judge.judgeRank || 'Novice',
        yearsExperience: judge.yearsExperience || 0,
        courseLevel: judge.courseLevel || '',
        isPresent: judge.isPresent || false
      });
      setEditId(judge.id);
    } else {
      setJudgeForm({
        name: '',
        email: '',
        club: '',
        judgeStatus: '',
        judgeRank: 'Novice',
        yearsExperience: 0,
        courseLevel: '',
        isPresent: false
      });
      setEditId(null);
    }
    setOpenJudgeDialog(true);
  }, []);

  const handleCloseJudgeDialog = useCallback(() => {
    setOpenJudgeDialog(false);
    setIsEditing(false);
    setEditId(null);
    setJudgeForm({
      name: '',
      email: '',
      club: '',
      judgeStatus: '',
      judgeRank: 'Novice',
      yearsExperience: 0,
      courseLevel: '',
      isPresent: false
    });
  }, []);

  const handleJudgeFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setJudgeForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmitJudge = useCallback(async () => {
    if (!user?.token || !tournamentId) {
      showNotification('Authentication error or missing tournament ID.', 'error');
      return;
    }

    try {
      if (isEditing) {
        // Edit existing judge via API
        await api.client.put(
          `/api/debates/${tournamentId}/judges/${editId}`,
          judgeForm,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        showNotification('Judge updated successfully', 'success');
      } else {
        // Add new judge via API
        await api.client.post(
          `/api/debates/${tournamentId}/judges`,
          judgeForm,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        showNotification('Judge added successfully', 'success');
      }

      // Close the dialog and refresh the data
      handleCloseJudgeDialog();
      refreshData(); // Refresh the tournament data to show the updated judges list
    } catch (error) {
      console.error('Error submitting judge:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save judge';
      showNotification(errorMsg, 'error');
    }
  }, [isEditing, editId, judgeForm, tournamentId, user?.token, showNotification, handleCloseJudgeDialog, refreshData]);

  const handleDeleteJudge = useCallback((id) => {
    setDeleteItemId(id);
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
    setDeleteItemId(null);
  }, []);

  const confirmDeleteJudge = useCallback(async () => {
    if (!user?.token || !tournamentId || !deleteItemId) {
      showNotification('Authentication error or missing tournament/judge ID.', 'error');
      return;
    }

    try {
      // Delete judge via API
      await api.client.delete(
        `/api/debates/${tournamentId}/judges/${deleteItemId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      showNotification('Judge deleted successfully', 'success');
      handleCloseDeleteDialog();
      refreshData(); // Refresh the tournament data to show the updated judges list
    } catch (error) {
      console.error('Error deleting judge:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete judge';
      showNotification(errorMsg, 'error');
    }
  }, [deleteItemId, tournamentId, user?.token, showNotification, handleCloseDeleteDialog, refreshData]);

  return {
    openJudgeDialog,
    isEditingJudge: isEditing,
    editJudgeId: editId,
    judgeForm,
    handleOpenJudgeDialog,
    handleCloseJudgeDialog,
    handleJudgeFormChange,
    handleSubmitJudge,
    handleDeleteJudge,
    // Delete dialog state and handlers
    openDeleteDialog,
    handleCloseDeleteDialog,
    confirmDeleteJudge,
  };
};