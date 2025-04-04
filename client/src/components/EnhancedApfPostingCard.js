import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  Paper,
  Tabs,
  Tab,
  IconButton,
  Divider,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Link as LinkIcon,
  VideoCall as VideoIcon,
  Room as LocationIcon,
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  ContentCopy as DuplicateIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Predefined theme options
const predefinedThemes = [
  { id: 'th1', label: 'This House Believes that social media has improved public discourse' },
  { id: 'th2', label: 'This House Would restrict the development of artificial intelligence' },
  { id: 'th3', label: 'This House Would implement universal basic income' },
  { id: 'th4', label: 'This House Believes that democracy is in decline globally' },
  { id: 'th5', label: 'This House Would prioritize environmental protection over economic growth' },
];

// Helper function to reorder items in a drag and drop list
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// TabPanel component for tabbed interface
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`posting-tabpanel-${index}`}
      aria-labelledby={`posting-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EnhancedApfPostingCard = ({
  teams = [],
  judges = [],
  themes = predefinedThemes,
  currentCardData = { 
    team1: null, 
    team2: null, 
    location: '', 
    virtualLink: '',
    judges: [], 
    theme: null, 
    customModel: '', 
    useCustomModel: false,
    scheduledTime: null,
    status: 'scheduled',
    notifyParticipants: true,
    batchName: ''
  },
  batchMode = false,
  onInputChange = () => {},
  onConfirm = () => {},
  onBatchCreate = () => {}
}) => {
  const { t } = useTranslation();
  // Local state
  const [useCustomModel, setUseCustomModel] = useState(currentCardData.useCustomModel || false);
  const [locationMode, setLocationMode] = useState(currentCardData.virtualLink ? 'virtual' : 'physical');
  const [tabValue, setTabValue] = useState(0);
  const [batchGames, setBatchGames] = useState([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [currentBatchName, setCurrentBatchName] = useState(currentCardData.batchName || '');
  
  // Handlers for form inputs
  const handleAutocompleteChange = (fieldName, newValue) => {
    onInputChange(fieldName, newValue);
  };

  const handleMultiAutocompleteChange = (fieldName, newValue) => {
    onInputChange(fieldName, newValue);
  };

  const handleTextFieldChange = (event) => {
    const { name, value } = event.target;
    onInputChange(name, value);
  };

  const handleCustomModelToggle = (event) => {
    const newValue = event.target.checked;
    setUseCustomModel(newValue);
    onInputChange('useCustomModel', newValue);
    
    if (newValue) {
      onInputChange('theme', null);
    } else {
      onInputChange('customModel', '');
    }
  };
  
  const handleLocationModeChange = (event, newMode) => {
    if (newMode !== null) {
      setLocationMode(newMode);
      
      // Clear the other location type
      if (newMode === 'virtual') {
        onInputChange('location', '');
      } else {
        onInputChange('virtualLink', '');
      }
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleDateTimeChange = (newValue) => {
    onInputChange('scheduledTime', newValue);
  };
  
  // Drag and drop handlers for judges
  const onDragEnd = (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const reorderedJudges = reorder(
      currentCardData.judges,
      result.source.index,
      result.destination.index
    );
    
    onInputChange('judges', reorderedJudges);
  };
  
  // Batch creation handlers
  const addGameToBatch = () => {
    // Validate the current game data
    if (!currentCardData.team1 || !currentCardData.team2 || 
        !currentCardData.location && !currentCardData.virtualLink || 
        currentCardData.judges.length === 0 || 
        (useCustomModel ? !currentCardData.customModel : !currentCardData.theme)) {
      return;
    }
    
    // Add current game to batch
    setBatchGames([...batchGames, { ...currentCardData, id: Date.now() }]);
    
    // Reset form for next game
    onInputChange('team1', null);
    onInputChange('team2', null);
    // Keep location/judges for convenience
  };
  
  const removeGameFromBatch = (gameId) => {
    setBatchGames(batchGames.filter(game => game.id !== gameId));
  };
  
  const handleOpenBatchDialog = () => {
    setBatchDialogOpen(true);
  };
  
  const handleCloseBatchDialog = () => {
    setBatchDialogOpen(false);
  };
  
  const handleSubmitBatch = () => {
    onBatchCreate(batchGames, currentBatchName);
    setBatchGames([]);
    setBatchDialogOpen(false);
  };
  
  const duplicateGame = (game) => {
    // Create a duplicate but with new ID
    const duplicatedGame = { ...game, id: Date.now() };
    setBatchGames([...batchGames, duplicatedGame]);
  };
  
  // Render helper for batch game list
  const renderBatchGameItem = (game, index) => (
    <Paper 
      key={game.id} 
      variant="outlined" 
      sx={{ p: 2, mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1">
          {t('apfPostingCard.batchGameTitle', { index: index + 1, team1: game.team1?.name, team2: game.team2?.name }, `Game ${index + 1}: ${game.team1?.name} vs ${game.team2?.name}`)}
        </Typography>
        <Box>
          <IconButton size="small" onClick={() => duplicateGame(game)}>
            <DuplicateIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => removeGameFromBatch(game.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Chip 
          size="small" 
          icon={<CalendarIcon />} 
          label={game.scheduledTime ? new Date(game.scheduledTime).toLocaleString() : t('apfPostingCard.notScheduled', 'Not scheduled')}
        />
        <Chip 
          size="small" 
          icon={game.virtualLink ? <VideoIcon /> : <LocationIcon />} 
          label={game.virtualLink || game.location || t('apfPostingCard.noLocation', 'No location')}
        />
        <Chip 
          size="small" 
          label={t('apfPostingCard.judgesCount', { count: game.judges.length }, `${game.judges.length} Judges`)}
        />
      </Stack>
    </Paper>
  );

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {batchMode ? t('apfPostingCard.createMultipleTitle', 'Create Multiple APF Games') : t('apfPostingCard.newPostingTitle', 'New APF Game Posting')}
        </Typography>
        
        {/* Tabs for different sections */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="posting tabs">
            <Tab label={t('apfPostingCard.tabBasicInfo', 'Basic Info')} />
            <Tab label={t('apfPostingCard.tabTeamsJudges', 'Teams & Judges')} />
            <Tab label={t('apfPostingCard.tabThemeDetails', 'Theme & Details')} />
            <Tab label={t('apfPostingCard.tabScheduleNotifications', 'Schedule & Notifications')} />
          </Tabs>
        </Box>
        
        {/* Basic Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {/* Location settings with toggle */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                {t('apfPostingCard.locationSettingsTitle', 'Location Settings')}
              </Typography>
              <ToggleButtonGroup
                value={locationMode}
                exclusive
                onChange={handleLocationModeChange}
                aria-label="location type"
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="physical" aria-label="physical location">
                  <LocationIcon sx={{ mr: 1 }} />
                  {t('apfPostingCard.physicalLocationButton', 'Physical Location')}
                </ToggleButton>
                <ToggleButton value="virtual" aria-label="virtual meeting">
                  <VideoIcon sx={{ mr: 1 }} />
                  {t('apfPostingCard.virtualMeetingButton', 'Virtual Meeting')}
                </ToggleButton>
              </ToggleButtonGroup>
              
              {locationMode === 'physical' ? (
                <TextField
                  name="location"
                  label={t('apfPostingCard.locationLabel', 'Location (Room/Building)')}
                  variant="outlined"
                  fullWidth
                  value={currentCardData.location || ''}
                  onChange={handleTextFieldChange}
                  placeholder={t('apfPostingCard.locationPlaceholder', 'e.g., Room 101, Main Building')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              ) : (
                <TextField
                  name="virtualLink"
                  label={t('apfPostingCard.virtualLinkLabel', 'Virtual Meeting Link')}
                  variant="outlined"
                  fullWidth
                  value={currentCardData.virtualLink || ''}
                  onChange={handleTextFieldChange}
                  placeholder={t('apfPostingCard.virtualLinkPlaceholder', 'e.g., https://zoom.us/j/123456789')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Grid>
            
            {/* Status selection */}
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="status-label">{t('apfPostingCard.statusLabel', 'Game Status')}</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={currentCardData.status || 'scheduled'}
                  label={t('apfPostingCard.statusLabel', 'Game Status')}
                  onChange={handleTextFieldChange}
                >
                  <MenuItem value="scheduled">{t('apfPostingCard.statusScheduled', 'Scheduled')}</MenuItem>
                  <MenuItem value="in_progress">{t('apfPostingCard.statusInProgress', 'In Progress')}</MenuItem>
                  <MenuItem value="completed">{t('apfPostingCard.statusCompleted', 'Completed')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Teams & Judges Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {/* Team 1 */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={teams}
                getOptionLabel={(option) => option.name || ''}
                value={currentCardData.team1}
                onChange={(event, newValue) => handleAutocompleteChange('team1', newValue)}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderInput={(params) => (
                  <TextField {...params} label={t('apfPostingCard.team1Label', 'Team 1 (Gov)')} variant="outlined" fullWidth />
                )}
              />
            </Grid>

            {/* Team 2 */}
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={teams.filter(team => team.id !== currentCardData.team1?.id)}
                getOptionLabel={(option) => option.name || ''}
                value={currentCardData.team2}
                onChange={(event, newValue) => handleAutocompleteChange('team2', newValue)}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                renderInput={(params) => (
                  <TextField {...params} label={t('apfPostingCard.team2Label', 'Team 2 (Opp)')} variant="outlined" fullWidth />
                )}
                disabled={!currentCardData.team1}
              />
            </Grid>

            {/* Judge Assignment with Drag and Drop */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                {t('apfPostingCard.assignedJudgesTitle', 'Assigned Judges (Drag to reorder priority)')}
              </Typography>
              
              <Box sx={{ display: 'flex', mb: 2 }}>
                <Autocomplete
                  sx={{ flexGrow: 1, mr: 1 }}
                  multiple
                  options={judges}
                  getOptionLabel={(option) => option.name || ''}
                  value={currentCardData.judges}
                  onChange={(event, newValue) => handleMultiAutocompleteChange('judges', newValue)}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  renderInput={(params) => (
                    <TextField {...params} label={t('apfPostingCard.selectJudgesLabel', 'Select Judges')} variant="outlined" fullWidth />
                  )}
                />
              </Box>
              
              {currentCardData.judges.length > 0 && (
                <Paper variant="outlined" sx={{ p: 1, bgcolor: '#f8f8f8' }}>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="judgesList">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {currentCardData.judges.map((judge, index) => (
                            <Draggable key={judge.id} draggableId={judge.id} index={index}>
                              {(provided) => (
                                <Paper
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{ 
                                    p: 1.5, 
                                    mb: 1, 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    bgcolor: index === 0 ? '#e3f2fd' : 'white', // Highlight head judge
                                    borderLeft: index === 0 ? '3px solid #1976d2' : 'none',
                                  }}
                                >
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                                      {index === 0 ? '👑 ' : ''}{judge.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {judge.role || t('apfPostingCard.judgeRole', 'Judge')} • {judge.email || t('apfPostingCard.noEmail', 'No email')}
                                    </Typography>
                                  </Box>
                                  <Chip 
                                    size="small" 
                                    label={index === 0 ? t('apfPostingCard.headJudgeLabel', 'Head Judge') : t('apfPostingCard.judgeLabel', { index: index + 1 }, `Judge ${index + 1}`)}
                                    color={index === 0 ? "primary" : "default"}
                                    variant={index === 0 ? "filled" : "outlined"}
                                  />
                                </Paper>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                    {t('apfPostingCard.dragJudgesHint', 'Drag judges to reorder. The first judge will be designated as the Head Judge.')}
                  </Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Theme & Details Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
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
                label={t('apfPostingCard.useCustomModelLabel', 'Use Custom Debate Model')}
              />
            </Grid>

            {/* Theme or Custom Model */}
            {!useCustomModel ? (
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {t('apfPostingCard.themeSelectionHint', 'Select from predefined themes or create your own debate topic')}
                  </Typography>
                </Box>
                <Autocomplete
                  freeSolo
                  options={themes}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.label || ''}
                  value={currentCardData.theme}
                  onChange={(event, newValue) => handleAutocompleteChange('theme', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('apfPostingCard.themeMotionLabel', 'Theme / Motion')}
                      variant="outlined"
                      fullWidth
                      helperText={t('apfPostingCard.themeHelperText', 'Select from list or type your own custom topic')}
                      placeholder={t('apfPostingCard.themePlaceholder', 'Enter any topic you want to debate...')}
                    />
                  )}
                  onInputChange={(event, newInputValue) => {
                    if (event) {
                      handleAutocompleteChange('theme', newInputValue);
                    }
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Typography variant="body2">{option.label}</Typography>
                    </li>
                  )}
                />
                
                {/* Quick select theme chips */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                    {t('apfPostingCard.quickSelectLabel', 'Quick Select:')}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {predefinedThemes.slice(0, 3).map((theme) => (
                      <Chip 
                        key={theme.id}
                        label={theme.label.substring(0, 30) + '...'}
                        onClick={() => handleAutocompleteChange('theme', theme)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('apfPostingCard.customModelTitle', 'Custom Debate Model')}
                  </Typography>
                  <TextField
                    name="customModel"
                    label={t('apfPostingCard.customModelInputLabel', 'Enter your custom debate model')}
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={6}
                    value={currentCardData.customModel || ''}
                    onChange={handleTextFieldChange}
                    placeholder={t('apfPostingCard.customModelPlaceholder', 'Enter full text for your custom debate model. This will be presented to the teams and judges.')}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t('apfPostingCard.customModelHint', 'Use this area to specify a complete debate model with all rules, formats, and requirements. Teams and judges will see this exact text.')}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Schedule & Notifications Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            {/* Date/Time Picker */}
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label={t('apfPostingCard.scheduleDateTimeLabel', 'Schedule Date & Time')}
                  value={currentCardData.scheduledTime}
                  onChange={handleDateTimeChange}
                  ampm={false}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                {t('apfPostingCard.scheduleHint', 'Set when this debate will take place. Notifications will be sent to participants.')}
              </Typography>
            </Grid>
            
            {/* Notification Control */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={currentCardData.notifyParticipants}
                    onChange={(e) => onInputChange('notifyParticipants', e.target.checked)}
                    color="primary"
                  />
                }
                label={t('apfPostingCard.sendNotificationLabel', 'Send notification to participants')}
              />
              <Typography variant="caption" sx={{ display: 'block', ml: 3, color: 'text.secondary' }}>
                {t('apfPostingCard.notificationHint', 'Judges and team members will receive an email notification about this game assignment')}
              </Typography>
            </Grid>
            
            {/* Batch name - only relevant for batch modes */}
            {batchMode && (
              <Grid item xs={12}>
                <TextField
                  name="batchName"
                  label={t('apfPostingCard.batchNameLabel', "Batch Name (e.g., 'Round 1')")}
                  variant="outlined"
                  fullWidth
                  value={currentCardData.batchName}
                  onChange={handleTextFieldChange}
                  placeholder={t('apfPostingCard.batchNamePlaceholder', 'Enter a name to identify this group of games')}
                />
              </Grid>
            )}
          </Grid>
        </TabPanel>
        
        {/* Batch Mode UI */}
        {batchMode && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                {t('apfPostingCard.batchQueueTitle', { count: batchGames.length }, `Batch Creation Queue (${batchGames.length} games)`)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={addGameToBatch}
                disabled={
                  !currentCardData.team1 || 
                  !currentCardData.team2 || 
                  (!currentCardData.location && !currentCardData.virtualLink) || 
                  currentCardData.judges.length === 0 || 
                  (useCustomModel ? !currentCardData.customModel : !currentCardData.theme)
                }
              >
                {t('apfPostingCard.addToBatchButton', 'Add to Batch')}
              </Button>
            </Box>
            
            {batchGames.length > 0 ? (
              <Box sx={{ maxHeight: '200px', overflowY: 'auto', pr: 1 }}>
                {batchGames.map((game, index) => renderBatchGameItem(game, index))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                {t('apfPostingCard.batchEmptyHint', 'Add games to the batch by filling in the details and clicking "Add to Batch"')}
              </Typography>
            )}
            
            {batchGames.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleOpenBatchDialog}
                >
                  {t('apfPostingCard.saveBatchButton', { count: batchGames.length }, `Save Batch (${batchGames.length} games)`)}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Box>
          {/* Tabs navigation buttons */}
          <Button
            disabled={tabValue === 0}
            onClick={() => setTabValue(tabValue - 1)}
            variant="text"
          >
            {t('apfPostingCard.previousButton', 'Previous')}
          </Button>
          <Button
            disabled={tabValue === 3}
            onClick={() => setTabValue(tabValue + 1)}
            variant="text"
          >
            {t('apfPostingCard.nextButton', 'Next')}
          </Button>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={
            !currentCardData.team1 || 
            !currentCardData.team2 || 
            (!currentCardData.location && !currentCardData.virtualLink) || 
            currentCardData.judges.length === 0 || 
            (useCustomModel ? !currentCardData.customModel : !currentCardData.theme)
          }
        >
          {t('apfPostingCard.confirmPostButton', 'Confirm & Post Game')}
        </Button>
      </CardActions>
      
      {/* Batch Confirmation Dialog */}
      <Dialog open={batchDialogOpen} onClose={handleCloseBatchDialog}>
        <DialogTitle>{t('apfPostingCard.confirmBatchTitle', 'Confirm Batch Creation')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('apfPostingCard.confirmBatchText', { count: batchGames.length }, `You are about to create ${batchGames.length} APF debate games. Please provide a name for this batch (e.g., "Round 1"):`)}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="batchName"
            label={t('apfPostingCard.batchNameDialogLabel', 'Batch Name')}
            type="text"
            fullWidth
            variant="outlined"
            value={currentBatchName}
            onChange={(e) => setCurrentBatchName(e.target.value)}
            sx={{ mt: 2 }}
          />
          
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">
              {t('apfPostingCard.confirmBatchAlert', 'Notifications will be sent to all participants if enabled. Debates will be scheduled according to the times you\'ve specified.')}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBatchDialog}>{t('apfPostingCard.cancelButton', 'Cancel')}</Button>
          <Button onClick={handleSubmitBatch} color="primary" variant="contained">
            {t('apfPostingCard.createBatchGamesButton', { count: batchGames.length }, `Create ${batchGames.length} Games`)}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default EnhancedApfPostingCard; 