import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  // Determine button text based on state
  const getSubmitButtonText = () => {
    if (loading) {
      return isEditing
        ? t('teamDialog.saveButtonUpdating', { defaultValue: 'Updating...' })
        : t('teamDialog.saveButtonAdding', { defaultValue: 'Adding...' });
    }
    return isEditing
      ? t('teamDialog.saveButtonUpdate', { defaultValue: 'Update' })
      : t('teamDialog.saveButtonAdd', { defaultValue: 'Add' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing
          ? t('teamDialog.editTitle', { defaultValue: 'Edit Team' })
          : t('teamDialog.addTitle', { defaultValue: 'Add Team' })}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label={t('teamDialog.nameLabel', { defaultValue: 'Team Name' })}
          type="text"
          fullWidth
          variant="outlined"
          value={teamForm.name}
          onChange={onFormChange}
          sx={{ mb: 2, mt: 1 }}
          disabled={loading}
        />

        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} disabled={loading}>
          <InputLabel id="leader-label">{t('teamDialog.leaderLabel', { defaultValue: 'Team Leader' })}</InputLabel>
          <Select
            labelId="leader-label"
            id="leader"
            name="leader" // Should match the key in teamForm state
            value={teamForm.leader} // Expecting entrant ID
            label={t('teamDialog.leaderLabel', { defaultValue: 'Team Leader' })}
            onChange={onFormChange}
          >
            <MenuItem value=""><em>{t('teamDialog.noneOption', { defaultValue: 'None' })}</em></MenuItem>
            {entrants.map((entrant) => (
              <MenuItem key={entrant.id} value={entrant.id}>
                {entrant.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth variant="outlined" disabled={loading}>
          <InputLabel id="speaker-label">{t('teamDialog.speakerLabel', { defaultValue: 'Team Speaker' })}</InputLabel>
          <Select
            labelId="speaker-label"
            id="speaker"
            name="speaker" // Should match the key in teamForm state
            value={teamForm.speaker} // Expecting entrant ID
            label={t('teamDialog.speakerLabel', { defaultValue: 'Team Speaker' })}
            onChange={onFormChange}
          >
             <MenuItem value=""><em>{t('teamDialog.noneOption', { defaultValue: 'None' })}</em></MenuItem>
            {entrants.map((entrant) => (
              <MenuItem key={entrant.id} value={entrant.id}>
                {entrant.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t('teamDialog.cancelButton', { defaultValue: 'Cancel' })}</Button>
        <Button onClick={onSubmit} color="primary" disabled={loading}>
          {getSubmitButtonText()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamDialog;