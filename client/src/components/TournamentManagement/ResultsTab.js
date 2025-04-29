import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { api } from '../../config/api';

// TabPanel component for the inner tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
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

const ResultsTab = ({ currentUser, tournamentId, isViewOnly }) => { // Add isViewOnly prop
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [roundResults, setRoundResults] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRound, setSelectedRound] = useState(1);
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [resultForm, setResultForm] = useState({
    teamId: '',
    roundNumber: 1,
    points: 0,
    rank: null,
    speakerPoints: 0,
    notes: '',
    room: '',
    side: ''
  });
  const [maxRounds, setMaxRounds] = useState(4); // Default to 4 rounds

  // Fetch rankings data
  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.client.get(`/api/debates/${tournamentId}/results/rankings`);
      setRankings(response.data.data.rankings);
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError(err.response?.data?.message || 'Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch round results
  const fetchRoundResults = async (round = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = round 
        ? `/api/debates/${tournamentId}/results/rounds?round=${round}`
        : `/api/debates/${tournamentId}/results/rounds`;
      
      const response = await api.client.get(url);
      setRoundResults(response.data.data.roundResults);
      
      // Determine max rounds from the data
      if (response.data.data.roundResults) {
        const rounds = Object.keys(response.data.data.roundResults).map(r => parseInt(r, 10));
        if (rounds.length > 0) {
          setMaxRounds(Math.max(...rounds));
        }
      }
    } catch (err) {
      console.error('Error fetching round results:', err);
      setError(err.response?.data?.message || 'Failed to load round results');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRankings();
    fetchRoundResults();
  }, [tournamentId]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 0) {
      fetchRankings();
    } else {
      fetchRoundResults(selectedRound);
    }
  };

  // Handle search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    if (tabValue === 0) {
      await fetchRankings();
    } else {
      await fetchRoundResults(selectedRound);
    }
    setRefreshing(false);
  };

  // Handle round selection
  const handleRoundChange = (event) => {
    const round = parseInt(event.target.value, 10);
    setSelectedRound(round);
    fetchRoundResults(round);
  };

  // Handle opening the result dialog
  const handleOpenResultDialog = (team = null) => {
    if (team) {
      // Find existing result for this team and round
      const existingResult = team.roundResults?.find(r => r.roundNumber === selectedRound);
      
      if (existingResult) {
        setResultForm({
          teamId: team._id,
          roundNumber: selectedRound,
          points: existingResult.points || 0,
          rank: existingResult.rank || null,
          speakerPoints: existingResult.speakerPoints || 0,
          notes: existingResult.notes || '',
          room: existingResult.room || '',
          side: existingResult.side || ''
        });
      } else {
        setResultForm({
          teamId: team._id,
          roundNumber: selectedRound,
          points: 0,
          rank: null,
          speakerPoints: 0,
          notes: '',
          room: '',
          side: ''
        });
      }
    } else {
      setResultForm({
        teamId: '',
        roundNumber: selectedRound,
        points: 0,
        rank: null,
        speakerPoints: 0,
        notes: '',
        room: '',
        side: ''
      });
    }
    
    setOpenResultDialog(true);
  };

  // Handle closing the result dialog
  const handleCloseResultDialog = () => {
    setOpenResultDialog(false);
  };

  // Handle form field changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setResultForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle submitting the result form
  const handleSubmitResult = async () => {
    if (isViewOnly) return; // Prevent submission in view-only mode
    try {
      const payload = {
        results: [
          {
            teamId: resultForm.teamId,
            points: parseInt(resultForm.points, 10),
            rank: resultForm.rank ? parseInt(resultForm.rank, 10) : null,
            speakerPoints: parseInt(resultForm.speakerPoints, 10),
            notes: resultForm.notes,
            room: resultForm.room,
            side: resultForm.side
          }
        ]
      };
      
      await api.client.post(
        `/api/debates/${tournamentId}/results/rounds/${selectedRound}`,
        payload
      );
      
      // Refresh data
      fetchRoundResults(selectedRound);
      fetchRankings();
      
      // Close dialog
      handleCloseResultDialog();
    } catch (err) {
      console.error('Error submitting result:', err);
      setError(err.response?.data?.message || 'Failed to submit result');
    }
  };

  // Filter teams based on search term
  const filteredRankings = rankings.filter(team => {
    const nameMatch = team.name.toLowerCase().includes(searchTerm);
    const membersMatch = team.members?.some(member => 
      member.userId?.username?.toLowerCase().includes(searchTerm)
    ) || false;
    const clubMatch = (team.club || '').toLowerCase().includes(searchTerm);
    
    return nameMatch || membersMatch || clubMatch;
  });

  // Get round results for the selected round
  const currentRoundResults = roundResults[selectedRound] || [];

  // Check if user is organizer
  const isOrganizer = currentUser?.role === 'organizer';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('resultsTab.title', { defaultValue: 'Tournament Results' })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('resultsTab.searchPlaceholder', { defaultValue: 'Search...' })}
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? t('resultsTab.refreshing', { defaultValue: 'Refreshing...' }) : t('resultsTab.refresh', { defaultValue: 'Refresh' })}
          </Button>
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
          <Tab label={t('resultsTab.rankingsTab', { defaultValue: 'Rankings' })} />
          <Tab label={t('resultsTab.roundResultsTab', { defaultValue: 'Round Results' })} />
        </Tabs>

        {/* Rankings Tab */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('resultsTab.rank', { defaultValue: 'Rank' })}</TableCell>
                    <TableCell>{t('resultsTab.teamName', { defaultValue: 'Team Name' })}</TableCell>
                    <TableCell>{t('resultsTab.members', { defaultValue: 'Members' })}</TableCell>
                    <TableCell>{t('resultsTab.club', { defaultValue: 'Club' })}</TableCell>
                    <TableCell align="center">{t('resultsTab.wins', { defaultValue: 'Wins' })}</TableCell>
                    <TableCell align="center">{t('resultsTab.totalPoints', { defaultValue: 'Total Points' })}</TableCell>
                    <TableCell align="center">{t('resultsTab.speakerPoints', { defaultValue: 'Speaker Points' })}</TableCell>
                    {Array.from({ length: maxRounds }, (_, i) => (
                      <TableCell key={i} align="center">
                        {t('resultsTab.roundPoints', { round: i + 1, defaultValue: `R${i + 1} Points` })}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRankings.map((team) => (
                    <TableRow key={team._id}>
                      <TableCell>
                        {team.rank === 1 && <TrophyIcon color="primary" sx={{ verticalAlign: 'middle', mr: 1 }} />}
                        {team.rank}
                      </TableCell>
                      <TableCell>{team.name}</TableCell>
                      <TableCell>
                        {team.members ? (
                          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                            {team.members.map((member, idx) => (
                              <li key={idx}>{member.userId?.username || 'Unknown'} ({member.role})</li>
                            ))}
                          </ul>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>{team.club || 'N/A'}</TableCell>
                      <TableCell align="center">{team.wins}</TableCell>
                      <TableCell align="center">{team.points}</TableCell>
                      <TableCell align="center">{team.totalSpeakerPoints || 0}</TableCell>
                      {Array.from({ length: maxRounds }, (_, i) => {
                        const roundResult = team.roundResults?.find(r => r.roundNumber === i + 1);
                        return (
                          <TableCell key={i} align="center">
                            {roundResult ? roundResult.points : '-'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  {filteredRankings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7 + maxRounds} align="center">
                        {rankings.length > 0
                          ? t('resultsTab.noTeamsMatch', { defaultValue: 'No teams match search' })
                          : t('resultsTab.noTeams', { defaultValue: 'No teams found' })}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Round Results Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="round-select-label">
                {t('resultsTab.selectRound', { defaultValue: 'Select Round' })}
              </InputLabel>
              <Select
                labelId="round-select-label"
                value={selectedRound}
                label={t('resultsTab.selectRound', { defaultValue: 'Select Round' })}
                onChange={handleRoundChange}
              >
                {Array.from({ length: maxRounds }, (_, i) => (
                  <MenuItem key={i} value={i + 1}>
                    {t('resultsTab.roundNumber', { number: i + 1, defaultValue: `Round ${i + 1}` })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Hide Record Result button if view-only */}
            {isOrganizer && !isViewOnly && (
              <Button
                variant="contained"
                onClick={() => handleOpenResultDialog()}
                disabled={loading}
              >
                {t('resultsTab.recordResult', { defaultValue: 'Record Result' })}
              </Button>
            )}
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('resultsTab.teamName', { defaultValue: 'Team Name' })}</TableCell>
                    <TableCell>{t('resultsTab.members', { defaultValue: 'Members' })}</TableCell>
                    <TableCell align="center">{t('resultsTab.points', { defaultValue: 'Points' })}</TableCell>
                    <TableCell align="center">{t('resultsTab.speakerPoints', { defaultValue: 'Speaker Points' })}</TableCell>
                    <TableCell>{t('resultsTab.room', { defaultValue: 'Room' })}</TableCell>
                    <TableCell>{t('resultsTab.side', { defaultValue: 'Side' })}</TableCell>
                    <TableCell>{t('resultsTab.notes', { defaultValue: 'Notes' })}</TableCell>
                    {/* Hide Actions column if view-only */}
                    {isOrganizer && !isViewOnly && (
                      <TableCell align="right">{t('resultsTab.actions', { defaultValue: 'Actions' })}</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentRoundResults.map((result) => (
                    <TableRow key={result.team.id}>
                      <TableCell>{result.team.name}</TableCell>
                      <TableCell>
                        {result.team.members ? (
                          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                            {result.team.members.map((member, idx) => (
                              <li key={idx}>{member.userId?.username || 'Unknown'} ({member.role})</li>
                            ))}
                          </ul>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell align="center">{result.points}</TableCell>
                      <TableCell align="center">{result.speakerPoints}</TableCell>
                      <TableCell>{result.room || 'N/A'}</TableCell>
                      <TableCell>{result.side || 'N/A'}</TableCell>
                      <TableCell>
                        {result.notes ? (
                          <Tooltip title={result.notes}>
                            <InfoIcon fontSize="small" color="info" />
                          </Tooltip>
                        ) : 'N/A'}
                      </TableCell>
                      {/* Hide Actions cell content if view-only */}
                      {isOrganizer && !isViewOnly && (
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => {
                              // Find the full team object from rankings
                              const team = rankings.find(t => t._id === result.team.id);
                              if (team) {
                                handleOpenResultDialog(team);
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {currentRoundResults.length === 0 && (
                    <TableRow>
                      {/* Adjust colspan based on whether Actions column is visible */}
                      <TableCell colSpan={isOrganizer && !isViewOnly ? 8 : 7} align="center">
                        {t('resultsTab.noResults', { defaultValue: 'No results recorded for this round' })}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Record/Edit Result Dialog - Disable controls if view-only */}
      <Dialog open={openResultDialog} onClose={handleCloseResultDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {resultForm.teamId ? t('resultsTab.editResultTitle', { defaultValue: 'Edit Result' }) : t('resultsTab.recordResultTitle', { defaultValue: 'Record Result' })}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="team-select-label">{t('resultsTab.team', { defaultValue: 'Team' })}</InputLabel>
                <Select
                  labelId="team-select-label"
                  name="teamId"
                  value={resultForm.teamId}
                  label={t('resultsTab.team', { defaultValue: 'Team' })}
                  onChange={handleFormChange}
                  required
                  disabled={isViewOnly || !!resultForm.teamId} // Disable if editing or view-only
                >
                  {rankings.map((team) => (
                    <MenuItem key={team._id} value={team._id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="round-number-label">{t('resultsTab.round', { defaultValue: 'Round' })}</InputLabel>
                <Select
                  labelId="round-number-label"
                  name="roundNumber"
                  value={resultForm.roundNumber}
                  label={t('resultsTab.round', { defaultValue: 'Round' })}
                  onChange={handleFormChange}
                  required
                  disabled={isViewOnly} // Disable form elements
                >
                  {Array.from({ length: maxRounds }, (_, i) => (
                    <MenuItem key={i} value={i + 1}>
                      {t('resultsTab.roundNumber', { number: i + 1, defaultValue: `Round ${i + 1}` })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                name="points"
                label={t('resultsTab.points', { defaultValue: 'Points' })}
                value={resultForm.points}
                onChange={handleFormChange}
                type="number"
                required
                disabled={isViewOnly} // Disable form elements
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                name="rank"
                label={t('resultsTab.rank', { defaultValue: 'Rank' })}
                value={resultForm.rank || ''}
                onChange={handleFormChange}
                type="number"
                disabled={isViewOnly} // Disable form elements
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                name="speakerPoints"
                label={t('resultsTab.speakerPoints', { defaultValue: 'Speaker Points' })}
                value={resultForm.speakerPoints}
                onChange={handleFormChange}
                type="number"
                disabled={isViewOnly} // Disable form elements
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                margin="dense"
                name="room"
                label={t('resultsTab.room', { defaultValue: 'Room' })}
                value={resultForm.room}
                onChange={handleFormChange}
                disabled={isViewOnly} // Disable form elements
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="side-select-label">{t('resultsTab.side', { defaultValue: 'Side' })}</InputLabel>
                <Select
                  labelId="side-select-label"
                  name="side"
                  value={resultForm.side}
                  label={t('resultsTab.side', { defaultValue: 'Side' })}
                  onChange={handleFormChange}
                  disabled={isViewOnly} // Disable form elements
                >
                  <MenuItem value="Gov">{t('resultsTab.gov', { defaultValue: 'Gov' })}</MenuItem>
                  <MenuItem value="Opp">{t('resultsTab.opp', { defaultValue: 'Opp' })}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                margin="dense"
                name="notes"
                label={t('resultsTab.notes', { defaultValue: 'Notes' })}
                value={resultForm.notes}
                onChange={handleFormChange}
                multiline
                rows={3}
                disabled={isViewOnly} // Disable form elements
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResultDialog} disabled={isViewOnly}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button onClick={handleSubmitResult} variant="contained" disabled={isViewOnly}>
            {t('common.save', { defaultValue: 'Save' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultsTab;
