import React, { useState, useEffect } from 'react'; // Import useEffect
import { useTranslation } from 'react-i18next'; // Import useTranslation
import {
  Box,
  TextField,
  Button,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Select,         // Add Select
  MenuItem,       // Add MenuItem
  InputLabel,     // Add InputLabel
  FormControl     // Add FormControl
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { api } from '../config/api'; // Use named import
import { getAuthHeaders } from '../utils/auth'; // Helper to get auth headers

const CreateTournamentForm = () => {
  const { t } = useTranslation(); // Initialize translation hook
  const [name, setName] = useState('');
  // Removed selectedFormats state
  const [date, setDate] = useState(null); // Renamed for clarity: this is the Start Date
  const [endDate, setEndDate] = useState(null); // Add end date
  const [registrationDeadline, setRegistrationDeadline] = useState(null); // Add state for registration deadline
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('');
  // Removed category state
  // Removed difficulty state
  const [league, setLeague] = useState('school'); // Renamed from leagueType, default to 'school'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Removed availableFormats and handleFormatChange

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: name, // Use 'title' key
      format: 'tournament', // Keep this hardcoded unless specified otherwise
      // Removed tournamentFormats
      startDate: date instanceof Date && !isNaN(date.getTime()) ? date.toISOString() : null, // Use 'startDate' key (Start Date)
      endDate: endDate instanceof Date && !isNaN(endDate.getTime()) ? endDate.toISOString() : null, // Add end date
      registrationDeadline: registrationDeadline instanceof Date && !isNaN(registrationDeadline.getTime()) ? registrationDeadline.toISOString() : null, // Add registration deadline
      location,
      description,
      eligibilityCriteria: eligibility, // Use 'eligibilityCriteria' key
      // Removed category
      // Removed difficulty
      league, // Renamed from leagueType
    };

    try {
      const response = await api.client.post('/api/debates', payload, { headers: getAuthHeaders() });
      // Assuming response.data.title based on payload key 'title'
      setSuccess(t('createTournamentForm.successMessage', 'Tournament "{{name}}" created successfully!', { name: response.data.title }));
      // Optionally clear the form
      setName('');
      // Removed selectedFormats clear
      setDate(null); // Clear Start Date
      setEndDate(null); // Clear End Date
      setRegistrationDeadline(null); // Clear Registration Deadline
      setLocation('');
      setDescription('');
      setEligibility('');
      // Removed category clear
      // Removed difficulty clear
      setLeague('school'); // Reset league to default
    } catch (err) {
      console.error("Error creating tournament:", err);
      setError(err.response?.data?.message || t('createTournamentForm.errorMessageDefault', 'Failed to create tournament. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          {t('createTournamentForm.title', 'Create New Tournament')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TextField
          label={t('createTournamentForm.nameLabel', 'Tournament Name')}
          variant="outlined"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
          inputProps={{ "data-testid": "tournament-name-input" }}
        />

        {/* Removed Formats Checkbox Group */}

        {/* Removed Category Select */}

        {/* Removed Difficulty Select */}

        <DatePicker
          label={t('createTournamentForm.startDateLabel', 'Start Date')}
          value={date}
          onChange={(newDate) => setDate(newDate)}
          renderInput={(params) => <TextField {...params} fullWidth required sx={{ mb: 2 }} disabled={loading} inputProps={{ ...params.inputProps, "data-testid": "tournament-start-date-input" }} />}
        />

        <DatePicker
          label={t('createTournamentForm.endDateLabel', 'End Date')}
          value={endDate}
          onChange={(newDate) => setEndDate(newDate)}
          renderInput={(params) => <TextField {...params} fullWidth required sx={{ mb: 2 }} disabled={loading} inputProps={{ ...params.inputProps, "data-testid": "tournament-end-date-input" }} />}
        />

        <DatePicker
          label={t('createTournamentForm.registrationDeadlineLabel', 'Registration Deadline')}
          value={registrationDeadline}
          onChange={(newDate) => setRegistrationDeadline(newDate)}
          renderInput={(params) => <TextField {...params} fullWidth required sx={{ mb: 2 }} disabled={loading} inputProps={{ ...params.inputProps, "data-testid": "tournament-reg-deadline-input" }} />}
        />
        <TextField
          label={t('createTournamentForm.locationLabel', 'Location')}
          variant="outlined"
          fullWidth
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
          inputProps={{ "data-testid": "tournament-location-input" }}
        />

        <TextField
          label={t('createTournamentForm.descriptionLabel', 'Description')}
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
          inputProps={{ "data-testid": "tournament-description-input" }}
        />

        {/* Updated League Select */}
        <FormControl fullWidth required sx={{ mb: 2 }} disabled={loading}>
          <InputLabel id="league-select-label">{t('createTournamentForm.leagueLabel', 'League')}</InputLabel>
          <Select
            labelId="league-select-label"
            value={league}
            label={t('createTournamentForm.leagueLabel', 'League')}
            onChange={(e) => setLeague(e.target.value)}
            inputProps={{ "data-testid": "tournament-league-select" }}
          >
            <MenuItem value="school">{t('createTournamentForm.league.school', 'School League')}</MenuItem>
            <MenuItem value="university">{t('createTournamentForm.league.university', 'University League')}</MenuItem>
            {/* Removed 'open' and 'other' options as per request */}
          </Select>
        </FormControl>

        <TextField
          label={t('createTournamentForm.eligibilityLabel', 'Eligibility Criteria')}
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={eligibility}
          onChange={(e) => setEligibility(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
          inputProps={{ "data-testid": "tournament-eligibility-input" }}
        />

        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          {t('createTournamentForm.customFieldsNote', 'Note: After creating the tournament, you can add custom registration fields for participants.')}
        </Typography>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          fullWidth
          sx={{ mt: 2 }}
          data-testid="create-tournament-submit-button"
        >
          {loading ? <CircularProgress size={24} /> : t('createTournamentForm.submitButton', 'Create Tournament')}
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default CreateTournamentForm;
