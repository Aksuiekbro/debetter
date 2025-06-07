import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../config/api'; // Import the API configuration
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid
} from '@mui/material';

const TeamRegistrationForm = ({ tournamentId, onClose, onSuccess }) => {
  const { t } = useTranslation();

  // State for standard fields
  const [teamName, setTeamName] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [clubName, setClubName] = useState('');
  const [city, setCity] = useState('');
  const [institute, setInstitute] = useState('');

  // State for custom fields fetched from API
  const [customFields, setCustomFields] = useState([]);
  // State for answers to custom fields { fieldId: answer }
  const [customAnswers, setCustomAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Fetch custom registration fields when the component mounts or tournamentId changes
  useEffect(() => {
    if (!tournamentId) return;

    const fetchCustomFields = async () => {
      setLoading(true);
      setError(null);
      try {
        // ASSUMED ENDPOINT: /api/tournaments/:tournamentId/registration-fields
        // This endpoint needs to be created on the backend.
        const response = await api.client.get(`/api/tournaments/${tournamentId}/registration-fields`);
        setCustomFields(response.data || []); // Ensure it's an array
      } catch (err) {
        console.error("Error fetching custom registration fields:", err);
        setError(t('teamRegistrationForm.errors.fetchFields', 'Failed to load registration fields. Please try again.'));
        setCustomFields([]); // Reset on error
      } finally {
        setLoading(false);
      }
    };

    fetchCustomFields();
  }, [tournamentId, t]); // Added t as dependency for error message translation

  // Handler for standard input changes
  const handleStandardChange = (event) => {
    const { name, value } = event.target;
    switch (name) {
      case 'teamName': setTeamName(value); break;
      case 'member1': setMember1(value); break;
      case 'member2': setMember2(value); break;
      case 'clubName': setClubName(value); break;
      case 'city': setCity(value); break;
      case 'institute': setInstitute(value); break;
      default: break;
    }
  };

  // Handler for custom input changes
  const handleCustomChange = (event) => {
    const { name, value } = event.target;
    // Extract fieldId from the name (e.g., "custom-60b8d295f1d2a50015b4e8d1")
    const fieldId = name.split('-')[1];
    setCustomAnswers(prevAnswers => ({
      ...prevAnswers,
      [fieldId]: value,
    }));
  };


  // Handles form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true); // Indicate loading state

    // 1. Prepare Payload
    const formattedCustomAnswers = Object.entries(customAnswers).map(([fieldId, answer]) => ({
      fieldId,
      answer,
    }));

    const payload = {
      teamName,
      member1,
      member2,
      clubName,
      city,
      institute,
      customAnswers: formattedCustomAnswers,
    };

    try {
      // 2. API Call
      await api.client.post(`/api/tournaments/${tournamentId}/register/team`, payload);

      // 3. Handle Success
      console.log('Team registration successful');
      if (onSuccess) {
        onSuccess(); // Notify parent component of success
      }
      if (onClose) {
        onClose(); // Close the modal/form
      }
    } catch (err) {
      // 4. Handle Error
      console.error("Error submitting team registration:", err);
      const errorMessage = err.response?.data?.message || t('teamRegistrationForm.errors.submitFailed', 'Failed to register team. Please check your input and try again.');
      setError(errorMessage);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t('teamRegistrationForm.title', 'Register Your Team')}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="teamName"
            label={t('teamRegistrationForm.teamName', 'Team Name')}
            name="teamName"
            autoComplete="organization"
            value={teamName}
            onChange={handleStandardChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="member1"
            label={t('teamRegistrationForm.member1', 'Member 1 Name')}
            name="member1"
            value={member1}
            onChange={handleStandardChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="member2"
            label={t('teamRegistrationForm.member2', 'Member 2 Name')}
            name="member2"
            value={member2}
            onChange={handleStandardChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="clubName"
            label={t('teamRegistrationForm.clubName', 'Club Name')}
            name="clubName"
            value={clubName}
            onChange={handleStandardChange}
          />
        </Grid>
         <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="city"
            label={t('teamRegistrationForm.city', 'City')}
            name="city"
            value={city}
            onChange={handleStandardChange}
          />
        </Grid>
         <Grid item xs={12}>
          <TextField
            required
            fullWidth
            id="institute"
            label={t('teamRegistrationForm.institute', 'Institute/School')}
            name="institute"
            value={institute}
            onChange={handleStandardChange}
          />
        </Grid>

        {/* Dynamically loaded custom fields */}
        {loading && (
           <Grid item xs={12}>
               <Typography>{t('common.loading', 'Loading...')}</Typography>
           </Grid>
        )}
        {error && (
           <Grid item xs={12}>
               <Typography color="error">{error}</Typography>
           </Grid>
        )}
        {!loading && !error && customFields.map((field) => (
          <Grid item xs={12} key={field._id}> {/* Assuming field has a unique _id */}
            <TextField
              required={field.required} // Use required status from fetched field data
              fullWidth
              id={`custom-${field._id}`}
              label={field.label} // Use label from fetched field data
              name={`custom-${field._id}`} // Name includes ID for handler
              value={customAnswers[field._id] || ''} // Get value from customAnswers state
              onChange={handleCustomChange} // Use custom handler
              // Consider adding other props based on field.type (e.g., type="number") if available
            />
          </Grid>
        ))}
      </Grid>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        {t('common.submit', 'Submit')}
      </Button>
    </Box>
  );
};

export default TeamRegistrationForm;