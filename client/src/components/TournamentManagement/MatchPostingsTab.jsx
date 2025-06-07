import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Publish as PublishIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { api } from '../../config/api';

// TabPanel component for the inner tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`match-postings-tabpanel-${index}`}
      aria-labelledby={`match-postings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MatchPostingsTab = ({ currentUser, isViewOnly }) => { // Add isViewOnly prop
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postings, setPostings] = useState([]);
  const [generatedPostings, setGeneratedPostings] = useState([]);
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedRoundType, setSelectedRoundType] = useState('preliminary');
  const [maxRound, setMaxRound] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [generateOptions, setGenerateOptions] = useState({
    round: 1,
    roundType: 'preliminary',
    avoidRematches: true,
    avoidSameClub: true
  });
  
  // Fetch match postings
  const fetchPostings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.client.get(
        `/api/debates/${tournamentId}/match-postings`,
        {
          params: {
            round: selectedRound,
            roundType: selectedRoundType
          }
        }
      );
      setPostings(response.data.data.postings);
      
      // Fetch max round
      const maxRoundResponse = await api.client.get(
        `/api/debates/${tournamentId}/match-postings/max-round`,
        {
          params: {
            roundType: selectedRoundType
          }
        }
      );
      setMaxRound(maxRoundResponse.data.data.maxRound);
      
      // If no round is selected and there are rounds, select the max round
      if (selectedRound === 0 && maxRoundResponse.data.data.maxRound > 0) {
        setSelectedRound(maxRoundResponse.data.data.maxRound);
      }
    } catch (err) {
      console.error('Error fetching match postings:', err);
      setError(err.response?.data?.message || 'Failed to load match postings');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchPostings();
  }, [tournamentId, selectedRound, selectedRoundType]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle round change
  const handleRoundChange = (event) => {
    setSelectedRound(parseInt(event.target.value, 10));
  };
  
  // Handle round type change
  const handleRoundTypeChange = (event) => {
    setSelectedRoundType(event.target.value);
    setSelectedRound(1); // Reset to round 1 when changing round type
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPostings();
    setRefreshing(false);
  };
  
  // Handle generate dialog open
  const handleOpenGenerateDialog = () => {
    setGenerateOptions({
      round: selectedRound > 0 ? selectedRound : maxRound + 1,
      roundType: selectedRoundType,
      avoidRematches: true,
      avoidSameClub: true
    });
    setOpenGenerateDialog(true);
  };
  
  // Handle generate dialog close
  const handleCloseGenerateDialog = () => {
    setOpenGenerateDialog(false);
  };
  
  // Handle generate options change
  const handleGenerateOptionsChange = (event) => {
    const { name, value, checked } = event.target;
    setGenerateOptions(prev => ({
      ...prev,
      [name]: name === 'round' ? parseInt(value, 10) : (name === 'avoidRematches' || name === 'avoidSameClub' ? checked : value)
    }));
  };
  
  // Handle generate postings
  const handleGeneratePostings = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await api.client.post(
        `/api/debates/${tournamentId}/match-postings/generate`,
        generateOptions
      );
      setGeneratedPostings(response.data.data.postings);
      setTabValue(1); // Switch to Generated tab
      handleCloseGenerateDialog();
    } catch (err) {
      console.error('Error generating match postings:', err);
      setError(err.response?.data?.message || 'Failed to generate match postings');
    } finally {
      setGenerating(false);
    }
  };
  
  // Handle save postings
  const handleSavePostings = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.client.post(
        `/api/debates/${tournamentId}/match-postings/save`,
        { postings: generatedPostings }
      );
      setGeneratedPostings([]);
      setTabValue(0); // Switch back to Current tab
      await fetchPostings(); // Refresh postings
    } catch (err) {
      console.error('Error saving match postings:', err);
      setError(err.response?.data?.message || 'Failed to save match postings');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle confirm postings
  const handleConfirmPostings = async () => {
    setConfirming(true);
    setError(null);
    try {
      await api.client.post(
        `/api/debates/${tournamentId}/match-postings/confirm`,
        {
          round: selectedRound,
          roundType: selectedRoundType
        }
      );
      await fetchPostings(); // Refresh postings
    } catch (err) {
      console.error('Error confirming match postings:', err);
      setError(err.response?.data?.message || 'Failed to confirm match postings');
    } finally {
      setConfirming(false);
    }
  };
  
  // Handle publish postings
  const handlePublishPostings = async () => {
    setPublishing(true);
    setError(null);
    try {
      await api.client.post(
        `/api/debates/${tournamentId}/match-postings/publish`,
        {
          round: selectedRound,
          roundType: selectedRoundType
        }
      );
      await fetchPostings(); // Refresh postings
    } catch (err) {
      console.error('Error publishing match postings:', err);
      setError(err.response?.data?.message || 'Failed to publish match postings');
    } finally {
      setPublishing(false);
    }
  };
  
  // Check if user is organizer
  const isOrganizer = currentUser?.role === 'organizer';
  
  // Check if there are confirmed postings
  const hasConfirmedPostings = postings.some(posting => posting.confirmed);
  
  // Check if all postings are confirmed
  const allPostingsConfirmed = postings.length > 0 && postings.every(posting => posting.confirmed);
  
  // Check if there are published postings
  const hasPublishedPostings = postings.some(posting => posting.published);
  
  // Check if all postings are published
  const allPostingsPublished = postings.length > 0 && postings.every(posting => posting.published);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('matchPostingsTab.title', { defaultValue: 'Match Postings' })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? t('matchPostingsTab.refreshing', { defaultValue: 'Refreshing...' }) : t('matchPostingsTab.refresh', { defaultValue: 'Refresh' })}
          </Button>
          {isOrganizer && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenGenerateDialog}
              disabled={generating}
            >
              {t('matchPostingsTab.generate', { defaultValue: 'Generate Postings' })}
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label={t('matchPostingsTab.currentTab', { defaultValue: 'Current Postings' })} />
          {generatedPostings.length > 0 && (
            <Tab label={t('matchPostingsTab.generatedTab', { defaultValue: 'Generated Postings' })} />
          )}
        </Tabs>

        {/* Current Postings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel id="round-type-select-label">
                  {t('matchPostingsTab.roundType', { defaultValue: 'Round Type' })}
                </InputLabel>
                <Select
                  labelId="round-type-select-label"
                  value={selectedRoundType}
                  label={t('matchPostingsTab.roundType', { defaultValue: 'Round Type' })}
                  onChange={handleRoundTypeChange}
                >
                  <MenuItem value="preliminary">
                    {t('matchPostingsTab.preliminary', { defaultValue: 'Preliminary' })}
                  </MenuItem>
                  <MenuItem value="playoff">
                    {t('matchPostingsTab.playoff', { defaultValue: 'Playoff' })}
                  </MenuItem>
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel id="round-select-label">
                  {t('matchPostingsTab.round', { defaultValue: 'Round' })}
                </InputLabel>
                <Select
                  labelId="round-select-label"
                  value={selectedRound}
                  label={t('matchPostingsTab.round', { defaultValue: 'Round' })}
                  onChange={handleRoundChange}
                >
                  {Array.from({ length: Math.max(1, maxRound) }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {selectedRoundType === 'preliminary'
                        ? t('matchPostingsTab.roundNumber', { number: i + 1, defaultValue: `Round ${i + 1}` })
                        : t('matchPostingsTab.playoffRoundNumber', { number: i + 1, defaultValue: `Playoff Round ${i + 1}` })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* Hide Confirm/Publish buttons if view-only */}
            {isOrganizer && !isViewOnly && postings.length > 0 && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                {!allPostingsConfirmed && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={handleConfirmPostings}
                    disabled={confirming || postings.length === 0}
                  >
                    {confirming
                      ? t('matchPostingsTab.confirming', { defaultValue: 'Confirming...' })
                      : t('matchPostingsTab.confirm', { defaultValue: 'Confirm Draw' })}
                  </Button>
                )}
                
                {allPostingsConfirmed && !allPostingsPublished && (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<PublishIcon />}
                    onClick={handlePublishPostings}
                    disabled={publishing || !hasConfirmedPostings}
                  >
                    {publishing
                      ? t('matchPostingsTab.publishing', { defaultValue: 'Publishing...' })
                      : t('matchPostingsTab.publish', { defaultValue: 'Publish Draw' })}
                  </Button>
                )}
              </Box>
            )}
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {postings.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography>
                    {t('matchPostingsTab.noPostings', { defaultValue: 'No postings found for this round' })}
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('matchPostingsTab.teamA', { defaultValue: 'Team A' })}</TableCell>
                        <TableCell>{t('matchPostingsTab.teamB', { defaultValue: 'Team B' })}</TableCell>
                        <TableCell>{t('matchPostingsTab.room', { defaultValue: 'Room' })}</TableCell>
                        <TableCell>{t('matchPostingsTab.judge', { defaultValue: 'Judge' })}</TableCell>
                        <TableCell>{t('matchPostingsTab.status', { defaultValue: 'Status' })}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {postings.map((posting) => (
                        <TableRow key={posting._id}>
                          <TableCell>
                            <Typography variant="body1">{posting.team1?.name || 'Unknown Team'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {posting.team1?.club || 'No Club'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1">{posting.team2?.name || 'Unknown Team'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {posting.team2?.club || 'No Club'}
                            </Typography>
                          </TableCell>
                          <TableCell>{posting.location}</TableCell>
                          <TableCell>
                            {posting.judges?.map(judge => (
                              <div key={judge._id}>{judge.username}</div>
                            ))}
                          </TableCell>
                          <TableCell>
                            {posting.published ? (
                              <Chip
                                label={t('matchPostingsTab.published', { defaultValue: 'Published' })}
                                color="success"
                                size="small"
                              />
                            ) : posting.confirmed ? (
                              <Chip
                                label={t('matchPostingsTab.confirmed', { defaultValue: 'Confirmed' })}
                                color="primary"
                                size="small"
                              />
                            ) : (
                              <Chip
                                label={t('matchPostingsTab.draft', { defaultValue: 'Draft' })}
                                color="default"
                                size="small"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </TabPanel>

        {/* Generated Postings Tab */}
        {generatedPostings.length > 0 && (
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>
                {t('matchPostingsTab.generatedPostingsInfo', { 
                  count: generatedPostings.length,
                  round: generateOptions.round,
                  roundType: generateOptions.roundType,
                  defaultValue: `${generatedPostings.length} postings generated for ${generateOptions.roundType === 'preliminary' ? 'Round' : 'Playoff Round'} ${generateOptions.round}`
                })}
              </Typography>
              
              {/* Hide controls on Generated tab if view-only */}
              {!isViewOnly && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    setGeneratedPostings([]);
                    setTabValue(0);
                  }}
                >
                  {t('matchPostingsTab.discard', { defaultValue: 'Discard' })}
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSavePostings}
                  disabled={saving}
                >
                  {saving
                    ? t('matchPostingsTab.saving', { defaultValue: 'Saving...' })
                    : t('matchPostingsTab.save', { defaultValue: 'Save Postings' })}
                </Button>
              </Box>
              )}
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('matchPostingsTab.teamA', { defaultValue: 'Team A' })}</TableCell>
                    <TableCell>{t('matchPostingsTab.teamB', { defaultValue: 'Team B' })}</TableCell>
                    <TableCell>{t('matchPostingsTab.room', { defaultValue: 'Room' })}</TableCell>
                    <TableCell>{t('matchPostingsTab.judge', { defaultValue: 'Judge' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedPostings.map((posting, index) => (
                    <TableRow key={index}>
                      <TableCell>{posting.team1?.name || 'Unknown Team'}</TableCell>
                      <TableCell>{posting.team2?.name || 'Unknown Team'}</TableCell>
                      <TableCell>{posting.location}</TableCell>
                      <TableCell>{posting.judges?.[0]?.username || 'Unknown Judge'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        )}
      </Paper>

      {/* Generate Postings Dialog */}
      <Dialog open={openGenerateDialog} onClose={handleCloseGenerateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('matchPostingsTab.generatePostingsTitle', { defaultValue: 'Generate Match Postings' })}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="generate-round-type-label">
                {t('matchPostingsTab.roundType', { defaultValue: 'Round Type' })}
              </InputLabel>
              <Select
                labelId="generate-round-type-label"
                name="roundType"
                value={generateOptions.roundType}
                label={t('matchPostingsTab.roundType', { defaultValue: 'Round Type' })}
                onChange={handleGenerateOptionsChange}
              >
                <MenuItem value="preliminary">
                  {t('matchPostingsTab.preliminary', { defaultValue: 'Preliminary' })}
                </MenuItem>
                <MenuItem value="playoff">
                  {t('matchPostingsTab.playoff', { defaultValue: 'Playoff' })}
                </MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label={t('matchPostingsTab.roundNumber', { defaultValue: 'Round Number' })}
              name="round"
              type="number"
              value={generateOptions.round}
              onChange={handleGenerateOptionsChange}
              sx={{ mb: 2 }}
              InputProps={{ inputProps: { min: 1 } }}
            />
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              {t('matchPostingsTab.matchupOptions', { defaultValue: 'Matchup Options' })}
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={generateOptions.avoidRematches}
                  onChange={handleGenerateOptionsChange}
                  name="avoidRematches"
                />
              }
              label={t('matchPostingsTab.avoidRematches', { defaultValue: 'Avoid rematches' })}
              sx={{ mb: 1, display: 'block' }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={generateOptions.avoidSameClub}
                  onChange={handleGenerateOptionsChange}
                  name="avoidSameClub"
                />
              }
              label={t('matchPostingsTab.avoidSameClub', { defaultValue: 'Avoid same-club matchups' })}
              sx={{ mb: 1, display: 'block' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGenerateDialog} disabled={isViewOnly}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button
            onClick={handleGeneratePostings}
            variant="contained"
            disabled={generating || isViewOnly} // Disable if generating or view-only
          >
            {generating
              ? t('matchPostingsTab.generating', { defaultValue: 'Generating...' })
              : t('matchPostingsTab.generate', { defaultValue: 'Generate' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MatchPostingsTab;
