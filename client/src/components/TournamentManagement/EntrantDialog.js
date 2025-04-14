import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Grid, // For layout
  Autocomplete, // Import Autocomplete
  RadioGroup,   // Import RadioGroup
  FormControlLabel, // Import FormControlLabel
  Radio,          // Import Radio
  CircularProgress // For loading state in Autocomplete
} from '@mui/material';
import { useTranslation } from 'react-i18next';

// Updated props: removed isEditing, teams; added availableUsers
const EntrantDialog = ({
  open,
  onClose,
  onSubmit, // Corresponds to handleSubmitEntrant from the hook
  entrantForm, // Expects { userId: '', role: 'Debater' }
  onFormChange, // Expects (name, value) signature now
  loading = false,
  availableUsers = [] // Users list from the hook
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Title is always "Add Participant" now */}
      <DialogTitle>{t('entrantDialog.addTitle', { defaultValue: 'Add Participant' })}</DialogTitle>
      <DialogContent sx={{ pt: '20px !important' }}> {/* Add padding top */}
        {/* User Selection Autocomplete */}
        <Autocomplete
          id="user-select-autocomplete"
          options={availableUsers}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`} // Display name and email
          value={availableUsers.find(user => user._id === entrantForm.userId) || null} // Find the selected user object
          onChange={(event, newValue) => {
            onFormChange('userId', newValue ? newValue._id : ''); // Update form state with selected user's ID
          }}
          isOptionEqualToValue={(option, value) => option._id === value?._id}
          loading={loading} // Show loading indicator while fetching users
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('entrantDialog.userLabel', { defaultValue: 'Select User' })}
              variant="outlined"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
          sx={{ mb: 2 }} // Margin bottom
        />

        {/* Role Selection RadioGroup */}
        <FormControl component="fieldset" fullWidth margin="dense" disabled={loading}>
          <InputLabel shrink htmlFor="role-radio-group">{t('entrantDialog.roleLabel', { defaultValue: 'Assign Role' })}</InputLabel>
          <RadioGroup
            aria-label="role"
            id="role-radio-group"
            name="role" // Name matches the state key in the hook
            value={entrantForm.role}
            onChange={(e) => onFormChange('role', e.target.value)} // Use the updated handler
            row // Display radios horizontally
            sx={{ pt: 1 }} // Padding top for spacing from label
          >
            <FormControlLabel value="Debater" control={<Radio />} label={t('roles.debater', { defaultValue: 'Debater' })} />
            <FormControlLabel value="Judge" control={<Radio />} label={t('roles.judge', { defaultValue: 'Judge' })} />
            {/* Add other roles if needed, ensure they match backend expectations */}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
        {/* onSubmit now directly calls the hook's submit function */}
        <Button onClick={onSubmit} color="primary" disabled={loading || !entrantForm.userId}> {/* Disable if no user selected */}
          {loading
            ? t('common.adding', { defaultValue: 'Adding...' })
            : t('common.add', { defaultValue: 'Add' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EntrantDialog;