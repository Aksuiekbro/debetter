import { useState, useCallback } from 'react';

// Note: This hook currently manages local state for judges.
// API integration for adding/editing/deleting judges directly might be needed.
export const useJudgeManagement = (initialJudges = [], setJudges, showNotification) => {
  const [openJudgeDialog, setOpenJudgeDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [judgeForm, setJudgeForm] = useState({ name: '', email: '', role: 'Judge' });

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const handleOpenJudgeDialog = useCallback((editMode = false, judge = null) => {
    setIsEditing(editMode);
    if (editMode && judge) {
      setJudgeForm({ name: judge.name, email: judge.email, role: judge.role });
      setEditId(judge.id);
    } else {
      setJudgeForm({ name: '', email: '', role: 'Judge' });
      setEditId(null);
    }
    setOpenJudgeDialog(true);
  }, []);

  const handleCloseJudgeDialog = useCallback(() => {
    setOpenJudgeDialog(false);
    setIsEditing(false);
    setEditId(null);
    setJudgeForm({ name: '', email: '', role: 'Judge' });
  }, []);

  const handleJudgeFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setJudgeForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmitJudge = useCallback(async () => {
    // TODO: Replace with actual API call if judges can be added/edited here
    try {
      if (isEditing) {
        // Edit existing judge (local state update)
        setJudges(prevJudges =>
          prevJudges.map(j =>
            j.id === editId ? { ...j, ...judgeForm } : j
          )
        );
        showNotification('Judge updated successfully', 'success');
      } else {
        // Add new judge (local state update)
        const newJudge = {
          id: `judge-${Date.now()}`, // Temporary ID
          ...judgeForm
        };
        setJudges(prevJudges => [...prevJudges, newJudge]);
        showNotification('Judge added successfully', 'success');
      }
      handleCloseJudgeDialog();
    } catch (error) {
      console.error('Error submitting judge:', error);
      showNotification('Failed to save judge', 'error');
    }
  }, [isEditing, editId, judgeForm, setJudges, showNotification, handleCloseJudgeDialog]);

  const handleDeleteJudge = useCallback((id) => {
    setDeleteItemId(id);
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
    setDeleteItemId(null);
  }, []);

  const confirmDeleteJudge = useCallback(async () => {
    // TODO: Replace with actual API call for deleting judge
    try {
      setJudges(prevJudges => prevJudges.filter(j => j.id !== deleteItemId));
      showNotification('Judge deleted successfully', 'success');
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting judge:', error);
      showNotification('Failed to delete judge', 'error');
    }
  }, [deleteItemId, setJudges, showNotification, handleCloseDeleteDialog]);

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