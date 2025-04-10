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

const JudgeDialog = ({
  open,
  onClose,
  onSubmit, // Corresponds to handleSubmitJudge
  isEditing,
  judgeForm, // The form state { name, email, role } from useJudgeManagement
  onFormChange, // Corresponds to handleJudgeFormChange
  loading = false, // Optional loading state
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? t('judgeDialog.editTitle', { defaultValue: 'Edit Judge' }) : t('judgeDialog.addTitle', { defaultValue: 'Add Judge' })}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label={t('judgeDialog.nameLabel', { defaultValue: 'Name' })}
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
          label={t('judgeDialog.emailLabel', { defaultValue: 'Email' })}
          type="email"
          fullWidth
          variant="outlined"
          value={judgeForm.email}
          onChange={onFormChange}
          sx={{ mb: 2 }}
          disabled={loading}
        />

        <FormControl fullWidth variant="outlined" disabled={loading}>
          <InputLabel id="role-label">{t('judgeDialog.roleLabel', { defaultValue: 'Role' })}</InputLabel>
          <Select
            labelId="role-label"
            id="role"
            name="role" // Should match the key in judgeForm state
            value={judgeForm.role}
            label={t('judgeDialog.roleLabel', { defaultValue: 'Role' })}
            onChange={onFormChange}
          >
            {/* Define available judge roles */}
            <MenuItem value="Head Judge">{t('judgeDialog.roleHead', { defaultValue: 'Head Judge' })}</MenuItem>
            <MenuItem value="Judge">{t('judgeDialog.roleJudge', { defaultValue: 'Judge' })}</MenuItem>
            <MenuItem value="Assistant Judge">{t('judgeDialog.roleAssistant', { defaultValue: 'Assistant Judge' })}</MenuItem>
            {/* Add other roles if necessary */}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t('judgeDialog.cancelButton', { defaultValue: 'Cancel' })}</Button>
        <Button onClick={onSubmit} color="primary" disabled={loading}>
          {loading
            ? (isEditing ? t('judgeDialog.updatingButton', { defaultValue: 'Updating...' }) : t('judgeDialog.addingButton', { defaultValue: 'Adding...' }))
            : (isEditing ? t('judgeDialog.updateButton', { defaultValue: 'Update' }) : t('judgeDialog.addButton', { defaultValue: 'Add' }))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JudgeDialog;