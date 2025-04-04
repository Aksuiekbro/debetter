import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';

const DeleteConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  itemName = 'item', // Default item name
  loading = false // Optional loading state for the confirm button
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('deleteDialog.title', 'Confirm Delete')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('deleteDialog.message', 'Are you sure you want to delete this {{item}}? This action cannot be undone.', { item: itemName })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t('deleteDialog.cancelButton', 'Cancel')}</Button>
        <Button onClick={onConfirm} color="error" disabled={loading}>
          {loading ? t('deleteDialog.deletingButton', 'Deleting...') : t('deleteDialog.deleteButton', 'Delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;