import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Add import
import { api } from '../config/api';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Stack,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import GroupsIcon from '@mui/icons-material/Groups';
import GavelIcon from '@mui/icons-material/Gavel';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TimerIcon from '@mui/icons-material/Timer';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import SportsIcon from '@mui/icons-material/Sports';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const HostDebate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(); // Add hook call
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    maxParticipants: 6,
    requiredJudges: 3,
    location: '',
    startDate: new Date(),
    duration: 60,
    format: 'standard',
    mode: 'solo',
    registrationDeadline: new Date()
  });

  const [errors, setErrors] = useState({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const categories = [
    'politics',
    'technology',
    'science',
    'society',
    'economics'
  ];

  useEffect(() => {
    // Update maxParticipants based on format
    setFormData(prev => ({
      ...prev,
      maxParticipants: prev.format === 'tournament' ? 32 : 6
    }));
  }, [formData.format]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = t('hostDebate.validation.titleRequired', 'Title is required');
    if (!formData.description) newErrors.description = t('hostDebate.validation.descriptionRequired', 'Description is required');
    if (!formData.category) newErrors.category = t('hostDebate.validation.categoryRequired', 'Category is required');
    if (!formData.location) newErrors.location = t('hostDebate.validation.locationRequired', 'Location is required');
    if (new Date(formData.startDate) < new Date()) newErrors.startDate = t('hostDebate.validation.startDatePast', 'Start date must be in the future');
    if (formData.duration < 30) newErrors.duration = t('hostDebate.validation.durationMin', 'Duration must be at least 30 minutes');

    if (formData.format === 'tournament') {
      const startDateTime = new Date(formData.startDate);
      const now = new Date();
      const minHours = 48;
      
      if (startDateTime - now < minHours * 60 * 60 * 1000) {
        newErrors.startDate = t('hostDebate.validation.tournamentStartDateMin', 'Tournament debates must be scheduled at least 48 hours in advance');
      }
      const registrationDeadline = new Date(formData.registrationDeadline);
      if (registrationDeadline >= startDateTime) {
        newErrors.registrationDeadline = t('hostDebate.validation.registrationDeadlineBeforeStart', 'Registration deadline must be before the tournament start date');
      }
      if (registrationDeadline < now) {
        newErrors.registrationDeadline = t('hostDebate.validation.registrationDeadlinePast', 'Registration deadline must be in the future');
      }
      if (startDateTime - registrationDeadline < 24 * 60 * 60 * 1000) {
        newErrors.registrationDeadline = t('hostDebate.validation.registrationDeadlineMinBeforeStart', 'Registration must close at least 24 hours before tournament start');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (formData.format === 'tournament' && !openConfirmDialog) {
      setOpenConfirmDialog(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('Submitting debate with format:', formData.format); // Debug log
      const response = await api.client.post(api.endpoints.debates, {
        ...formData,
        maxParticipants: formData.format === 'tournament' ? 32 : 6,
        maxJudges: formData.format === 'tournament' ? 8 : 3,
        type: formData.format === 'tournament' ? 'tournament' : 'standard'
      });
      console.log('Debate creation response:', response.data); // Debug log
      navigate(`/debates/${response.data._id}`);
    } catch (error) {
      console.error('Error creating debate:', error);
      setErrors({ 
        submit: error.response?.data?.message || t('hostDebate.error.submitFailed', 'Failed to create debate. Please try again.')
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: value
      };
      
      // Automatically set judges to 8 when tournament format is selected
      if (name === 'format' && value === 'tournament') {
        newState.requiredJudges = 8;
      } else if (name === 'format' && value === 'standard') {
        newState.requiredJudges = 3;
      }
      
      return newState;
    });
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="h4" sx={{ mb: 4, color: 'primary.main' }}>
          {t('hostDebate.pageTitle', 'Host a Debate')}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('hostDebate.form.titleLabel', 'Debate Title')}
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('hostDebate.form.descriptionLabel', 'Description')}
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>

            {/* Category and Difficulty */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel>{t('hostDebate.form.categoryLabel', 'Category')}</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('hostDebate.form.difficultyLabel', 'Difficulty')}</InputLabel>
                <Select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                >
                  <MenuItem value="beginner">{t('hostDebate.difficulty.beginner', 'Beginner')}</MenuItem>
                  <MenuItem value="intermediate">{t('hostDebate.difficulty.intermediate', 'Intermediate')}</MenuItem>
                  <MenuItem value="advanced">{t('hostDebate.difficulty.advanced', 'Advanced')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Format Selection */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" gutterBottom>
                  {t('hostDebate.form.formatLabel', 'Debate Format')}
                </Typography>
                <RadioGroup
                  row
                  name="format"
                  value={formData.format}
                  onChange={handleChange}
                >
                  <FormControlLabel 
                    value="standard" 
                    control={<Radio />} 
                    label={t('hostDebate.format.standard', 'Standard Debate')}
                  />
                  <FormControlLabel 
                    value="tournament" 
                    control={<Radio />} 
                    label={t('hostDebate.format.tournament', 'Tournament')}
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Tournament Mode Selection - Only show if format is tournament */}
            {formData.format === 'tournament' && (
              <>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <Typography variant="subtitle1" gutterBottom>
                      {t('hostDebate.form.tournamentModeLabel', 'Tournament Mode')}
                    </Typography>
                    <RadioGroup
                      row
                      name="mode"
                      value={formData.mode}
                      onChange={handleChange}
                    >
                      <FormControlLabel 
                        value="solo" 
                        control={<Radio />} 
                        label={t('hostDebate.tournamentMode.soloLabel', 'Solo (32 individual participants)')}
                      />
                      <FormControlLabel 
                        value="duo" 
                        control={<Radio />} 
                        label={t('hostDebate.tournamentMode.duoLabel', 'Duo (16 teams of 2)')}
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {/* Tournament Info */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('hostDebate.form.tournamentParticipantsLabel', 'Tournament Participants')}
                    value={32}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SportsIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                    helperText={formData.mode === 'solo' ? t('hostDebate.form.tournamentParticipantsHelperSolo', '32 individual participants') : t('hostDebate.form.tournamentParticipantsHelperDuo', '16 teams of 2 (32 total)')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('hostDebate.form.requiredJudgesLabel', 'Required Judges')}
                    value={8}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GavelIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                    helperText={t('hostDebate.form.requiredJudgesHelperTournament', '8 judges required for tournament format')}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label={t('hostDebate.form.registrationDeadlineLabel', 'Registration Deadline')}
                      value={formData.registrationDeadline}
                      onChange={(newValue) => {
                        handleChange({
                          target: { name: 'registrationDeadline', value: newValue }
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.registrationDeadline}
                          helperText={errors.registrationDeadline || t('hostDebate.form.registrationDeadlineHelper', 'Must be at least 24 hours before start time')}
                        />
                      )}
                      disablePast={true}
                    />
                  </LocalizationProvider>
                </Grid>
              </>
            )}

            {/* Standard Format Fields */}
            {formData.format === 'standard' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('hostDebate.form.maxParticipantsLabel', 'Maximum Participants')}
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GroupsIcon />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.maxParticipants}
                    helperText={errors.maxParticipants}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('hostDebate.form.requiredJudgesLabel', 'Required Judges')}
                    name="requiredJudges"
                    value={formData.requiredJudges}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GavelIcon />
                        </InputAdornment>
                      ),
                    }}
                    error={!!errors.requiredJudges}
                    helperText={errors.requiredJudges}
                  />
                </Grid>
              </>
            )}

            {/* Location */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('hostDebate.form.locationLabel', 'Location')}
                name="location"
                value={formData.location}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
                }}
                error={!!errors.location}
                helperText={errors.location}
                required
              />
            </Grid>

            {/* Date and Time */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label={t('hostDebate.form.startDateTimeLabel', 'Start Date & Time')}
                  value={formData.startDate}
                  onChange={(newValue) => {
                    handleChange({
                      target: { name: 'startDate', value: newValue }
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.startDate}
                      helperText={errors.startDate}
                    />
                  )}
                  disablePast={true}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={t('hostDebate.form.durationLabel', 'Duration (minutes)')}
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TimerIcon />
                    </InputAdornment>
                  ),
                }}
                error={!!errors.duration}
                helperText={errors.duration}
              />
            </Grid>

            {/* Error Message */}
            {errors.submit && (
              <Grid item xs={12}>
                <Typography color="error" variant="body2">
                  {errors.submit}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                {formData.format === 'tournament' ?
                  t('hostDebate.info.tournamentFormat', '* Tournament format requires 32 debaters and 8 judges. The tournament will begin once all positions are filled.') :
                  t('hostDebate.info.standardFormat', '* Standard debates can have up to 6 participants including judges.')}
              </Typography>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                {t('hostDebate.button.createDebate', 'Create Debate')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>{t('hostDebate.dialog.confirmTournamentTitle', 'Confirm Tournament Creation')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('hostDebate.dialog.confirmTournamentIntro', 'You are about to create a tournament debate that requires:')}
            <Box component="ul" sx={{ mt: 1 }}>
              <li>{t('hostDebate.dialog.confirmTournamentReqDebaters', '32 debaters')} {formData.mode === 'duo' && t('hostDebate.dialog.confirmTournamentReqDebatersDuo', '(16 teams of 2)')}</li>
              <li>{t('hostDebate.dialog.confirmTournamentReqJudges', '8 judges')}</li>
              <li>{t('hostDebate.dialog.confirmTournamentReqNotice', 'Minimum 48 hours notice')}</li>
              <li>{t('hostDebate.dialog.confirmTournamentReqAvailability', 'All participants must be available for multiple rounds')}</li>
            </Box>
            {t('hostDebate.dialog.confirmTournamentConfirmation', 'Are you sure you want to proceed?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>{t('hostDebate.button.cancel', 'Cancel')}</Button>
          <Button 
            onClick={() => {
              setOpenConfirmDialog(false);
              handleSubmit(new Event('submit'));
            }} 
            color="primary" 
            variant="contained"
          >
            {t('hostDebate.button.createTournament', 'Create Tournament')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HostDebate;