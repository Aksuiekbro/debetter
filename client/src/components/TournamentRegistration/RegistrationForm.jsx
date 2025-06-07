import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel,
  Checkbox, Paper, Divider, Radio, RadioGroup, FormLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { api } from '../../config/api';

const RegistrationForm = ({ currentUser }) => {
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [tournament, setTournament] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [role, setRole] = useState('Debater');
  const [fieldValues, setFieldValues] = useState({}); // For custom fields
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // State for standard Debater fields
  const [teamName, setTeamName] = useState('');
  const [participantNames, setParticipantNames] = useState(''); // Simple string for now
  const [schoolUniversity, setSchoolUniversity] = useState('');
  
  // Fetch tournament and custom fields
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch tournament details
        const tournamentResponse = await api.client.get(`/api/debates/${tournamentId}`);
        setTournament(tournamentResponse.data);
        
        // Fetch custom fields if tournament has them
        if (tournamentResponse.data.customRegistrationFields) {
          const fieldsResponse = await api.client.get(`/api/debates/${tournamentId}/registration-fields`);
          setCustomFields(fieldsResponse.data.data.fields);
        }
      } catch (err) {
        console.error('Error fetching registration data:', err);
        setError(err.response?.data?.message || 'Failed to load registration data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [tournamentId]);
  
  // Handle field value changes
  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handle standard debater field changes
  const handleStandardFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === 'teamName') setTeamName(value);
    else if (name === 'participantNames') setParticipantNames(value);
    else if (name === 'schoolUniversity') setSchoolUniversity(value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (role === 'Debater') {
        // Prepare payload for Debater/Team registration
        const payload = {
          teamName: teamName.trim(),
          // Assuming participantNames are usernames or emails to identify users
          // Backend will need to resolve these to user IDs.
          // Sending raw string for now, backend needs robust parsing/lookup.
          participantIdentifiers: participantNames.split(',').map(name => name.trim()).filter(name => name),
          institution: schoolUniversity.trim(), // Match field name in embeddedTeamSchema
          customFieldValues: fieldValues
        };

        // Basic frontend validation
        if (!payload.teamName || payload.participantIdentifiers.length === 0 || !payload.institution) {
          setSubmitError(t('registrationForm.missingStandardFields', 'Please fill in all required team information.'));
          setIsSubmitting(false);
          return;
        }

        // TODO: Implement this backend endpoint
        // This endpoint needs to handle team creation/finding, user lookup,
        // participant creation within the tournament, and saving custom fields.
        await api.client.post(`/api/debates/${tournamentId}/register-team`, payload);

        // Navigate on success
        navigate(`/tournaments/${tournamentId}`);

      } else {
        // Existing logic for Judge/Observer registration
        // First join the tournament as an individual participant
        // Note: The 'join' endpoint might need adjustment if it doesn't handle
        // creating the participant record correctly for judges/observers
        // before custom fields are saved. Assuming it does for now.
        await api.client.post(`/api/debates/${tournamentId}/join`, {
          role // Send the selected role (Judge or Observer)
        });

        // If there are custom fields, save their values for the joined participant
        // This uses the endpoint that saves values for the currently logged-in user (req.user._id)
        if (customFields.length > 0 && Object.keys(fieldValues).length > 0) {
          await api.client.post(`/api/debates/${tournamentId}/registration-fields/values`, fieldValues);
        }
         // Navigate on success for Judge/Observer
        navigate(`/tournaments/${tournamentId}`);
      }

    } catch (err) {
      console.error('Error submitting registration:', err);
      // Provide more specific error messages if possible
      setSubmitError(err.response?.data?.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  // Render form
  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        {t('registrationForm.title', 'Tournament Registration')}
      </Typography>
      
      {tournament && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">{tournament.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('registrationForm.format', 'Format')}: {tournament.tournamentFormats?.join(', ')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('registrationForm.leagueType', 'League Type')}: {tournament.leagueType}
          </Typography>
        </Box>
      )}
      
      <Divider sx={{ mb: 3 }} />
      
      <Box component="form" onSubmit={handleSubmit}>
        <FormControl fullWidth margin="normal">
          <FormLabel>{t('registrationForm.role', 'I want to participate as:')}</FormLabel>
          <RadioGroup
            row
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <FormControlLabel value="Debater" control={<Radio />} label={t('registrationForm.debater', 'Debater')} />
            <FormControlLabel value="Judge" control={<Radio />} label={t('registrationForm.judge', 'Judge')} />
            <FormControlLabel value="Observer" control={<Radio />} label={t('registrationForm.observer', 'Observer')} />
          </RadioGroup>
        </FormControl>

        {/* Standard Fields for Debaters */}
        {role === 'Debater' && (
          <>
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              {t('registrationForm.teamInfo', 'Team Information')}
            </Typography>
            <TextField
              label={t('registrationForm.teamName', 'Team Name')}
              name="teamName"
              fullWidth
              required
              value={teamName}
              onChange={handleStandardFieldChange}
              margin="normal"
              disabled={isSubmitting}
            />
            <TextField
              label={t('registrationForm.participantNames', 'Participant Names (comma-separated)')}
              name="participantNames"
              fullWidth
              required
              value={participantNames}
              onChange={handleStandardFieldChange}
              margin="normal"
              disabled={isSubmitting}
              helperText={t('registrationForm.participantNamesHelper', 'Enter names separated by commas')}
            />
            <TextField
              label={t('registrationForm.schoolUniversity', 'School/University')}
              name="schoolUniversity"
              fullWidth
              required
              value={schoolUniversity}
              onChange={handleStandardFieldChange}
              margin="normal"
              disabled={isSubmitting}
            />
          </>
        )}

        {/* Custom Fields Section */}
        {customFields.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              {t('registrationForm.additionalInfo', 'Additional Information')}
            </Typography>
            
            {customFields.map((field) => (
              <Box key={field._id} sx={{ mb: 2 }}>
                {field.fieldType === 'text' && (
                  <TextField
                    label={`${field.fieldName}${field.isRequired ? ' *' : ''}`}
                    fullWidth
                    value={fieldValues[field.fieldName] || ''}
                    onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                    required={field.isRequired}
                  />
                )}
                
                {field.fieldType === 'number' && (
                  <TextField
                    label={`${field.fieldName}${field.isRequired ? ' *' : ''}`}
                    fullWidth
                    type="number"
                    value={fieldValues[field.fieldName] || ''}
                    onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                    required={field.isRequired}
                  />
                )}
                
                {field.fieldType === 'select' && (
                  <FormControl fullWidth required={field.isRequired}>
                    <InputLabel>{field.fieldName}</InputLabel>
                    <Select
                      value={fieldValues[field.fieldName] || ''}
                      onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                      label={field.fieldName}
                    >
                      {field.options.map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                
                {field.fieldType === 'checkbox' && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!fieldValues[field.fieldName]}
                        onChange={(e) => handleFieldChange(field.fieldName, e.target.checked)}
                        required={field.isRequired}
                      />
                    }
                    label={field.fieldName}
                  />
                )}
                
                {field.fieldType === 'date' && (
                  <DatePicker
                    label={`${field.fieldName}${field.isRequired ? ' *' : ''}`}
                    value={fieldValues[field.fieldName] || null}
                    onChange={(value) => handleFieldChange(field.fieldName, value)}
                    renderInput={(params) => <TextField {...params} fullWidth required={field.isRequired} />}
                  />
                )}
              </Box>
            ))}
          </>
        )}
        
        {submitError && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {submitError}
          </Alert>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/tournaments/${tournamentId}`)}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : (
              t('registrationForm.register', 'Register')
            )}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default RegistrationForm;
