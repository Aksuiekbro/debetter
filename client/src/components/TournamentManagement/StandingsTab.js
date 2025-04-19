import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

const StandingsTab = ({
  teams = [], // Expects teams array already potentially updated with standings data
  onRefreshStandings, // Function to trigger fetching standings
  loading, // Optional: pass loading state if standings refresh is slow
  error, // Optional: pass error state if standings refresh fails
  currentUser, // Added prop (for consistency, not used for hiding controls here)
  tournamentCreatorId, // Added prop (for consistency, not used for hiding controls here)
}) => {

  const { t } = useTranslation();

  // Calculate played rounds and sort teams by rank (primary), wins (secondary) and points (tertiary) for display
  const sortedTeams = [...teams].map(team => {
    // Calculate played rounds (sum of wins and losses)
    const played = (team.wins || 0) + (team.losses || 0);
    return {
      ...team,
      played
    };
  }).sort((a, b) => {
    // If both teams have rank, sort by rank
    if (a.rank && b.rank) {
      return a.rank - b.rank;
    }
    // If only one team has rank, prioritize the team with rank
    if (a.rank) return -1;
    if (b.rank) return 1;
    // Otherwise sort by wins (primary) and points (secondary)
    if (b.wins !== a.wins) return (b.wins || 0) - (a.wins || 0);
    return (b.points || 0) - (a.points || 0);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrophyIcon sx={{ mr: 1, color: 'gold' }} />
          <Typography variant="h6">{t('standingsTab.title', 'Tournament Rankings')}</Typography>
          <Tooltip title={t('standingsTab.infoTooltip', 'Rankings are based on wins, losses, and total points across all rounds')}>
            <InfoIcon sx={{ ml: 1, fontSize: '1rem', color: 'text.secondary', cursor: 'help' }} />
          </Tooltip>
        </Box>
        <Button
          variant="outlined"
          onClick={onRefreshStandings}
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          disabled={loading} // Disable button while refreshing
        >
          {loading
            ? t('standingsTab.refreshingButton', 'Refreshing...')
            : t('standingsTab.refreshButton', 'Refresh Rankings')}
        </Button>
      </Box>

      {/* Display error message if there is one */}
      {error && (
        <Box sx={{ mb: 2 }}>
          <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="body1">
              {t('standingsTab.errorMessage', 'Error refreshing standings: {{error}}', { error })}
            </Typography>
          </Paper>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('standingsTab.headerRank', 'Rank')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('standingsTab.headerTeam', 'Team')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('standingsTab.headerPlayed', 'Played')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('standingsTab.headerWins', 'Wins')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('standingsTab.headerLosses', 'Losses')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('standingsTab.headerPoints', 'Points')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTeams.map((team, index) => (
              <TableRow
                key={team.id}
                sx={{
                  backgroundColor: index < 3 ? 'rgba(255, 215, 0, 0.05)' : 'inherit',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                <TableCell sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                  {team.rank || index + 1}
                  {index === 0 && <TrophyIcon sx={{ ml: 1, fontSize: '1rem', color: 'gold' }} />}
                </TableCell>
                <TableCell sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>{team.name}</TableCell>
                <TableCell align="center">{team.played || 0}</TableCell>
                <TableCell align="center" sx={{ color: team.wins > 0 ? 'success.main' : 'inherit' }}>
                  {team.wins || 0}
                </TableCell>
                <TableCell align="center" sx={{ color: team.losses > 0 ? 'error.main' : 'inherit' }}>
                  {team.losses || 0}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{team.points || 0}</TableCell>
              </TableRow>
            ))}
            {sortedTeams.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {t('standingsTab.noTeams', 'No rankings available yet')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('standingsTab.noTeamsSubtext', 'Rankings will appear after match results have been submitted')}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add a separator and round-by-round results section */}
      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
          {t('standingsTab.roundResultsTitle', 'Round-by-Round Results')}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('standingsTab.roundResultsDescription', 'Detailed results for each round are displayed below. The table above shows the aggregated results across all rounds.')}
        </Typography>

        {sortedTeams.some(team => team.roundResults && team.roundResults.length > 0) ? (
          // Group teams by round and display results for each round
          <Box>
            {Array.from(new Set(sortedTeams.flatMap(team =>
              team.roundResults ? team.roundResults.map(result => result.round) : []
            ))).sort((a, b) => a - b).map(roundNumber => (
              <Paper key={`round-${roundNumber}`} sx={{ mb: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="h6">
                    {t('standingsTab.roundTitle', { round: roundNumber, defaultValue: `Round ${roundNumber}` })}
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('standingsTab.headerTeam', 'Team')}</TableCell>
                        <TableCell>{t('standingsTab.headerOpponent', 'Opponent')}</TableCell>
                        <TableCell align="center">{t('standingsTab.headerResult', 'Result')}</TableCell>
                        <TableCell align="center">{t('standingsTab.headerScore', 'Score')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedTeams.filter(team =>
                        team.roundResults && team.roundResults.some(result => result.round === roundNumber)
                      ).map(team => {
                        const result = team.roundResults.find(r => r.round === roundNumber);
                        if (!result) return null;

                        const opponent = sortedTeams.find(t => t.id === result.opponent);
                        const resultText = result.result === 'win'
                          ? t('standingsTab.resultWin', 'Win')
                          : result.result === 'loss'
                            ? t('standingsTab.resultLoss', 'Loss')
                            : t('standingsTab.resultDraw', 'Draw');

                        const resultColor = result.result === 'win'
                          ? 'success.main'
                          : result.result === 'loss'
                            ? 'error.main'
                            : 'text.secondary';

                        const score = result.isTeam1
                          ? `${result.team1Score} - ${result.team2Score}`
                          : `${result.team2Score} - ${result.team1Score}`;

                        return (
                          <TableRow key={`${roundNumber}-${team.id}`}>
                            <TableCell>{team.name}</TableCell>
                            <TableCell>{opponent ? opponent.name : t('standingsTab.unknownTeam', 'Unknown Team')}</TableCell>
                            <TableCell align="center" sx={{ color: resultColor, fontWeight: 'bold' }}>{resultText}</TableCell>
                            <TableCell align="center">{score}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))}
          </Box>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
            <Typography variant="body1">
              {t('standingsTab.roundResultsPlaceholder', 'Round-by-round details will be available after matches are completed')}
            </Typography>
          </Paper>
        )}
      </Box>

    </Box>
  );
};

export default StandingsTab;