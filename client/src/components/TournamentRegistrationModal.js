import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, CircularProgress, Alert, TextField, FormControl, InputLabel,
  Select, MenuItem, Checkbox, FormControlLabel, FormGroup, Typography
} from '@mui/material';
import { api } from '../config/api';

export function TournamentRegistrationModal({ open, onClose, tournamentId, onSuccess }) {
  const { t } = useTranslation();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchFields = useCallback(async () => {
    if (!tournamentId || !open) return; // Don't fetch if no ID or not open
    setLoading(true);
    setError(null);
    setFields([]); // Clear previous fields
    setFormValues({}); // Clear previous values
    try {
      const response = await api.client.get(`/api/tournaments/${tournamentId}/registration-fields`);
      // Adjust based on actual API response structure (assuming similar to CustomRegistrationFields)
      let foundFields = [];
      if (response.data?.data?.fields && Array.isArray(response.data.data.fields)) {
          foundFields = response.data.data.fields;
      } else if (response.data?.fields && Array.isArray(response.data.fields)) {
          foundFields = response.data.fields;
      } else if (Array.isArray(response.data)) {
          foundFields = response.data;
      }
      // Sort fields by displayOrder if available
      foundFields.sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
      setFields(foundFields);

      // Initialize form values
      const initialValues = {};
      foundFields.forEach(field => {
        initialValues[field._id] = field.fieldType === 'checkbox' ? false : '';
      });
      setFormValues(initialValues);

    } catch (err) {
      console.error('Error fetching registration fields for modal:', err);
      setError(err.response?.data?.message || t('tournamentRegistrationModal.errors.loadFailed', 'Failed to load registration fields'));
    } finally {
      setLoading(false);
    }
  }, [tournamentId, open, t]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]); // Rerun when fetchFields changes (due to open or tournamentId)

  const handleInputChange = (fieldId, value) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId, checked) => {
    setFormValues(prev => ({ ...prev, [fieldId]: checked }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Basic validation (check required fields)
    for (const field of fields) {
      if (field.isRequired && !formValues[field._id] && field.fieldType !== 'checkbox') {
         // Allow empty string for non-checkbox, but boolean false for checkbox is valid
         if (formValues[field._id] !== false) {
            setSubmitError(t('tournamentRegistrationModal.errors.requiredField', 'Please fill in all required fields ({{fieldName}}).', { fieldName: field.fieldName }));
            setIsSubmitting(false);
            return;
         }
      }
    }


    try {
      // Call the existing join endpoint, but now include customFields in the body
      await api.client.post(`/api/debates/${tournamentId}/join`, {
        customFieldValues: formValues // Send the collected values
      });
      onSuccess(); // Notify parent component (e.g., DebateDetails)
      onClose(); // Close the modal
    } catch (err) {
      console.error('Error joining tournament with custom fields:', err);
      setSubmitError(err.response?.data?.message || t('tournamentRegistrationModal.errors.submitFailed', 'Failed to register for the tournament.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formValues[field._id];

    switch (field.fieldType) {
      case 'text':
      case 'number':
        return (
          <TextField
            key={field._id}
            label={field.fieldName}
            type={field.fieldType}
            value={value || ''}
            onChange={(e) => handleInputChange(field._id, e.target.value)}
            required={field.isRequired}
            fullWidth
            margin="normal"
          />
        );
      case 'select':
        return (
          <FormControl key={field._id} fullWidth margin="normal" required={field.isRequired}>
            <InputLabel>{field.fieldName}</InputLabel>
            <Select
              value={value || ''}
              onChange={(e) => handleInputChange(field._id, e.target.value)}
              label={field.fieldName}
            >
              <MenuItem value=""><em>{t('common.none', 'None')}</em></MenuItem>
              {field.options.map(option => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'checkbox':
        return (
          <FormGroup key={field._id} sx={{ mt: 1, mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!value}
                  onChange={(e) => handleCheckboxChange(field._id, e.target.checked)}
                  required={field.isRequired} // Note: HTML required doesn't work well on checkbox groups like this
                />
              }
              label={field.fieldName + (field.isRequired ? ' *' : '')}
            />
             {/* Display required message more explicitly if needed */}
             {field.isRequired && !value && (
                 <Typography variant="caption" color="error" sx={{ pl: 4 }}>
                     {t('tournamentRegistrationModal.errors.checkboxRequired', 'This field is required.')}
                 </Typography>
             )}
          </FormGroup>
        );
      case 'date':
         return (
           <TextField
             key={field._id}
             label={field.fieldName}
             type="date"
             value={value || ''}
             onChange={(e) => handleInputChange(field._id, e.target.value)}
             required={field.isRequired}
             fullWidth
             margin="normal"
             InputLabelProps={{
               shrink: true,
             }}
           />
         );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('tournamentRegistrationModal.title', 'Register for Tournament')}</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
            <CircularProgress />
          </Box>
        )}
        {error && !loading && <Alert severity="error">{error}</Alert>}
        {!loading && !error && fields.length === 0 && (
          <Typography sx={{ mt: 2 }}>
            {t('tournamentRegistrationModal.noCustomFields', 'No additional information required for registration.')}
          </Typography>
        )}
        {!loading && !error && fields.length > 0 && (
          <Box component="form" noValidate autoComplete="off" sx={{ pt: 1 }}>
            {fields.map(renderField)}
          </Box>
        )}
        {submitError && <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t('common.cancel', 'Cancel')}
        </Button>
        {/* Only show submit if not loading/error OR if there are no fields */}
        {!loading && !error && (
             <Button
               onClick={handleSubmit}
               variant="contained"
               color="primary"
               disabled={isSubmitting || loading} // Disable while loading fields too
             >
               {isSubmitting
                 ? t('common.submitting', 'Submitting...')
                 : (fields.length > 0
                      ? t('tournamentRegistrationModal.submitButton', 'Submit Registration')
                      : t('tournamentRegistrationModal.joinButton', 'Join Tournament') // Different text if no fields
                   )
               }
             </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

