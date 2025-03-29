import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

const JudgeDialog = ({
  open,
  onClose,
  onSubmit, // Corresponds to handleSubmitJudge
  isEditing,
  judgeForm, // The form state { name, email, role } from useJudgeManagement
  onFormChange, // Corresponds to handleJudgeFormChange
  loading = false // Optional loading state
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Judge' : 'Add Judge'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="Name"
          type="text"
          fullWidth
          variant="outlined"
          value={judgeForm.name}
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
          value={judgeForm.email}
          onChange={onFormChange}
          sx={{ mb: 2 }}
          disabled={loading}
        />

        <FormControl fullWidth variant="outlined" disabled={loading}>
          <InputLabel id="role-label">Role</InputLabel>
          <Select
            labelId="role-label"
            id="role"
            name="role" // Should match the key in judgeForm state
            value={judgeForm.role}
            label="Role"
            onChange={onFormChange}
          >
            {/* Define available judge roles */}
            <MenuItem value="Head Judge">Head Judge</MenuItem>
            <MenuItem value="Judge">Judge</MenuItem>
            <MenuItem value="Assistant Judge">Assistant Judge</MenuItem>
            {/* Add other roles if necessary */}
          </Select>
        </FormControl>
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

export default JudgeDialog;