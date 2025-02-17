import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const HostDebate = () => {
  const navigate = useNavigate();
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

  const categories = [
    'politics',
    'technology',
    'science',
    'society',
    'economics'
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (formData.maxParticipants < 2) newErrors.maxParticipants = 'Minimum 2 participants required';
    if (formData.requiredJudges < 1) newErrors.requiredJudges = 'At least 1 judge is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (new Date(formData.startDate) < new Date()) newErrors.startDate = 'Start date must be in the future';
    if (formData.duration < 30) newErrors.duration = 'Duration must be at least 30 minutes';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.client.post(api.endpoints.debates, formData);
      navigate(`/debates/${response.data._id}`);
    } catch (error) {
      console.error('Error creating debate:', error);
      setErrors({ 
        submit: error.response?.data?.message || 'Failed to create debate. Please try again.' 
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
          Host a Debate
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Debate Title"
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
                label="Description"
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
                <InputLabel>Category</InputLabel>
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
                <InputLabel>Difficulty</InputLabel>
                <Select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                >
                  <MenuItem value="beginner">Beginner</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Format Selection */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" gutterBottom>
                  Debate Format
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
                    label="Standard Debate" 
                  />
                  <FormControlLabel 
                    value="tournament" 
                    control={<Radio />} 
                    label="Tournament" 
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
                      Tournament Mode
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
                        label="Solo (32 individual participants)" 
                      />
                      <FormControlLabel 
                        value="duo" 
                        control={<Radio />} 
                        label="Duo (16 teams of 2)" 
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {/* Tournament Info */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Tournament Participants"
                    value={32}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SportsIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                    helperText={formData.mode === 'solo' ? '32 individual participants' : '16 teams of 2 (32 total)'}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Required Judges"
                    value={8}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <GavelIcon />
                        </InputAdornment>
                      ),
                      readOnly: true,
                    }}
                    helperText="8 judges required for tournament format"
                  />
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
                    label="Maximum Participants"
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
                    label="Required Judges"
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
                label="Location"
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
                  label="Start Date & Time"
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
                  minDateTime={new Date()}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
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

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                Create Debate
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default HostDebate;