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
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [date, setDate] = useState(null); // Renamed for clarity: this is the Start Date
  const [registrationDeadline, setRegistrationDeadline] = useState(null); // Add state for registration deadline
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [category, setCategory] = useState(''); // Add state for category
  const [difficulty, setDifficulty] = useState(''); // Add state for difficulty
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const availableFormats = ['APD', 'BP', 'LD']; // Available debate formats

  const handleFormatChange = (event) => {
    const { value, checked } = event.target;
    setSelectedFormats((prev) =>
      checked ? [...prev, value] : prev.filter((format) => format !== value)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: name, // Use 'title' key
      format: 'tournament',
      tournamentFormats: selectedFormats, // Use 'tournamentFormats' key
      startDate: date ? date.toISOString() : null, // Use 'startDate' key (Start Date)
      registrationDeadline: registrationDeadline ? registrationDeadline.toISOString() : null, // Add registration deadline
      location,
      description,
      eligibilityCriteria: eligibility, // Use 'eligibilityCriteria' key
      category, // Add category
      difficulty, // Add difficulty
    };

    try {
      const response = await api.client.post('/api/debates', payload, { headers: getAuthHeaders() });
      // Assuming response.data.title based on payload key 'title'
      setSuccess(t('createTournamentForm.successMessage', 'Tournament "{{name}}" created successfully!', { name: response.data.title }));
      // Optionally clear the form
      setName('');
      setSelectedFormats([]);
      setDate(null); // Clear Start Date
      setRegistrationDeadline(null); // Clear Registration Deadline
      setLocation('');
      setDescription('');
      setEligibility('');
      setCategory(''); // Clear category
      setDifficulty(''); // Clear difficulty
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

        <Typography variant="subtitle1" gutterBottom>{t('createTournamentForm.formatsLabel', 'Formats')}</Typography>
        <FormGroup row sx={{ mb: 2 }}>
          {availableFormats.map((format) => (
            <FormControlLabel
              key={format}
              control={
                <Checkbox
                  checked={selectedFormats.includes(format)}
                  onChange={handleFormatChange}
                  value={format}
                  disabled={loading}
                />
              }
              label={format}
            />
          ))}
        </FormGroup>

        {/* Category Select */}
        <FormControl fullWidth required sx={{ mb: 2 }} disabled={loading}>
          <InputLabel id="category-select-label">{t('createTournamentForm.categoryLabel', 'Category')}</InputLabel>
          <Select
            labelId="category-select-label"
            value={category}
            label={t('createTournamentForm.categoryLabel', 'Category')}
            onChange={(e) => setCategory(e.target.value)}
            inputProps={{ "data-testid": "tournament-category-select" }}
          >
            {/* Define category options based on schema enum */}
            <MenuItem value="politics">{t('createTournamentForm.category.politics', 'Politics')}</MenuItem>
            <MenuItem value="technology">{t('createTournamentForm.category.technology', 'Technology')}</MenuItem>
            <MenuItem value="science">{t('createTournamentForm.category.science', 'Science')}</MenuItem>
            <MenuItem value="society">{t('createTournamentForm.category.society', 'Society')}</MenuItem>
            <MenuItem value="economics">{t('createTournamentForm.category.economics', 'Economics')}</MenuItem>
          </Select>
        </FormControl>

        {/* Difficulty Select */}
        <FormControl fullWidth required sx={{ mb: 2 }} disabled={loading}>
          <InputLabel id="difficulty-select-label">{t('createTournamentForm.difficultyLabel', 'Difficulty')}</InputLabel>
          <Select
            labelId="difficulty-select-label"
            value={difficulty}
            label={t('createTournamentForm.difficultyLabel', 'Difficulty')}
            onChange={(e) => setDifficulty(e.target.value)}
            inputProps={{ "data-testid": "tournament-difficulty-select" }}
          >
            {/* Define difficulty options based on schema enum */}
            <MenuItem value="beginner">{t('createTournamentForm.difficulty.beginner', 'Beginner')}</MenuItem>
            <MenuItem value="intermediate">{t('createTournamentForm.difficulty.intermediate', 'Intermediate')}</MenuItem>
            <MenuItem value="advanced">{t('createTournamentForm.difficulty.advanced', 'Advanced')}</MenuItem>
          </Select>
        </FormControl>

        <DatePicker
          label={t('createTournamentForm.dateLabel', 'Date')}
          value={date}
          onChange={(newDate) => setDate(newDate)}
          renderInput={(params) => <TextField {...params} fullWidth required sx={{ mb: 2 }} disabled={loading} inputProps={{ ...params.inputProps, "data-testid": "tournament-start-date-input" }} />}
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