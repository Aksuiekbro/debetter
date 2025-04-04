import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const EntrantDialog = ({
  open,
  onClose,
  onSubmit, // Corresponds to handleSubmitEntrant
  isEditing,
  entrantForm, // The form state { name, email } from useEntrantManagement
  onFormChange, // Corresponds to handleEntrantFormChange
  loading = false // Optional loading state
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? t('entrantDialog.editTitle', { defaultValue: 'Edit Entrant' }) : t('entrantDialog.addTitle', { defaultValue: 'Add Entrant' })}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label={t('entrantDialog.nameLabel', { defaultValue: 'Name' })}
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
          label={t('entrantDialog.emailLabel', { defaultValue: 'Email' })}
          type="email"
          fullWidth
          variant="outlined"
          value={entrantForm.email}
          onChange={onFormChange}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t('entrantDialog.cancelButton', { defaultValue: 'Cancel' })}</Button>
        <Button onClick={onSubmit} color="primary" disabled={loading}>
          {loading
            ? (isEditing ? t('entrantDialog.updatingButton', { defaultValue: 'Updating...' }) : t('entrantDialog.addingButton', { defaultValue: 'Adding...' }))
            : (isEditing ? t('entrantDialog.updateButton', { defaultValue: 'Update' }) : t('entrantDialog.addButton', { defaultValue: 'Add' }))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EntrantDialog;