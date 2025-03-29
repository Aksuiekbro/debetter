import { useState, useCallback } from 'react';

// Note: This hook currently manages local state for entrants as per the original
// component's logic. For full CRUD, API calls would be added here.
export const useEntrantManagement = (initialEntrants = [], setEntrants, showNotification) => {
  const [openEntrantDialog, setOpenEntrantDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [entrantForm, setEntrantForm] = useState({ name: '', email: '' });

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  const handleOpenEntrantDialog = useCallback((editMode = false, entrant = null) => {
    setIsEditing(editMode);
    if (editMode && entrant) {
      setEntrantForm({ name: entrant.name, email: entrant.email });
      setEditId(entrant.id);
    } else {
      setEntrantForm({ name: '', email: '' });
      setEditId(null);
    }
    setOpenEntrantDialog(true);
  }, []);

  const handleCloseEntrantDialog = useCallback(() => {
    setOpenEntrantDialog(false);
    // Reset form and editing state on close
    setIsEditing(false);
    setEditId(null);
    setEntrantForm({ name: '', email: '' });
  }, []);

  const handleEntrantFormChange = useCallback((e) => {
    setEntrantForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmitEntrant = useCallback(async () => {
    // TODO: Replace with actual API call for adding/editing entrants
    try {
      if (isEditing) {
        // Edit existing entrant (local state update)
        setEntrants(prevEntrants =>
          prevEntrants.map(e =>
            e.id === editId ? { ...e, name: entrantForm.name, email: entrantForm.email } : e
          )
        );
        showNotification('Entrant updated successfully', 'success');
      } else {
        // Add new entrant (local state update)
        const newEntrant = {
          id: `entrant-${Date.now()}`, // Temporary ID
          name: entrantForm.name,
          email: entrantForm.email,
          enrollDate: new Date().toLocaleDateString()
        };
        setEntrants(prevEntrants => [...prevEntrants, newEntrant]);
        showNotification('Entrant added successfully', 'success');
      }
      handleCloseEntrantDialog();
    } catch (error) {
      console.error('Error submitting entrant:', error);
      showNotification('Failed to save entrant', 'error');
    }
  }, [isEditing, editId, entrantForm, setEntrants, showNotification, handleCloseEntrantDialog]);

  const handleDeleteEntrant = useCallback((id) => {
    setDeleteItemId(id);
    setOpenDeleteDialog(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setOpenDeleteDialog(false);
    setDeleteItemId(null);
  }, []);

  const confirmDeleteEntrant = useCallback(async () => {
    // TODO: Replace with actual API call for deleting entrant
    try {
      setEntrants(prevEntrants => prevEntrants.filter(e => e.id !== deleteItemId));
      showNotification('Entrant deleted successfully', 'success');
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting entrant:', error);
      showNotification('Failed to delete entrant', 'error');
    }
  }, [deleteItemId, setEntrants, showNotification, handleCloseDeleteDialog]);

  return {
    openEntrantDialog,
    isEditingEntrant: isEditing, // Renamed for clarity if other entities are managed
    editEntrantId: editId,      // Renamed for clarity
    entrantForm,
    handleOpenEntrantDialog,
    handleCloseEntrantDialog,
    handleEntrantFormChange,
    handleSubmitEntrant,
    handleDeleteEntrant,
    openDeleteDialog,         // Expose delete dialog state
    handleCloseDeleteDialog,  // Expose delete dialog close handler
    confirmDeleteEntrant,     // Expose delete confirmation handler
  };
};