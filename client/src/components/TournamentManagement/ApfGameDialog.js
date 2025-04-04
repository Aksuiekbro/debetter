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
  MenuItem,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Autocomplete, // Using Autocomplete for theme with freeSolo option
  Box
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// Mock theme options - replace with actual data source if available
const mockThemeOptions = [
  { label: 'THBT social media has done more harm than good', id: 'theme1' },
  { label: 'THW ban fossil fuels', id: 'theme2' },
  { label: 'THS space exploration', id: 'theme3' },
];


const ApfGameDialog = ({
  open,
  onClose,
  onSubmit, // Corresponds to handleConfirmApfGame
  isEditing,
  gameData, // The currentApfGameData state from useApfPostingManagement
  onFormChange, // Corresponds to handleApfCardChange
  teams = [], // List of available teams
  judges = [], // List of available judges
  loading = false // Loading state from useApfPostingManagement
}) => {
  const { t } = useTranslation();

  // Helper to get judge IDs for the Select value
  const getSelectedJudgeIds = () => {
    if (!gameData || !gameData.judges) return [];
    return gameData.judges.map(judge => (typeof judge === 'object' ? judge.id : judge));
  };

  return (
    // Using maxWidth="md" for more space
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? t('apfGameDialog.editTitle', 'Edit APF Game') : t('apfGameDialog.createTitle', 'Create APF Game')}</DialogTitle>
      <DialogContent>
        {/* Team Selection */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
          <FormControl fullWidth variant="outlined" disabled={loading}>
            <InputLabel id="team1-label">{t('apfGameDialog.team1Label', 'Team 1 (Gov)')}</InputLabel>
            <Select
              labelId="team1-label"
              name="team1" // Matches key in gameData
              value={gameData.team1?.id || ''} // Use team object's ID
              label={t('apfGameDialog.team1Label', 'Team 1 (Gov)')}
              onChange={(e) => onFormChange('team1', e.target.value)} // Pass ID
            >
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id} disabled={team.id === gameData.team2?.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth variant="outlined" disabled={loading}>
            <InputLabel id="team2-label">{t('apfGameDialog.team2Label', 'Team 2 (Opp)')}</InputLabel>
            <Select
              labelId="team2-label"
              name="team2" // Matches key in gameData
              value={gameData.team2?.id || ''} // Use team object's ID
              label={t('apfGameDialog.team2Label', 'Team 2 (Opp)')}
              onChange={(e) => onFormChange('team2', e.target.value)} // Pass ID
            >
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id} disabled={team.id === gameData.team1?.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Judge Selection */}
        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }} disabled={loading}>
          <InputLabel id="judges-label">{t('apfGameDialog.judgesLabel', 'Judges')}</InputLabel>
          <Select
            labelId="judges-label"
            name="judges" // Matches key in gameData
            multiple
            value={getSelectedJudgeIds()} // Expects array of IDs
            onChange={(e) => onFormChange('judges', e.target.value)} // Pass array of IDs
            label={t('apfGameDialog.judgesLabel', 'Judges')}
            renderValue={(selectedIds) => {
              // Map selected IDs back to names for display
              return selectedIds.map(id => {
                const judge = judges.find(j => j.id === id);
                return judge ? judge.name : t('apfGameDialog.unknownJudge', 'Unknown');
              }).join(', ');
            }}
          >
            {judges.map((judge) => (
              <MenuItem key={judge.id} value={judge.id}>
                <Checkbox checked={getSelectedJudgeIds().includes(judge.id)} />
                <ListItemText primary={judge.name} secondary={judge.role} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Location / Link */}
         <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
                margin="dense"
                name="location"
                label={t('apfGameDialog.locationLabel', 'Location (Room)')}
                type="text"
                fullWidth
                variant="outlined"
                value={gameData.location || ''}
                onChange={(e) => onFormChange('location', e.target.value)}
                disabled={loading}
            />
             <TextField
                margin="dense"
                name="virtualLink"
                label={t('apfGameDialog.virtualLinkLabel', 'Virtual Meeting Link')}
                type="url"
                fullWidth
                variant="outlined"
                value={gameData.virtualLink || ''}
                onChange={(e) => onFormChange('virtualLink', e.target.value)}
                disabled={loading}
            />
        </Box>

        {/* Theme / Custom Model */}
        <Autocomplete
            freeSolo // Allows custom input
            options={mockThemeOptions} // Provide predefined themes
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
            value={gameData.theme} // Can be string or object
            onChange={(event, newValue) => {
                onFormChange('theme', newValue); // Pass string or object
            }}
            inputValue={typeof gameData.theme === 'string' ? gameData.theme : gameData.theme?.label || ''}
            onInputChange={(event, newInputValue) => {
                // If user types custom theme, update the state directly as string
                 if (event && event.type === 'change') {
                    onFormChange('theme', newInputValue);
                 }
            }}
            renderInput={(params) => (
                <TextField
                {...params}
                label={t('apfGameDialog.themeLabel', 'Theme')}
                variant="outlined"
                margin="dense"
                fullWidth
                disabled={loading || gameData.useCustomModel} // Disable if using custom model
                />
            )}
            sx={{ mb: 1 }} // Autocomplete doesn't have mb prop directly
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={gameData.useCustomModel || false}
              onChange={(e) => onFormChange('useCustomModel', e.target.checked)}
              disabled={loading}
            />
          }
          label={t('apfGameDialog.useCustomModelLabel', 'Use Custom Model Instead of Theme')}
          sx={{ mb: 1, display: 'block' }}
        />

        {gameData.useCustomModel && (
          <TextField
            margin="dense"
            name="customModel"
            label={t('apfGameDialog.customModelLabel', 'Custom Model / Resolution')}
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={gameData.customModel || ''}
            onChange={(e) => onFormChange('customModel', e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />
        )}

        {/* Scheduled Time */}
        {/* Ensure LocalizationProvider is set up in your App.js or index.js */}
        <DateTimePicker
            label={t('apfGameDialog.scheduledTimeLabel', 'Scheduled Time')}
            value={gameData.scheduledTime ? new Date(gameData.scheduledTime) : null}
            onChange={(newValue) => onFormChange('scheduledTime', newValue)}
            renderInput={(params) => <TextField {...params} fullWidth margin="dense" sx={{ mb: 2 }} />}
            disabled={loading}
        />

        {/* Notify Participants Checkbox */}
         <FormControlLabel
            control={
                <Checkbox
                checked={gameData.notifyParticipants !== undefined ? gameData.notifyParticipants : true}
                onChange={(e) => onFormChange('notifyParticipants', e.target.checked)}
                disabled={loading}
                />
            }
            label={t('apfGameDialog.notifyLabel', 'Notify Participants on Creation/Update')}
            sx={{ mb: 2, display: 'block' }}
        />

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t('apfGameDialog.cancelButton', 'Cancel')}</Button>
        <Button onClick={onSubmit} color="primary" disabled={loading}>
          {loading ? (isEditing ? t('apfGameDialog.updatingButton', 'Updating...') : t('apfGameDialog.creatingButton', 'Creating...')) : (isEditing ? t('apfGameDialog.updateButton', 'Update Game') : t('apfGameDialog.createButton', 'Create Game'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApfGameDialog;