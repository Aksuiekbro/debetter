import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, List, ListItem, ListItemText, IconButton,
  TextField, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../config/api'; // Assuming api client is here
import { getAuthHeaders } from '../../utils/auth'; // Assuming auth helper is here

const ThemeManager = () => {
  const { tournamentId } = useParams();
  const { t } = useTranslation();

  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newThemeText, setNewThemeText] = useState('');
  const [editingTheme, setEditingTheme] = useState(null); // { _id: string, text: string }
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchThemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const response = await api.get(`/api/debates/${tournamentId}/themes`, { headers });
      setThemes(response.data || []); // Ensure themes is always an array
    } catch (err) {
      console.error("Error fetching themes:", err);
      setError(t('themeManager.errors.fetch'));
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const handleAddTheme = async () => {
    if (!newThemeText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      await api.post(`/api/debates/${tournamentId}/themes`, { text: newThemeText.trim() }, { headers });
      setNewThemeText('');
      await fetchThemes(); // Refresh list
    } catch (err) {
      console.error("Error adding theme:", err);
      setError(t('themeManager.errors.add'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (theme) => {
    setEditingTheme({ ...theme }); // Clone the theme object
    setIsEditDialogOpen(true);
  };
const handleUpdateTheme = async () => {
  if (!editingTheme || !editingTheme.text.trim()) return;
  setLoading(true);
  setError(null);
  try {
    const headers = getAuthHeaders();
    await api.put(`/api/debates/${tournamentId}/themes/${editingTheme._id}`, { text: editingTheme.text.trim() }, { headers });
    handleCloseEditDialog();
    await fetchThemes(); // Refresh list
  } catch (err) {
    console.error("Error updating theme:", err);
    setError(t('themeManager.errors.update'));
  } finally {
    setLoading(false);
  }
    // Implementation needed
  };

  const handleDeleteTheme = async (themeId) => {
    // Optional: Add confirmation dialog here
    // if (!window.confirm(t('themeManager.confirmDelete'))) return;

    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      await api.delete(`/api/debates/${tournamentId}/themes/${themeId}`, { headers });
      await fetchThemes(); // Refresh list
    } catch (err) {
      console.error("Error deleting theme:", err);
      setError(t('themeManager.errors.delete'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingTheme(null);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('themeManager.title')}
      </Typography>

      {/* Add Theme Form */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label={t('themeManager.newThemeLabel')}
          value={newThemeText}
          onChange={(e) => setNewThemeText(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTheme}
          disabled={!newThemeText.trim()}
        >
          {t('themeManager.addButton')}
        </Button>
      </Box>

      {/* Themes List */}
      <List>
        {themes.map((theme) => (
          <ListItem
            key={theme._id}
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(theme)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteTheme(theme._id)} sx={{ ml: 1 }}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemText primary={theme.text} />
          </ListItem>
        ))}
      </List>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>{t('themeManager.editDialogTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('themeManager.editThemeLabel')}
            type="text"
            fullWidth
            variant="standard"
            value={editingTheme?.text || ''}
            onChange={(e) => setEditingTheme(prev => ({ ...prev, text: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleUpdateTheme} disabled={!editingTheme?.text?.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThemeManager;