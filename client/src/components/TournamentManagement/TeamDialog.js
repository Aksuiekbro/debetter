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

const TeamDialog = ({
  open,
  onClose,
  onSubmit, // Corresponds to handleSubmitTeam
  isEditing,
  teamForm, // The form state { name, leader, speaker } from useTeamManagement
  onFormChange, // Corresponds to handleTeamFormChange
  entrants = [], // Needed for dropdown options
  loading = false // Loading state from useTeamManagement
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Team' : 'Add Team'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="Team Name"
          type="text"
          fullWidth
          variant="outlined"
          value={teamForm.name}
          onChange={onFormChange}
          sx={{ mb: 2, mt: 1 }}
          disabled={loading}
        />

        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} disabled={loading}>
          <InputLabel id="leader-label">Team Leader</InputLabel>
          <Select
            labelId="leader-label"
            id="leader"
            name="leader" // Should match the key in teamForm state
            value={teamForm.leader} // Expecting entrant ID
            label="Team Leader"
            onChange={onFormChange}
          >
            <MenuItem value=""><em>None</em></MenuItem>
            {entrants.map((entrant) => (
              <MenuItem key={entrant.id} value={entrant.id}>
                {entrant.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined" disabled={loading}>
          <InputLabel id="speaker-label">Team Speaker</InputLabel>
          <Select
            labelId="speaker-label"
            id="speaker"
            name="speaker" // Should match the key in teamForm state
            value={teamForm.speaker} // Expecting entrant ID
            label="Team Speaker"
            onChange={onFormChange}
          >
             <MenuItem value=""><em>None</em></MenuItem>
            {entrants.map((entrant) => (
              <MenuItem key={entrant.id} value={entrant.id}>
                {entrant.name}
              </MenuItem>
            ))}
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

export default TeamDialog;