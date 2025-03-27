import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Autocomplete,
  Button,
  Box,
  Grid
} from '@mui/material';

// Placeholder data for Autocomplete options (replace with props later)
const placeholderTeams = [{ id: 't1', name: 'Team Alpha' }, { id: 't2', name: 'Team Beta' }];
const placeholderJudges = [{ id: 'j1', name: 'Judge One' }, { id: 'j2', name: 'Judge Two' }];
const placeholderThemes = [{ id: 'th1', label: 'Theme A' }, { id: 'th2', label: 'Theme B' }];

const ApfPostingCard = ({
  teams = placeholderTeams, // Replace with actual prop
  judges = placeholderJudges, // Replace with actual prop
  themes = placeholderThemes, // Replace with actual prop (optional)
  currentCardData = { team1: null, team2: null, location: '', judges: [], theme: null }, // Replace with actual prop
  onInputChange = () => {}, // Replace with actual prop
  onConfirm = () => {} // Replace with actual prop
}) => {

  // Handlers for Autocomplete components
  const handleAutocompleteChange = (fieldName, newValue) => {
    // For single selection (teams, theme)
    onInputChange(fieldName, newValue);
  };

  const handleMultiAutocompleteChange = (fieldName, newValue) => {
    // For multiple selection (judges)
    onInputChange(fieldName, newValue);
  };

  // Handler for TextField
  const handleTextFieldChange = (event) => {
    const { name, value } = event.target;
    onInputChange(name, value);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          New Game Posting
        </Typography>
        <Grid container spacing={2}>
          {/* Team 1 */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={teams}
              getOptionLabel={(option) => option.name || ''}
              value={currentCardData.team1}
              onChange={(event, newValue) => handleAutocompleteChange('team1', newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField {...params} label="Team 1 (Gov)" variant="outlined" fullWidth />
              )}
            />
          </Grid>

          {/* Team 2 */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={teams.filter(team => team.id !== currentCardData.team1?.id)} // Prevent selecting same team
              getOptionLabel={(option) => option.name || ''}
              value={currentCardData.team2}
              onChange={(event, newValue) => handleAutocompleteChange('team2', newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField {...params} label="Team 2 (Opp)" variant="outlined" fullWidth />
              )}
              disabled={!currentCardData.team1} // Disable until Team 1 is selected
            />
          </Grid>

          {/* Location */}
          <Grid item xs={12} sm={6}>
            <TextField
              name="location"
              label="Location (Room)"
              variant="outlined"
              fullWidth
              value={currentCardData.location}
              onChange={handleTextFieldChange}
            />
          </Grid>

          {/* Judges */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              multiple
              options={judges}
              getOptionLabel={(option) => option.name || ''}
              value={currentCardData.judges}
              onChange={(event, newValue) => handleMultiAutocompleteChange('judges', newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField {...params} label="Judges" variant="outlined" fullWidth />
              )}
            />
          </Grid>

          {/* Theme */}
          <Grid item xs={12}>
            <Autocomplete
              freeSolo // Allows manual input if theme not in list
              options={themes} // Assuming themes have a 'label' property
              getOptionLabel={(option) => typeof option === 'string' ? option : option.label || ''}
              value={currentCardData.theme}
              onChange={(event, newValue) => handleAutocompleteChange('theme', newValue)}
              // isOptionEqualToValue={(option, value) => option.id === value.id} // Adjust if themes have IDs
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Theme / Motion"
                  variant="outlined"
                  fullWidth
                  helperText="Select from list or type a custom theme"
                />
              )}
              onInputChange={(event, newInputValue) => {
                // Handle free solo input - potentially update state differently if needed
                // For now, let onChange handle the final value (string or object)
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          // Add disabled logic based on required fields
          // disabled={!currentCardData.team1 || !currentCardData.team2 || !currentCardData.location || currentCardData.judges.length === 0 || !currentCardData.theme}
        >
          Confirm & Post Game
        </Button>
      </CardActions>
    </Card>
  );
};

export default ApfPostingCard;