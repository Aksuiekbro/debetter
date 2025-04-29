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
  IconButton,
  Tooltip,
  Grid,
  Switch,
  FormControlLabel,
  Checkbox // Added for randomize options
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Shuffle as ShuffleIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  KeyboardTab as KeyboardTabIcon,
  Close as CloseIcon // Added for dialog close
} from '@mui/icons-material';
import { api } from '../../config/api';

// TabPanel component for the inner tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tournament-posting-tabpanel-${index}`}
      aria-labelledby={`tournament-posting-tab-${index}`}
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

const TournamentPostingTab = ({ currentUser, tournamentCreatorId, isViewOnly }) => { // isViewOnly prop added
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();

  // State for teams and rounds
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [pairings, setPairings] = useState({});
  const [submittedRounds, setSubmittedRounds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for active round
  const [activeRound, setActiveRound] = useState(1);
  const [activeRoundType, setActiveRoundType] = useState('preliminary');

  // State for randomizing
  const [randomizing, setRandomizing] = useState(false);
  const [randomizedPairings, setRandomizedPairings] = useState([]);
  const [showRandomizedPairings, setShowRandomizedPairings] = useState(false);

  // State for submitting
  const [submitting, setSubmitting] = useState(false);

  // State for automatic round progression
  const [autoProgressRounds, setAutoProgressRounds] = useState(true);
  const [autoProgressNotification, setAutoProgressNotification] = useState(null);

  // State for dialogs
  const [openRandomizeDialog, setOpenRandomizeDialog] = useState(false);
  const [openManualEntryDialog, setOpenManualEntryDialog] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState({
    avoidRematches: true,
    avoidSameClub: true
  });

  // State for manual entry
  const [manualPairings, setManualPairings] = useState([]);
  const [selectedTeam1, setSelectedTeam1] = useState('');
  const [selectedTeam2, setSelectedTeam2] = useState('');
  const [selectedJudge, setSelectedJudge] = useState('');
  const [roomLocation, setRoomLocation] = useState('');
  const [editingPairingIndex, setEditingPairingIndex] = useState(-1);

  // State for judges
  const [judges, setJudges] = useState([]);

  // Check if user is organizer or admin
  const isOrganizerOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser._id === tournamentCreatorId);

  // Fetch tournament data
  const fetchTournamentData = async () => {
    setLoading(true);
    setError(null);
    let tournamentData; // Declare here to use across steps
    try {
      // Fetch teams
      const teamsResponse = await api.client.get(`/api/debates/${tournamentId}/teams`);
      setTeams(teamsResponse.data.data || []); // Adjust based on actual API response structure

      // Fetch tournament details to get rounds information
      const tournamentResponse = await api.client.get(`/api/debates/${tournamentId}`);
      // Ensure tournamentData is correctly assigned
      // Assuming the structure is { status: 'success', data: { debate: { ... } } } or similar
      tournamentData = tournamentResponse.data?.data?.debate || tournamentResponse.data?.data || tournamentResponse.data;
      if (!tournamentData) {
          // This case might happen if the /api/debates/:id route returns success but no data.debate
          throw new Error("Tournament data structure is unexpected or missing after fetching details.");
      }


      // Fetch judges
      const judgesResponse = await api.client.get(`/api/debates/${tournamentId}/judges`);
      setJudges(judgesResponse.data.data.judges || []); // Assuming structure { data: { judges: [] } }

      // Determine rounds based on tournament format
      // For APB Lincoln-Douglas format, we'll have preliminary rounds and playoff rounds
      const format = tournamentData.format || 'APB Lincoln-Douglas';

      let roundsData = [];
      if (format === 'APB Lincoln-Douglas') {
        // Preliminary rounds (typically 4-6)
        const preliminaryRoundsCount = tournamentData.preliminaryRoundsCount || 4;
        for (let i = 1; i <= preliminaryRoundsCount; i++) {
          roundsData.push({
            id: `preliminary-${i}`,
            name: t('tournamentPostingTab.preliminaryRound', { number: i, defaultValue: `${i} ойын` }),
            type: 'preliminary',
            number: i
          });
        }

        // Playoff rounds (1/8, 1/4, 1/2, final)
        const playoffRounds = [
          { id: 'playoff-1', name: '1/8', type: 'playoff', number: 1 },
          { id: 'playoff-2', name: '1/4', type: 'playoff', number: 2 },
          { id: 'playoff-3', name: '1/2', type: 'playoff', number: 3 },
          { id: 'playoff-4', name: t('tournamentPostingTab.final', { defaultValue: 'Final' }), type: 'playoff', number: 4 }
        ];

        roundsData = [...roundsData, ...playoffRounds];
      }

      setRounds(roundsData);

      // Fetch existing pairings
      const pairingsResponse = await api.client.get(`/api/debates/${tournamentId}/pairings`);
      const pairingsData = pairingsResponse.data.data.pairings || []; // Assuming structure { data: { pairings: [] } }

      // Organize pairings by round
      const pairingsByRound = {};
      const submittedRoundsSet = new Set();

      pairingsData.forEach(pairing => {
        const roundKey = `${pairing.roundType}-${pairing.round}`;
        if (!pairingsByRound[roundKey]) {
          pairingsByRound[roundKey] = [];
        }
        pairingsByRound[roundKey].push(pairing);

        // Track submitted rounds
        if (pairing.published) {
          submittedRoundsSet.add(roundKey);
        }
      });

      setPairings(pairingsByRound);
      setSubmittedRounds(submittedRoundsSet);

    } catch (err) {
      console.error('Error fetching tournament data:', err);
      let specificErrorMessage = t('tournamentPostingTab.error.loadFailed', { defaultValue: 'Failed to load tournament data.' });
      // Check if it's an Axios error with a 404 response
      if (err.response && err.response.status === 404) {
        specificErrorMessage = t('tournamentPostingTab.error.notFound', {
          tournamentId: tournamentId,
          defaultValue: `Tournament with ID ${tournamentId} not found. Please check the ID or navigate from the tournaments list.`
        });
      } else if (err.response) {
        specificErrorMessage = t('tournamentPostingTab.error.apiError', {
          status: err.response.status,
          message: err.response.data?.message || t('tournamentPostingTab.error.unknownApiError', { defaultValue: 'An unknown API error occurred.' }),
          defaultValue: `API Error (${err.response.status}): ${err.response.data?.message || 'An unknown API error occurred.'}`
        });
      } else if (err.request) {
        specificErrorMessage = t('tournamentPostingTab.error.networkError', { defaultValue: 'Network error: Could not connect to the server.' });
      } else {
        specificErrorMessage = t('tournamentPostingTab.error.unexpectedError', { message: err.message, defaultValue: `An unexpected error occurred: ${err.message}` });
      }
      setError(specificErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId, t]); // Added t to dependency array

  // Handle round change
  const handleRoundChange = (event) => {
    const [type, number] = event.target.value.split('-');
    setActiveRoundType(type);
    setActiveRound(parseInt(number, 10));
    // Reset randomized pairings when round changes
    setRandomizedPairings([]);
    setShowRandomizedPairings(false);
  };

  // Handle randomize options change
  const handleRandomizeOptionsChange = (event) => {
    const { name, checked } = event.target;
    setRandomizeOptions(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle randomize dialog open
  const handleOpenRandomizeDialog = () => {
    setOpenRandomizeDialog(true);
  };

  // Handle randomize dialog close
  const handleCloseRandomizeDialog = () => {
    setOpenRandomizeDialog(false);
  };

  // Handle manual entry dialog open
  const handleOpenManualEntryDialog = () => {
    // Initialize manual pairings with any existing randomized pairings if they exist and are for the current round
    const currentRoundKey = `${activeRoundType}-${activeRound}`;
    const existingPairingsForRound = pairings[currentRoundKey] || [];

    if (randomizedPairings.length > 0 && randomizedPairings[0]?.round === activeRound && randomizedPairings[0]?.roundType === activeRoundType) {
        setManualPairings(randomizedPairings);
    } else if (existingPairingsForRound.length > 0) {
        // If there are already submitted pairings for this round, load them for editing
        setManualPairings(existingPairingsForRound);
    } else {
        setManualPairings([]);
    }
    setOpenManualEntryDialog(true);
  };


  // Handle manual entry dialog close
  const handleCloseManualEntryDialog = () => {
    setOpenManualEntryDialog(false);
    setSelectedTeam1('');
    setSelectedTeam2('');
    setSelectedJudge('');
    setRoomLocation('');
    setEditingPairingIndex(-1);
    setError(null); // Clear errors when closing dialog
  };

  // Handle randomize pairings
  const handleRandomizePairings = async () => {
    if (isViewOnly) return; // Prevent action in view-only mode
    setRandomizing(true);
    setError(null);
    try {
      // Call API to randomize pairings
      const response = await api.client.post(`/api/debates/${tournamentId}/pairings/randomize`, {
        round: activeRound,
        roundType: activeRoundType,
        ...randomizeOptions
      });

      setRandomizedPairings(response.data.data.pairings || []);
      setShowRandomizedPairings(true);
      handleCloseRandomizeDialog();
    } catch (err) {
      console.error('Error randomizing pairings:', err);
      setError(err.response?.data?.message || t('tournamentPostingTab.error.randomizeFailed', { defaultValue: 'Failed to randomize pairings' }));
    } finally {
      setRandomizing(false);
    }
  };

  // Handle submit pairings
  const handleSubmitPairings = async () => {
    if (isViewOnly) return; // Prevent action in view-only mode
    setSubmitting(true);
    setError(null);
    try {
      // Determine if pairings are manually created or randomized
      const pairingsToSubmit = randomizedPairings.length > 0 ? randomizedPairings : manualPairings;

      // Call API to submit pairings
      await api.client.post(`/api/debates/${tournamentId}/pairings/submit`, {
        round: activeRound,
        roundType: activeRoundType,
        pairings: pairingsToSubmit // Submit either randomized or manual pairings
      });

      // Add to submitted rounds
      const newSubmittedRounds = new Set(submittedRounds);
      newSubmittedRounds.add(`${activeRoundType}-${activeRound}`);
      setSubmittedRounds(newSubmittedRounds);

      // Refresh data
      await fetchTournamentData();

      // Clear randomized pairings and hide the preview
      setRandomizedPairings([]);
      setShowRandomizedPairings(false);
      setManualPairings([]); // Clear manual pairings as well after submission

      // If auto-progression is enabled, move to the next round
      if (autoProgressRounds) {
        const nextRound = findNextRound();
        if (nextRound) {
          // Get the next round name for the notification
          const nextRoundName = rounds.find(
            round => round.type === nextRound.type && round.number === nextRound.number
          )?.name || `Round ${nextRound.number}`;

          // Update the active round
          setActiveRoundType(nextRound.type);
          setActiveRound(nextRound.number);

          // Show notification
          setAutoProgressNotification({
            message: t('tournamentPostingTab.autoProgressedToRound', {
              round: nextRoundName,
              defaultValue: `Automatically progressed to ${nextRoundName}`
            }),
            timestamp: Date.now()
          });

          // Clear notification after 5 seconds
          setTimeout(() => {
            setAutoProgressNotification(null);
          }, 5000);
        }
      }
    } catch (err) {
      console.error('Error submitting pairings:', err);
      setError(err.response?.data?.message || t('tournamentPostingTab.error.submitFailed', { defaultValue: 'Failed to submit pairings' }));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await fetchTournamentData();
    setRandomizedPairings([]);
    setShowRandomizedPairings(false);
    setError(null); // Clear errors on refresh
  };

  // Handle cancel randomized pairings
  const handleCancelRandomizedPairings = () => {
    if (isViewOnly) return; // Prevent action in view-only mode
    setRandomizedPairings([]);
    setManualPairings([]);
    setShowRandomizedPairings(false);
  };

  // Handle add manual pairing
  const handleAddManualPairing = () => {
    if (isViewOnly) return; // Prevent action in view-only mode
    if (!selectedTeam1) {
      setError(t('tournamentPostingTab.error.selectTeam1', { defaultValue: 'Please select Team 1' }));
      return;
    }

    // Create new pairing object structure expected by backend
    const newPairing = {
      tournament: tournamentId,
      round: activeRound,
      roundType: activeRoundType,
      team1: selectedTeam1, // Send ID
      team2: selectedTeam2 || null, // Send ID or null
      judges: selectedJudge ? [selectedJudge] : [], // Send array of IDs
      location: roomLocation || `Room ${manualPairings.length + 1}`,
      isBye: !selectedTeam2,
      // Include team objects for display purposes in the UI immediately
      _team1Display: teams.find(team => team._id === selectedTeam1),
      _team2Display: selectedTeam2 ? teams.find(team => team._id === selectedTeam2) : null,
      _judgesDisplay: selectedJudge ? [judges.find(judge => judge._id === selectedJudge)] : [],
    };


    // Check if teams are already paired in the current manual list
    const team1AlreadyPaired = manualPairings.some((pairing, index) =>
      index !== editingPairingIndex &&
      (pairing.team1 === selectedTeam1 || pairing.team2 === selectedTeam1)
    );

    const team2AlreadyPaired = selectedTeam2 && manualPairings.some((pairing, index) =>
      index !== editingPairingIndex &&
      (pairing.team1 === selectedTeam2 || pairing.team2 === selectedTeam2)
    );

    if (team1AlreadyPaired) {
      setError(t('tournamentPostingTab.error.team1AlreadyPaired', { defaultValue: 'Team 1 is already paired in this round' }));
      return;
    }

    if (team2AlreadyPaired) {
      setError(t('tournamentPostingTab.error.team2AlreadyPaired', { defaultValue: 'Team 2 is already paired in this round' }));
      return;
    }

    // If editing an existing pairing, update it
    if (editingPairingIndex >= 0) {
      const updatedPairings = [...manualPairings];
      updatedPairings[editingPairingIndex] = newPairing;
      setManualPairings(updatedPairings);
    } else {
      // Otherwise add a new pairing
      setManualPairings([...manualPairings, newPairing]);
    }

    // Reset form
    setSelectedTeam1('');
    setSelectedTeam2('');
    setSelectedJudge('');
    setRoomLocation('');
    setEditingPairingIndex(-1);
    setError(null);
  };

  // Handle edit manual pairing
  const handleEditManualPairing = (index) => {
    if (isViewOnly) return; // Prevent action in view-only mode
    const pairing = manualPairings[index];
    setSelectedTeam1(pairing.team1 || ''); // Use ID
    setSelectedTeam2(pairing.team2 || ''); // Use ID
    setSelectedJudge(pairing.judges?.length > 0 ? pairing.judges[0] : ''); // Use ID
    setRoomLocation(pairing.location || '');
    setEditingPairingIndex(index);
  };

  // Handle delete manual pairing
  const handleDeleteManualPairing = (index) => {
    if (isViewOnly) return; // Prevent action in view-only mode
    const updatedPairings = [...manualPairings];
    updatedPairings.splice(index, 1);
    setManualPairings(updatedPairings);
  };

  // Handle save manual pairings (to preview area)
  const handleSaveManualPairings = () => {
    if (isViewOnly) return; // Prevent action in view-only mode
    // Mark pairings as manually created for potential differentiation later
    const markedPairings = manualPairings.map(pairing => ({
      ...pairing,
      _manuallyCreated: true
    }));

    setRandomizedPairings(markedPairings); // Use randomizedPairings state to show preview
    setShowRandomizedPairings(true);
    handleCloseManualEntryDialog();
  };

  // Get active round pairings (submitted/published)
  const getActiveRoundPairings = () => {
    const roundKey = `${activeRoundType}-${activeRound}`;
    return pairings[roundKey] || [];
  };

  // Get team pairing for a specific round
  const getTeamPairing = (teamId, roundType, roundNumber) => {
    const roundKey = `${roundType}-${roundNumber}`;
    const roundPairings = pairings[roundKey] || [];

    return roundPairings.find(pairing =>
      pairing.team1?._id === teamId || pairing.team2?._id === teamId
    );
  };

  // Find the next round after the current active round
  const findNextRound = () => {
    // Find the index of the current active round
    const currentRoundIndex = rounds.findIndex(
      round => round.type === activeRoundType && round.number === activeRound
    );

    // If we found the current round and it's not the last one
    if (currentRoundIndex >= 0 && currentRoundIndex < rounds.length - 1) {
      // Return the next round
      const nextRound = rounds[currentRoundIndex + 1];
      return {
        type: nextRound.type,
        number: nextRound.number
      };
    }

    // If we're at the last round or couldn't find the current round, return null
    return null;
  };

  // Find randomized pairing for a team in the active round preview
  const getRandomizedPairing = (teamId) => {
    return randomizedPairings.find(pairing =>
      (pairing.team1?._id || pairing.team1) === teamId || (pairing.team2?._id || pairing.team2) === teamId
    );
  };


  // Render cell for team pairing status
  const renderTeamCell = (team, roundType, roundNumber) => {
    const roundKey = `${roundType}-${roundNumber}`;
    const isSubmitted = submittedRounds.has(roundKey);
    const pairing = getTeamPairing(team._id, roundType, roundNumber);

    if (pairing) {
      const opponent = pairing.team1?._id === team._id ? pairing.team2 : pairing.team1;
      const judgeNames = pairing.judges?.map(j => j?.name || 'N/A').join(', ') || t('tournamentPostingTab.noJudgeAssigned', { defaultValue: 'No Judge' });
      const location = pairing.location || t('tournamentPostingTab.noLocation', { defaultValue: 'N/A' });
      const status = pairing.published ? t('tournamentPostingTab.published', { defaultValue: 'Published' }) : t('tournamentPostingTab.pending', { defaultValue: 'Pending' });

      return (
        <Tooltip title={
          <>
            <Typography variant="body2">{t('tournamentPostingTab.opponent', { defaultValue: 'Opponent' })}: {opponent?.name || t('tournamentPostingTab.bye', { defaultValue: 'BYE' })}</Typography>
            <Typography variant="body2">{t('tournamentPostingTab.judge', { defaultValue: 'Judge' })}: {judgeNames}</Typography>
            <Typography variant="body2">{t('tournamentPostingTab.location', { defaultValue: 'Location' })}: {location}</Typography>
            <Typography variant="body2">{t('tournamentPostingTab.status', { defaultValue: 'Status' })}: {status}</Typography>
          </>
        }>
          <Chip
            label={opponent?.name ? opponent.name.substring(0, 10) + '...' : t('tournamentPostingTab.bye', { defaultValue: 'BYE' })}
            size="small"
            color={pairing.isBye ? "secondary" : "primary"}
            variant={isSubmitted ? "filled" : "outlined"}
          />
        </Tooltip>
      );
    } else if (showRandomizedPairings && roundType === activeRoundType && roundNumber === activeRound) {
      // Check if the team is in the randomized preview for the active round
      const randomPairing = getRandomizedPairing(team._id);
      if (randomPairing) {
        const opponent = (randomPairing.team1?._id || randomPairing.team1) === team._id ? (randomPairing._team2Display || randomPairing.team2) : (randomPairing._team1Display || randomPairing.team1);
        const judgeNames = (randomPairing._judgesDisplay || randomPairing.judges)?.map(j => j?.name || 'N/A').join(', ') || t('tournamentPostingTab.noJudgeAssigned', { defaultValue: 'No Judge' });
        const location = randomPairing.location || t('tournamentPostingTab.noLocation', { defaultValue: 'N/A' });

        return (
          <Tooltip title={
            <>
              <Typography variant="body2">{t('tournamentPostingTab.opponent', { defaultValue: 'Opponent' })}: {opponent?.name || t('tournamentPostingTab.bye', { defaultValue: 'BYE' })} ({t('tournamentPostingTab.preview', { defaultValue: 'Preview' })})</Typography>
              <Typography variant="body2">{t('tournamentPostingTab.judge', { defaultValue: 'Judge' })}: {judgeNames}</Typography>
              <Typography variant="body2">{t('tournamentPostingTab.location', { defaultValue: 'Location' })}: {location}</Typography>
            </>
          }>
            <Chip
              label={opponent?.name ? opponent.name.substring(0, 10) + '...' : t('tournamentPostingTab.bye', { defaultValue: 'BYE' })}
              size="small"
              color={randomPairing.isBye ? "secondary" : "warning"} // Warning color for preview
              variant="outlined"
            />
          </Tooltip>
        );
      }
    }

    return '-'; // No pairing found
  };


  // Get available teams for manual pairing dropdowns
  const getAvailableTeams = (excludeTeamId = null) => {
    const pairedTeamIds = new Set(
      manualPairings
        .flatMap(p => [p.team1, p.team2])
        .filter(id => id && id !== excludeTeamId) // Filter out null/undefined and the excluded team
    );
    return teams.filter(team => !pairedTeamIds.has(team._id));
  };

  const availableJudges = judges; // Assuming all fetched judges are available

  const currentRoundKey = `${activeRoundType}-${activeRound}`;
  const isCurrentRoundSubmitted = submittedRounds.has(currentRoundKey);
  const activeRoundPairings = getActiveRoundPairings(); // Submitted pairings for the active round

  if (loading) {
    return <CircularProgress />;
  }

  if (error && !teams.length) { // Show critical error only if loading fundamentally failed
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom>{t('tournamentPostingTab.title', { defaultValue: 'Pairings & Postings' })}</Typography>

      {/* General Error Display */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Auto Progress Notification */}
      {autoProgressNotification && (
        <Alert severity="info" sx={{ mb: 2 }} key={autoProgressNotification.timestamp}>
          {autoProgressNotification.message}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="round-select-label">{t('tournamentPostingTab.selectRound', { defaultValue: 'Select Round' })}</InputLabel>
              <Select
                labelId="round-select-label"
                value={`${activeRoundType}-${activeRound}`}
                label={t('tournamentPostingTab.selectRound', { defaultValue: 'Select Round' })}
                onChange={handleRoundChange}
              >
                {rounds.map((round) => (
                  <MenuItem key={round.id} value={`${round.type}-${round.number}`}>
                    {round.name} {submittedRounds.has(`${round.type}-${round.number}`) ? `(${t('tournamentPostingTab.submitted', { defaultValue: 'Submitted' })})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {!isViewOnly && isOrganizerOrAdmin && ( // Conditionally render management buttons
            <>
              <Grid item xs={6} sm={2} md={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={randomizing ? <CircularProgress size={20} color="inherit" /> : <ShuffleIcon />}
                  onClick={handleOpenRandomizeDialog}
                  disabled={randomizing || submitting || isCurrentRoundSubmitted || showRandomizedPairings}
                  fullWidth
                >
                  {t('tournamentPostingTab.randomize', { defaultValue: 'Randomize' })}
                </Button>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<KeyboardTabIcon />}
                  onClick={handleOpenManualEntryDialog}
                  disabled={randomizing || submitting || isCurrentRoundSubmitted}
                  fullWidth
                >
                  {t('tournamentPostingTab.manualEntry', { defaultValue: 'Manual Entry' })}
                </Button>
              </Grid>
            </>
          )}
          <Grid item xs={6} sm={2} md={1}>
            <Tooltip title={t('tournamentPostingTab.refreshData', { defaultValue: 'Refresh Data' })}>
              <IconButton onClick={handleRefresh} disabled={loading || randomizing || submitting}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          {!isViewOnly && isOrganizerOrAdmin && ( // Conditionally render auto-progress switch
            <Grid item xs={12} sm={4} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoProgressRounds}
                    onChange={(e) => setAutoProgressRounds(e.target.checked)}
                    name="autoProgressRounds"
                    color="primary"
                  />
                }
                label={t('tournamentPostingTab.autoProgressRounds', { defaultValue: 'Auto-Progress Rounds' })}
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Randomized Pairings Preview */}
      {showRandomizedPairings && (
        <Paper sx={{ p: 2, mb: 3, border: '2px solid orange' }}>
          <Typography variant="h6" gutterBottom color="warning.main">
            {randomizedPairings[0]?._manuallyCreated
              ? t('tournamentPostingTab.previewModeManual', { round: activeRound, defaultValue: `Previewing Manual Pairings for Round ${activeRound}` })
              : t('tournamentPostingTab.previewMode', { round: activeRound, defaultValue: `Previewing Randomized Pairings for Round ${activeRound}` })
            }
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('tournamentPostingTab.table.team1', { defaultValue: 'Team 1' })}</TableCell>
                  <TableCell>{t('tournamentPostingTab.table.team2', { defaultValue: 'Team 2' })}</TableCell>
                  <TableCell>{t('tournamentPostingTab.table.judge', { defaultValue: 'Judge' })}</TableCell>
                  <TableCell>{t('tournamentPostingTab.table.location', { defaultValue: 'Location' })}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {randomizedPairings.map((pairing, index) => (
                  <TableRow key={index}>
                    <TableCell>{pairing._team1Display?.name || pairing.team1?.name || 'N/A'}</TableCell>
                    <TableCell>{pairing.isBye ? t('tournamentPostingTab.bye', { defaultValue: 'BYE' }) : (pairing._team2Display?.name || pairing.team2?.name || 'N/A')}</TableCell>
                    <TableCell>{(pairing._judgesDisplay || pairing.judges)?.map(j => j?.name).join(', ') || t('tournamentPostingTab.noJudgeAssigned', { defaultValue: 'No Judge' })}</TableCell>
                    <TableCell>{pairing.location || t('tournamentPostingTab.noLocation', { defaultValue: 'N/A' })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!isViewOnly && isOrganizerOrAdmin && ( // Conditionally render submit/cancel buttons
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                onClick={handleSubmitPairings}
                disabled={submitting || randomizing}
              >
                {t('tournamentPostingTab.submitPairings', { defaultValue: 'Submit Pairings' })}
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelRandomizedPairings}
                disabled={submitting || randomizing}
              >
                {t('tournamentPostingTab.cancel', { defaultValue: 'Cancel' })}
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Main Pairings Table */}
      <Typography variant="h6" gutterBottom>{t('tournamentPostingTab.pairingsGrid', { defaultValue: 'Pairings Grid' })}</Typography>
      <TableContainer component={Paper}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('tournamentPostingTab.table.team', { defaultValue: 'Team' })}</TableCell>
              {rounds.map((round) => (
                <TableCell key={round.id} align="center" sx={{ fontWeight: 'bold' }}>
                  {round.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team._id} hover>
                <TableCell component="th" scope="row">
                  {team.name}
                </TableCell>
                {rounds.map((round) => (
                  <TableCell key={`${team._id}-${round.id}`} align="center">
                    {renderTeamCell(team, round.type, round.number)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Randomize Pairings Dialog */}
      <Dialog open={openRandomizeDialog} onClose={handleCloseRandomizeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{t('tournamentPostingTab.randomizeOptionsTitle', { defaultValue: 'Randomize Pairings Options' })}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('tournamentPostingTab.randomizeDescription', {
              round: activeRound,
              defaultValue: `Configure options for randomizing Round ${activeRound}.`
            })}
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={randomizeOptions.avoidRematches}
                onChange={handleRandomizeOptionsChange}
                name="avoidRematches"
                disabled={isViewOnly} // Disable in view-only
              />
            }
            label={t('tournamentPostingTab.avoidRematches', { defaultValue: 'Avoid Rematches' })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={randomizeOptions.avoidSameClub}
                onChange={handleRandomizeOptionsChange}
                name="avoidSameClub"
                disabled={isViewOnly} // Disable in view-only
              />
            }
            label={t('tournamentPostingTab.avoidSameClub', { defaultValue: 'Avoid Same Club/Institution' })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRandomizeDialog}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
          {!isViewOnly && ( // Conditionally render Randomize button
            <Button
              onClick={handleRandomizePairings}
              variant="contained"
              color="primary"
              disabled={randomizing}
              startIcon={randomizing ? <CircularProgress size={20} color="inherit" /> : <ShuffleIcon />}
            >
              {t('tournamentPostingTab.randomize', { defaultValue: 'Randomize' })}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={openManualEntryDialog} onClose={handleCloseManualEntryDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('tournamentPostingTab.manualEntryTitle', { round: activeRound, defaultValue: `Manual Pairing Entry - Round ${activeRound}` })}
          <IconButton
            aria-label="close"
            onClick={handleCloseManualEntryDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('tournamentPostingTab.manualEntryDescription', {
              defaultValue: 'Manually create or edit pairings for the selected round. Use the form below to add pairings one by one.'
            })}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!isViewOnly && ( // Conditionally render the form section
            <Box component="form" noValidate autoComplete="off" sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel id="manual-team1-label">{t('tournamentPostingTab.table.team1', { defaultValue: 'Team 1' })}</InputLabel>
                    <Select
                      labelId="manual-team1-label"
                      value={selectedTeam1}
                      label={t('tournamentPostingTab.table.team1', { defaultValue: 'Team 1' })}
                      onChange={(e) => setSelectedTeam1(e.target.value)}
                      disabled={isViewOnly} // Disable in view-only
                    >
                      <MenuItem value=""><em>{t('common.select', { defaultValue: 'Select...' })}</em></MenuItem>
                      {getAvailableTeams(selectedTeam2).map((team) => (
                        <MenuItem key={team._id} value={team._id}>{team.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel id="manual-team2-label">{t('tournamentPostingTab.table.team2', { defaultValue: 'Team 2 (Optional - Bye)' })}</InputLabel>
                    <Select
                      labelId="manual-team2-label"
                      value={selectedTeam2}
                      label={t('tournamentPostingTab.table.team2', { defaultValue: 'Team 2 (Optional - Bye)' })}
                      onChange={(e) => setSelectedTeam2(e.target.value)}
                      disabled={isViewOnly} // Disable in view-only
                    >
                      <MenuItem value=""><em>{t('common.selectOrBye', { defaultValue: 'Select or BYE...' })}</em></MenuItem>
                      {getAvailableTeams(selectedTeam1).map((team) => (
                        <MenuItem key={team._id} value={team._id}>{team.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel id="manual-judge-label">{t('tournamentPostingTab.table.judge', { defaultValue: 'Judge (Optional)' })}</InputLabel>
                    <Select
                      labelId="manual-judge-label"
                      value={selectedJudge}
                      label={t('tournamentPostingTab.table.judge', { defaultValue: 'Judge (Optional)' })}
                      onChange={(e) => setSelectedJudge(e.target.value)}
                      disabled={isViewOnly} // Disable in view-only
                    >
                      <MenuItem value=""><em>{t('common.select', { defaultValue: 'Select...' })}</em></MenuItem>
                      {availableJudges.map((judge) => (
                        <MenuItem key={judge._id} value={judge._id}>{judge.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4} md={2}>
                  <TextField
                    label={t('tournamentPostingTab.table.location', { defaultValue: 'Location (Optional)' })}
                    value={roomLocation}
                    onChange={(e) => setRoomLocation(e.target.value)}
                    fullWidth
                    margin="dense"
                    disabled={isViewOnly} // Disable in view-only
                  />
                </Grid>
                <Grid item xs={12} sm={2} md={1}>
                  <Button
                    onClick={handleAddManualPairing}
                    variant="contained"
                    color={editingPairingIndex >= 0 ? "secondary" : "primary"}
                    startIcon={editingPairingIndex >= 0 ? <EditIcon /> : <AddIcon />}
                    disabled={!selectedTeam1 || isViewOnly} // Disable if no team1 or view-only
                    fullWidth
                    sx={{ height: '56px' }} // Align height with text fields/selects
                  >
                    {editingPairingIndex >= 0 ? t('common.update', { defaultValue: 'Update' }) : t('common.add', { defaultValue: 'Add' })}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Table of Manually Added/Edited Pairings */}
          <Typography variant="subtitle1" gutterBottom sx={{ mt: isViewOnly ? 0 : 2 }}>
            {t('tournamentPostingTab.currentManualPairings', { defaultValue: 'Current Manual Pairings' })}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('tournamentPostingTab.table.team1', { defaultValue: 'Team 1' })}</TableCell>
                  <TableCell>{t('tournamentPostingTab.table.team2', { defaultValue: 'Team 2' })}</TableCell>
                  <TableCell>{t('tournamentPostingTab.table.judge', { defaultValue: 'Judge' })}</TableCell>
                  <TableCell>{t('tournamentPostingTab.table.location', { defaultValue: 'Location' })}</TableCell>
                  {!isViewOnly && <TableCell align="right">{t('common.actions', { defaultValue: 'Actions' })}</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {manualPairings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isViewOnly ? 4 : 5} align="center">
                      {t('tournamentPostingTab.noManualPairings', { defaultValue: 'No manual pairings added yet for this round.' })}
                    </TableCell>
                  </TableRow>
                )}
                {manualPairings.map((pairing, index) => (
                  <TableRow key={index}>
                    <TableCell>{pairing._team1Display?.name || teams.find(t => t._id === pairing.team1)?.name || 'N/A'}</TableCell>
                    <TableCell>{pairing.isBye ? t('tournamentPostingTab.bye', { defaultValue: 'BYE' }) : (pairing._team2Display?.name || teams.find(t => t._id === pairing.team2)?.name || 'N/A')}</TableCell>
                    <TableCell>{(pairing._judgesDisplay || pairing.judges)?.map(j => (typeof j === 'string' ? judges.find(jd => jd._id === j)?.name : j?.name)).join(', ') || t('tournamentPostingTab.noJudgeAssigned', { defaultValue: 'No Judge' })}</TableCell>
                    <TableCell>{pairing.location || t('tournamentPostingTab.noLocation', { defaultValue: 'N/A' })}</TableCell>
                    {!isViewOnly && ( // Conditionally render action buttons
                      <TableCell align="right">
                        <Tooltip title={t('common.edit', { defaultValue: 'Edit' })}>
                          <IconButton size="small" onClick={() => handleEditManualPairing(index)} disabled={isViewOnly}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete', { defaultValue: 'Delete' })}>
                          <IconButton size="small" onClick={() => handleDeleteManualPairing(index)} color="error" disabled={isViewOnly}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManualEntryDialog}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
          {!isViewOnly && ( // Conditionally render Save button
            <Button
              onClick={handleSaveManualPairings}
              variant="contained"
              color="primary"
              disabled={manualPairings.length === 0 || isViewOnly}
              startIcon={<SaveIcon />}
            >
              {t('tournamentPostingTab.saveManualPairings', { defaultValue: 'Save & Preview' })}
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default TournamentPostingTab;
