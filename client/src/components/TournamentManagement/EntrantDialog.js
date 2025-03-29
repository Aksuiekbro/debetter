import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField
} from '@mui/material';

const EntrantDialog = ({
  open,
  onClose,
  onSubmit, // Corresponds to handleSubmitEntrant
  isEditing,
  entrantForm, // The form state { name, email } from useEntrantManagement
  onFormChange, // Corresponds to handleEntrantFormChange
  loading = false // Optional loading state
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Entrant' : 'Add Entrant'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="Name"
          type="text"
          fullWidth
          variant="outlined"
          value={entrantForm.name}
          onChange={onFormChange}
          sx={{ mb: 2, mt: 1 }}
          disabled={loading}
        />
        <TextField
          margin="dense"
          name="email"
          label="Email"
          type="email"
          fullWidth
          variant="outlined"
          value={entrantForm.email}
          onChange={onFormChange}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={onSubmit} color="primary" disabled={loading}>
          {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update' : 'Add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EntrantDialog;