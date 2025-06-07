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
  FormControlLabel,
  Switch,
  Grid,
  Typography
} from '@mui/material';

const JudgeDialog = ({
  open,
  onClose,
  onSubmit, // Corresponds to handleSubmitJudge
  isEditing,
  judgeForm, // The form state { name, email, role, club, judgeStatus, judgeRank, isPresent } from useJudgeManagement
  onFormChange, // Corresponds to handleJudgeFormChange
  loading = false, // Optional loading state
}) => {
  const { t } = useTranslation();

  // Handle switch change for isPresent
  const handleSwitchChange = (event) => {
    onFormChange({
      target: {
        name: 'isPresent',
        value: event.target.checked
      }
    });
  };
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

        <TextField
          margin="dense"
          name="club"
          label={t('judgeDialog.clubLabel', { defaultValue: 'Club' })}
          type="text"
          fullWidth
          variant="outlined"
          value={judgeForm.club || ''}
          onChange={onFormChange}
          sx={{ mb: 2 }}
          disabled={loading}
        />

        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          {t('judgeDialog.rankSectionTitle', { defaultValue: 'Judge Rank Information' })}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="dense"
              name="yearsExperience"
              label={t('judgeDialog.yearsExperienceLabel', { defaultValue: 'Years of Experience' })}
              type="number"
              fullWidth
              variant="outlined"
              value={judgeForm.yearsExperience || 0}
              onChange={onFormChange}
              inputProps={{ min: 0 }}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="dense"
              name="courseLevel"
              label={t('judgeDialog.courseLevelLabel', { defaultValue: 'Course/Year of Study' })}
              type="text"
              fullWidth
              variant="outlined"
              value={judgeForm.courseLevel || ''}
              onChange={onFormChange}
              disabled={loading}
              placeholder={t('judgeDialog.courseLevelPlaceholder', { defaultValue: 'e.g., 2nd Year, Graduate' })}
            />
          </Grid>
        </Grid>

        <FormControl fullWidth margin="dense" sx={{ mb: 2, mt: 1 }}>
          <InputLabel id="judge-rank-label">
            {t('judgeDialog.rankLabel', { defaultValue: 'Experience Level' })}
          </InputLabel>
          <Select
            labelId="judge-rank-label"
            name="judgeRank"
            value={judgeForm.judgeRank || 'Novice'}
            label={t('judgeDialog.rankLabel', { defaultValue: 'Experience Level' })}
            onChange={onFormChange}
            disabled={loading}
          >
            <MenuItem value="Novice">{t('judgeDialog.rankNovice', { defaultValue: 'Novice' })}</MenuItem>
            <MenuItem value="Experienced">{t('judgeDialog.rankExperienced', { defaultValue: 'Experienced' })}</MenuItem>
            <MenuItem value="Expert">{t('judgeDialog.rankExpert', { defaultValue: 'Expert' })}</MenuItem>
            <MenuItem value="Head Judge">{t('judgeDialog.rankHeadJudge', { defaultValue: 'Head Judge' })}</MenuItem>
          </Select>
        </FormControl>

        <TextField
          margin="dense"
          name="judgeStatus"
          label={t('judgeDialog.statusLabel', { defaultValue: 'Status (e.g., experience level, student year)' })}
          type="text"
          fullWidth
          variant="outlined"
          value={judgeForm.judgeStatus || ''}
          onChange={onFormChange}
          sx={{ mb: 2 }}
          disabled={loading}
        />

        {isEditing && (
          <FormControlLabel
            control={
              <Switch
                checked={judgeForm.isPresent || false}
                onChange={handleSwitchChange}
                name="isPresent"
                color="primary"
                disabled={loading}
              />
            }
            label={t('judgeDialog.presentLabel', { defaultValue: 'Present at tournament' })}
            sx={{ mb: 2 }}
          />
        )}
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