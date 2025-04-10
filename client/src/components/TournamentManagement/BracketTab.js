import React from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TournamentGrid from '../TournamentGrid';

const BracketTab = ({
  tournamentRounds = [],
  entrants = [], // Add entrants prop
  teams = [], // Add teams prop
  loading = false,
  onInitializeBracket,
  initializing = false,
  currentUser, // Added prop
  tournamentCreatorId, // Added prop
}) => {
  const { t } = useTranslation(); // Initialize useTranslation

  // Determine if the current user is an organizer or admin for this tournament
  const isOrganizerOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser._id === tournamentCreatorId);
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('bracketTab.title', 'Tournament Bracket')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Only show Initialize/Regenerate button to organizers/admins */}
          {isOrganizerOrAdmin && typeof onInitializeBracket === 'function' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={onInitializeBracket}
              disabled={initializing || loading}
            >
              {tournamentRounds?.length > 0 ? t('bracketTab.regenerateButton', 'Regenerate Bracket') : t('bracketTab.initializeButton', 'Initialize Bracket')}
            </Button>
          )}
        </Box>
      </Box>

      {initializing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!initializing && !loading && tournamentRounds?.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info">
            {t('bracketTab.notInitializedAlert', 'No tournament bracket has been initialized yet. Click the button above to create one.')}
          </Alert>
        </Paper>
      )}

      {!initializing && !loading && tournamentRounds?.length > 0 && (
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <TournamentGrid rounds={tournamentRounds} entrants={entrants} teams={teams} /> {/* Pass entrants and teams down */}
        </Paper>
      )}
    </Box>
  );
};

export default BracketTab; 