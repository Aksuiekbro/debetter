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
  FormControlLabel
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Shuffle as ShuffleIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  KeyboardTab as KeyboardTabIcon
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

const TournamentPostingTab = ({ currentUser, tournamentCreatorId }) => {
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
    try {
      // Fetch teams
      const teamsResponse = await api.client.get(`/api/debates/${tournamentId}/teams`);
      setTeams(teamsResponse.data.data.teams || []);

      // Fetch tournament details to get rounds information
      const tournamentResponse = await api.client.get(`/api/debates/${tournamentId}`);
      const tournamentData = tournamentResponse.data.data.tournament;

      // Fetch judges
      const judgesResponse = await api.client.get(`/api/debates/${tournamentId}/judges`);
      setJudges(judgesResponse.data.data.judges || []);

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
      const pairingsData = pairingsResponse.data.data.pairings || [];

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
      setError(err.response?.data?.message || 'Failed to load tournament data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  // Handle round change
  const handleRoundChange = (event) => {
    const [type, number] = event.target.value.split('-');
    setActiveRoundType(type);
    setActiveRound(parseInt(number, 10));
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
    // Initialize manual pairings with any existing randomized pairings
    if (randomizedPairings.length > 0) {
      setManualPairings(randomizedPairings);
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
  };

  // Handle randomize pairings
  const handleRandomizePairings = async () => {
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
      setError(err.response?.data?.message || 'Failed to randomize pairings');
    } finally {
      setRandomizing(false);
    }
  };

  // Handle submit pairings
  const handleSubmitPairings = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Call API to submit pairings
      await api.client.post(`/api/debates/${tournamentId}/pairings/submit`, {
        round: activeRound,
        roundType: activeRoundType,
        pairings: randomizedPairings
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
      setError(err.response?.data?.message || 'Failed to submit pairings');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await fetchTournamentData();
    setRandomizedPairings([]);
    setShowRandomizedPairings(false);
  };

  // Handle cancel randomized pairings
  const handleCancelRandomizedPairings = () => {
    setRandomizedPairings([]);
    setManualPairings([]);
    setShowRandomizedPairings(false);
  };

  // Handle add manual pairing
  const handleAddManualPairing = () => {
    if (!selectedTeam1) {
      setError(t('tournamentPostingTab.selectTeam1', { defaultValue: 'Please select Team 1' }));
      return;
    }

    // Create new pairing
    const newPairing = {
      tournament: tournamentId,
      round: activeRound,
      roundType: activeRoundType,
      team1: teams.find(team => team._id === selectedTeam1),
      team2: selectedTeam2 ? teams.find(team => team._id === selectedTeam2) : null,
      judges: selectedJudge ? [judges.find(judge => judge._id === selectedJudge)] : [],
      location: roomLocation || `Room ${manualPairings.length + 1}`,
      isBye: !selectedTeam2
    };

    // Check if teams are already paired
    const team1AlreadyPaired = manualPairings.some((pairing, index) =>
      index !== editingPairingIndex &&
      (pairing.team1?._id === selectedTeam1 || pairing.team2?._id === selectedTeam1)
    );

    const team2AlreadyPaired = selectedTeam2 && manualPairings.some((pairing, index) =>
      index !== editingPairingIndex &&
      (pairing.team1?._id === selectedTeam2 || pairing.team2?._id === selectedTeam2)
    );

    if (team1AlreadyPaired) {
      setError(t('tournamentPostingTab.team1AlreadyPaired', { defaultValue: 'Team 1 is already paired in this round' }));
      return;
    }

    if (team2AlreadyPaired) {
      setError(t('tournamentPostingTab.team2AlreadyPaired', { defaultValue: 'Team 2 is already paired in this round' }));
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
    const pairing = manualPairings[index];
    setSelectedTeam1(pairing.team1?._id || '');
    setSelectedTeam2(pairing.team2?._id || '');
    setSelectedJudge(pairing.judges?.length > 0 ? pairing.judges[0]._id : '');
    setRoomLocation(pairing.location || '');
    setEditingPairingIndex(index);
  };

  // Handle delete manual pairing
  const handleDeleteManualPairing = (index) => {
    const updatedPairings = [...manualPairings];
    updatedPairings.splice(index, 1);
    setManualPairings(updatedPairings);
  };

  // Handle save manual pairings
  const handleSaveManualPairings = () => {
    // Mark pairings as manually created
    const markedPairings = manualPairings.map(pairing => ({
      ...pairing,
      _manuallyCreated: true
    }));

    setRandomizedPairings(markedPairings);
    setShowRandomizedPairings(true);
    handleCloseManualEntryDialog();
  };

  // Get active round pairings
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

  // Find randomized pairing for a team in the active round
  const getRandomizedPairing = (teamId) => {
    return randomizedPairings.find(pairing =>
      pairing.team1?._id === teamId || pairing.team2?._id === teamId
    );
  };

  // Render team cell content
  const renderTeamCell = (team, roundType, roundNumber) => {
    // If this is the active round and we have randomized pairings, show those instead
    if (showRandomizedPairings && roundType === activeRoundType && roundNumber === activeRound) {
      const randomizedPairing = getRandomizedPairing(team._id);

      if (randomizedPairing) {
        const isTeam1 = randomizedPairing.team1?._id === team._id;
        const opponent = isTeam1 ? randomizedPairing.team2 : randomizedPairing.team1;

        return (
          <Box sx={{ p: 1, backgroundColor: 'rgba(25, 118, 210, 0.08)', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {opponent?.name || t('tournamentPostingTab.bye', { defaultValue: 'BYE' })}
            </Typography>
            {randomizedPairing.location && (
              <Typography variant="caption" color="text.secondary">
                {t('tournamentPostingTab.room', { defaultValue: 'Room' })}: {randomizedPairing.location}
              </Typography>
            )}
            {randomizedPairing.judges && randomizedPairing.judges.length > 0 && (
              <Typography variant="caption" display="block" color="text.secondary">
                {t('tournamentPostingTab.judge', { defaultValue: 'Judge' })}: {randomizedPairing.judges[0]?.username}
              </Typography>
            )}
            <Typography variant="caption" display="block" color="primary.dark" sx={{ mt: 0.5, fontStyle: 'italic' }}>
              {t('tournamentPostingTab.notSubmitted', { defaultValue: 'Not submitted' })}
            </Typography>
          </Box>
        );
      }

      return (
        <Box sx={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(25, 118, 210, 0.04)', borderRadius: 1 }}>
          <Typography variant="body2" color="primary">
            {t('tournamentPostingTab.pendingRandomization', { defaultValue: 'Pending randomization' })}
          </Typography>
        </Box>
      );
    }

    // Otherwise, show the existing pairings
    const pairing = getTeamPairing(team._id, roundType, roundNumber);

    if (!pairing) {
      return (
        <Box sx={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('tournamentPostingTab.pending', { defaultValue: 'Pending' })}
          </Typography>
        </Box>
      );
    }

    const isTeam1 = pairing.team1?._id === team._id;
    const opponent = isTeam1 ? pairing.team2 : pairing.team1;

    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {opponent?.name || t('tournamentPostingTab.bye', { defaultValue: 'BYE' })}
        </Typography>
        {pairing.location && (
          <Typography variant="caption" color="text.secondary">
            {t('tournamentPostingTab.room', { defaultValue: 'Room' })}: {pairing.location}
          </Typography>
        )}
        {pairing.judges && pairing.judges.length > 0 && (
          <Typography variant="caption" display="block" color="text.secondary">
            {t('tournamentPostingTab.judge', { defaultValue: 'Judge' })}: {pairing.judges[0]?.username}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('tournamentPostingTab.title', { defaultValue: 'Tournament Postings' })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? t('tournamentPostingTab.refreshing', { defaultValue: 'Refreshing...' }) : t('tournamentPostingTab.refresh', { defaultValue: 'Refresh' })}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {autoProgressNotification && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {autoProgressNotification.message}
        </Alert>
      )}

      {showRandomizedPairings && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {randomizedPairings.length > 0 && randomizedPairings[0]._manuallyCreated ? (
              <KeyboardTabIcon />
            ) : (
              <ShuffleIcon />
            )}
            <Typography variant="body1">
              {randomizedPairings.length > 0 && randomizedPairings[0]._manuallyCreated ? (
                t('tournamentPostingTab.previewModeManual', {
                  round: rounds.find(r => r.type === activeRoundType && r.number === activeRound)?.name || `Round ${activeRound}`,
                  defaultValue: `Previewing manually entered pairings for ${rounds.find(r => r.type === activeRoundType && r.number === activeRound)?.name || `Round ${activeRound}`}. Click Submit to finalize or Cancel to discard.`
                })
              ) : (
                t('tournamentPostingTab.previewMode', {
                  round: rounds.find(r => r.type === activeRoundType && r.number === activeRound)?.name || `Round ${activeRound}`,
                  defaultValue: `Previewing randomized pairings for ${rounds.find(r => r.type === activeRoundType && r.number === activeRound)?.name || `Round ${activeRound}`}. Click Submit to finalize or Cancel to discard.`
                })
              )}
            </Typography>
          </Box>
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="active-round-select-label">
                  {t('tournamentPostingTab.activeRound', { defaultValue: 'Active Round' })}
                </InputLabel>
                <Select
                  labelId="active-round-select-label"
                  value={rounds.some(r => `${r.type}-${r.number}` === `${activeRoundType}-${activeRound}`) ? `${activeRoundType}-${activeRound}` : ''}
                  label={t('tournamentPostingTab.activeRound', { defaultValue: 'Active Round' })}
                  onChange={handleRoundChange}
                >
                  {rounds.map(round => (
                    <MenuItem key={round.id} value={`${round.type}-${round.number}`}>
                      {round.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {isOrganizerOrAdmin && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoProgressRounds}
                      onChange={(e) => setAutoProgressRounds(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={t('tournamentPostingTab.autoProgressRounds', { defaultValue: 'Auto-progress to next round' })}
                />
              )}
            </Box>

            {isOrganizerOrAdmin && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                {!showRandomizedPairings ? (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<ShuffleIcon />}
                      onClick={handleOpenRandomizeDialog}
                      disabled={randomizing || submittedRounds.has(`${activeRoundType}-${activeRound}`)}
                      sx={{ mr: 1 }}
                    >
                      {t('tournamentPostingTab.randomize', { defaultValue: 'Randomize' })}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<KeyboardTabIcon />}
                      onClick={handleOpenManualEntryDialog}
                      disabled={randomizing || submittedRounds.has(`${activeRoundType}-${activeRound}`)}
                    >
                      {t('tournamentPostingTab.manualEntry', { defaultValue: 'Manual Entry' })}
                    </Button>
                    {submittedRounds.has(`${activeRoundType}-${activeRound}`) && (
                      <Typography variant="caption" color="success.main" sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                        <CheckIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {t('tournamentPostingTab.roundSubmitted', { defaultValue: 'Round submitted and published' })}
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancelRandomizedPairings}
                      disabled={submitting}
                    >
                      {t('tournamentPostingTab.cancel', { defaultValue: 'Cancel' })}
                    </Button>

                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={handleSubmitPairings}
                      disabled={submitting}
                    >
                      {submitting
                        ? t('tournamentPostingTab.submitting', { defaultValue: 'Submitting...' })
                        : t('tournamentPostingTab.submit', { defaultValue: 'Submit' })}
                    </Button>
                  </>
                )}
              </Box>
            )}
          </Box>
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
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('tournamentPostingTab.team', { defaultValue: 'Команда' })}
                  </TableCell>
                  {rounds.map(round => (
                    <TableCell
                      key={round.id}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: round.type === activeRoundType && round.number === activeRound && showRandomizedPairings
                          ? 'rgba(25, 118, 210, 0.08)'
                          : submittedRounds.has(`${round.type}-${round.number}`)
                            ? 'rgba(76, 175, 80, 0.08)'
                            : 'inherit'
                      }}
                    >
                      {round.name}
                      {round.type === activeRoundType && round.number === activeRound && showRandomizedPairings && (
                        <Typography variant="caption" display="block" color="primary.dark" sx={{ fontStyle: 'italic' }}>
                          {t('tournamentPostingTab.preview', { defaultValue: 'Preview' })}
                        </Typography>
                      )}
                      {submittedRounds.has(`${round.type}-${round.number}`) && !showRandomizedPairings && (
                        <Typography variant="caption" display="block" color="success.dark" sx={{ fontStyle: 'italic' }}>
                          {t('tournamentPostingTab.submitted', { defaultValue: 'Submitted' })}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.map(team => (
                  <TableRow key={team._id} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}>
                    <TableCell>
                      <Typography variant="body1">{team.name}</Typography>
                      {team.club && (
                        <Typography variant="caption" color="text.secondary">
                          {team.club}
                        </Typography>
                      )}
                    </TableCell>
                    {rounds.map(round => (
                      <TableCell
                        key={`${team._id}-${round.id}`}
                        align="center"
                        sx={{
                          backgroundColor: round.type === activeRoundType && round.number === activeRound && showRandomizedPairings
                            ? 'rgba(25, 118, 210, 0.04)'
                            : submittedRounds.has(`${round.type}-${round.number}`)
                              ? 'rgba(76, 175, 80, 0.04)'
                              : 'inherit',
                          transition: 'background-color 0.3s ease'
                        }}
                      >
                        {renderTeamCell(team, round.type, round.number)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Randomize Dialog */}
      <Dialog open={openRandomizeDialog} onClose={handleCloseRandomizeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('tournamentPostingTab.randomizeTitle', { defaultValue: 'Randomize Pairings' })}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              {t('tournamentPostingTab.randomizeDescription', {
                round: rounds.find(r => r.type === activeRoundType && r.number === activeRound)?.name || `Round ${activeRound}`,
                defaultValue: `You are about to randomize pairings for ${rounds.find(r => r.type === activeRoundType && r.number === activeRound)?.name || `Round ${activeRound}`}.`
              })}
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('tournamentPostingTab.options', { defaultValue: 'Options' })}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControl>
                  <label>
                    <input
                      type="checkbox"
                      name="avoidRematches"
                      checked={randomizeOptions.avoidRematches}
                      onChange={handleRandomizeOptionsChange}
                    />
                    {' '}
                    {t('tournamentPostingTab.avoidRematches', { defaultValue: 'Avoid rematches' })}
                  </label>
                </FormControl>

                <FormControl>
                  <label>
                    <input
                      type="checkbox"
                      name="avoidSameClub"
                      checked={randomizeOptions.avoidSameClub}
                      onChange={handleRandomizeOptionsChange}
                    />
                    {' '}
                    {t('tournamentPostingTab.avoidSameClub', { defaultValue: 'Avoid same-club matchups' })}
                  </label>
                </FormControl>
              </Box>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRandomizeDialog}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleRandomizePairings}
            variant="contained"
            color="primary"
            disabled={randomizing}
          >
            {randomizing
              ? t('tournamentPostingTab.randomizing', { defaultValue: 'Randomizing...' })
              : t('tournamentPostingTab.randomize', { defaultValue: 'Randomize' })}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={openManualEntryDialog} onClose={handleCloseManualEntryDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('tournamentPostingTab.manualEntryTitle', { defaultValue: 'Manual Entry for Pairings' })}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              {t('tournamentPostingTab.manualEntryDescription', {
                round: rounds.find(r => r.type === activeRoundType && r.number === activeRound)?.name || `Round ${activeRound}`,
                defaultValue: `Manually create pairings for ${rounds.find(r => r.type === activeRoundType && r.number === activeRound)?.name || `Round ${activeRound}`}.`
              })}
            </Typography>

            {/* Pairing Form */}
            <Box sx={{ mt: 3, mb: 3, p: 2, border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {editingPairingIndex >= 0
                  ? t('tournamentPostingTab.editPairing', { defaultValue: 'Edit Pairing' })
                  : t('tournamentPostingTab.addPairing', { defaultValue: 'Add New Pairing' })}
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="team1-select-label">
                      {t('tournamentPostingTab.team1', { defaultValue: 'Team 1' })} *
                    </InputLabel>
                    <Select
                      labelId="team1-select-label"
                      value={selectedTeam1}
                      label={t('tournamentPostingTab.team1', { defaultValue: 'Team 1' }) + ' *'}
                      onChange={(e) => setSelectedTeam1(e.target.value)}
                    >
                      {teams
                        .filter(team => !manualPairings.some((p, idx) =>
                          idx !== editingPairingIndex &&
                          (p.team1?._id === team._id || p.team2?._id === team._id)
                        ))
                        .map(team => (
                          <MenuItem key={team._id} value={team._id}>
                            {team.name} {team.club ? `(${team.club})` : ''}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="team2-select-label">
                      {t('tournamentPostingTab.team2', { defaultValue: 'Team 2 (or leave empty for BYE)' })}
                    </InputLabel>
                    <Select
                      labelId="team2-select-label"
                      value={selectedTeam2}
                      label={t('tournamentPostingTab.team2', { defaultValue: 'Team 2 (or leave empty for BYE)' })}
                      onChange={(e) => setSelectedTeam2(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>{t('tournamentPostingTab.bye', { defaultValue: 'BYE' })}</em>
                      </MenuItem>
                      {teams
                        .filter(team =>
                          team._id !== selectedTeam1 &&
                          !manualPairings.some((p, idx) =>
                            idx !== editingPairingIndex &&
                            (p.team1?._id === team._id || p.team2?._id === team._id)
                          )
                        )
                        .map(team => (
                          <MenuItem key={team._id} value={team._id}>
                            {team.name} {team.club ? `(${team.club})` : ''}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="judge-select-label">
                      {t('tournamentPostingTab.judge', { defaultValue: 'Judge' })}
                    </InputLabel>
                    <Select
                      labelId="judge-select-label"
                      value={selectedJudge}
                      label={t('tournamentPostingTab.judge', { defaultValue: 'Judge' })}
                      onChange={(e) => setSelectedJudge(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>{t('tournamentPostingTab.noJudge', { defaultValue: 'No Judge' })}</em>
                      </MenuItem>
                      {judges.map(judge => (
                        <MenuItem key={judge._id} value={judge._id}>
                          {judge.username || judge.name || 'Judge'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('tournamentPostingTab.room', { defaultValue: 'Room' })}
                    value={roomLocation}
                    onChange={(e) => setRoomLocation(e.target.value)}
                    placeholder={`Room ${manualPairings.length + 1}`}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    {editingPairingIndex >= 0 && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                          setSelectedTeam1('');
                          setSelectedTeam2('');
                          setSelectedJudge('');
                          setRoomLocation('');
                          setEditingPairingIndex(-1);
                        }}
                        sx={{ mr: 1 }}
                      >
                        {t('common.cancel', { defaultValue: 'Cancel' })}
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddManualPairing}
                      startIcon={editingPairingIndex >= 0 ? <EditIcon /> : <AddIcon />}
                    >
                      {editingPairingIndex >= 0
                        ? t('tournamentPostingTab.updatePairing', { defaultValue: 'Update Pairing' })
                        : t('tournamentPostingTab.addPairing', { defaultValue: 'Add Pairing' })}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Current Pairings List */}
            <Typography variant="subtitle1" gutterBottom>
              {t('tournamentPostingTab.currentPairings', { defaultValue: 'Current Pairings' })}
            </Typography>

            {manualPairings.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
                {t('tournamentPostingTab.noPairingsYet', { defaultValue: 'No pairings created yet' })}
              </Typography>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('tournamentPostingTab.team1', { defaultValue: 'Team 1' })}</TableCell>
                      <TableCell>{t('tournamentPostingTab.team2', { defaultValue: 'Team 2' })}</TableCell>
                      <TableCell>{t('tournamentPostingTab.judge', { defaultValue: 'Judge' })}</TableCell>
                      <TableCell>{t('tournamentPostingTab.room', { defaultValue: 'Room' })}</TableCell>
                      <TableCell align="right">{t('tournamentPostingTab.actions', { defaultValue: 'Actions' })}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manualPairings.map((pairing, index) => (
                      <TableRow key={index}>
                        <TableCell>{pairing.team1?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          {pairing.team2?.name || (
                            <Chip
                              label={t('tournamentPostingTab.bye', { defaultValue: 'BYE' })}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {pairing.judges?.length > 0 ? pairing.judges[0]?.username : '-'}
                        </TableCell>
                        <TableCell>{pairing.location || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEditManualPairing(index)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteManualPairing(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManualEntryDialog}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleSaveManualPairings}
            variant="contained"
            color="primary"
            disabled={manualPairings.length === 0}
            startIcon={<SaveIcon />}
          >
            {t('tournamentPostingTab.savePairings', { defaultValue: 'Save Pairings' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentPostingTab;
