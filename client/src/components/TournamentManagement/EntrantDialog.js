import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid // For layout
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const EntrantDialog = ({
  open,
  onClose,
  onSubmit, // Corresponds to handleSubmitEntrant
  isEditing,
  entrantForm, // Updated form state { userId, name, email, phoneNumber, club, tournamentRole, teamId }
  onFormChange,
  loading = false,
  teams = [] // Add teams prop
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? t('entrantDialog.editTitle', { defaultValue: 'Edit Entrant' }) : t('entrantDialog.addTitle', { defaultValue: 'Add Entrant' })}</DialogTitle>
      <DialogContent>
        {/* Display User Info (Read-only) */}
        <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('entrantDialog.nameLabel', { defaultValue: 'Name' })}
              value={entrantForm.name || ''}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="filled" // Indicate read-only
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('entrantDialog.emailLabel', { defaultValue: 'Email' })}
              value={entrantForm.email || ''}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="filled"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('entrantDialog.phoneLabel', { defaultValue: 'Phone Number' })}
              value={entrantForm.phoneNumber || 'N/A'}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="filled"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('entrantDialog.clubLabel', { defaultValue: 'Club' })}
              value={entrantForm.club || 'N/A'}
              fullWidth
              InputProps={{ readOnly: true }}
              variant="filled"
            />
          </Grid>
        </Grid>

        {/* Editable Fields */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="dense" disabled={loading}>
              <InputLabel id="tournament-role-label">{t('entrantDialog.roleLabel', { defaultValue: 'Tournament Role' })}</InputLabel>
              <Select
                labelId="tournament-role-label"
                name="tournamentRole"
                value={entrantForm.tournamentRole || ''}
                label={t('entrantDialog.roleLabel', { defaultValue: 'Tournament Role' })}
                onChange={onFormChange}
              >
                {/* Add default roles or fetch dynamically if needed */}
                <MenuItem value="Debater">{t('roles.debater', { defaultValue: 'Debater' })}</MenuItem>
                <MenuItem value="Judge">{t('roles.judge', { defaultValue: 'Judge' })}</MenuItem>
                <MenuItem value="Observer">{t('roles.observer', { defaultValue: 'Observer' })}</MenuItem>
                {/* Add other roles as necessary */}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="dense" disabled={loading}>
              <InputLabel id="team-select-label">{t('entrantDialog.teamLabel', { defaultValue: 'Team' })}</InputLabel>
              <Select
                labelId="team-select-label"
                name="teamId"
                value={entrantForm.teamId || ''}
                label={t('entrantDialog.teamLabel', { defaultValue: 'Team' })}
                onChange={onFormChange}
                displayEmpty // Allows showing 'None' when value is empty string or null
              >
                <MenuItem value="">
                  <em>{t('common.none', { defaultValue: 'None' })}</em>
                </MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t('entrantDialog.cancelButton', { defaultValue: 'Cancel' })}</Button>
        {/* Pass the relevant form data needed for the API call */}
        <Button onClick={() => onSubmit({ tournamentRole: entrantForm.tournamentRole, teamId: entrantForm.teamId || null })} color="primary" disabled={loading}>
          {loading
            ? (isEditing ? t('entrantDialog.updatingButton', { defaultValue: 'Updating...' }) : t('entrantDialog.addingButton', { defaultValue: 'Adding...' }))
            : (isEditing ? t('entrantDialog.updateButton', { defaultValue: 'Update' }) : t('entrantDialog.addButton', { defaultValue: 'Add' }))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EntrantDialog;