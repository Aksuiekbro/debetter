import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Autocomplete,
  Button,
  Box,
  Grid,
  FormControlLabel,
  Switch,
  Paper
} from '@mui/material';

// Placeholder data for Autocomplete options (replace with props later)
const placeholderTeams = [{ id: 't1', name: 'Team Alpha' }, { id: 't2', name: 'Team Beta' }];
const placeholderJudges = [{ id: 'j1', name: 'Judge One' }, { id: 'j2', name: 'Judge Two' }];
const placeholderThemes = [{ id: 'th1', label: 'Theme A' }, { id: 'th2', label: 'Theme B' }];

const ApfPostingCard = ({
  teams = placeholderTeams, // Replace with actual prop
  judges = placeholderJudges, // Replace with actual prop
  themes = placeholderThemes, // Replace with actual prop (optional)
  currentCardData = { team1: null, team2: null, location: '', judges: [], theme: null, customModel: '', useCustomModel: false }, // Replace with actual prop
  onInputChange = () => {}, // Replace with actual prop
  onConfirm = () => {} // Replace with actual prop
}) => {
  // Local state for the custom model switch
  const [useCustomModel, setUseCustomModel] = useState(currentCardData.useCustomModel || false);

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

  // Handler for custom model switch
  const handleCustomModelToggle = (event) => {
    const newValue = event.target.checked;
    setUseCustomModel(newValue);
    onInputChange('useCustomModel', newValue);
    
    // Clear theme when switching to custom model
    if (newValue) {
      onInputChange('theme', null);
    } else {
      // Clear custom model when switching to theme selection
      onInputChange('customModel', '');
    }
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

          {/* Custom Model Toggle */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={useCustomModel}
                  onChange={handleCustomModelToggle}
                  color="primary"
                />
              }
              label="Use Custom Debate Model"
            />
          </Grid>

          {/* Theme or Custom Model */}
          {!useCustomModel ? (
            <Grid item xs={12}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  You can write any debate topic you want - just type it in the field below.
                </Typography>
              </Box>
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
                    helperText="Select from list or type your own custom topic"
                    placeholder="Enter any topic you want to debate..."
                  />
                )}
                onInputChange={(event, newInputValue) => {
                  // Handle free solo input - update state with the string value
                  if (event) {
                    handleAutocompleteChange('theme', newInputValue);
                  }
                }}
              />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Custom Debate Model
                </Typography>
                <TextField
                  name="customModel"
                  label="Enter your custom debate model"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={6}
                  value={currentCardData.customModel || ''}
                  onChange={handleTextFieldChange}
                  placeholder="Enter full text for your custom debate model. This will be presented to the teams and judges."
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Use this area to specify a complete debate model with all rules, formats, and requirements. 
                  Teams and judges will see this exact text.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={
            !currentCardData.team1 || 
            !currentCardData.team2 || 
            !currentCardData.location || 
            currentCardData.judges.length === 0 || 
            (useCustomModel ? !currentCardData.customModel : !currentCardData.theme)
          }
        >
          Confirm & Post Game
        </Button>
      </CardActions>
    </Card>
  );
};

export default ApfPostingCard;