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
  loading = false,
  onInitializeBracket,
  initializing = false
}) => {
  const { t } = useTranslation(); // Initialize useTranslation
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('bracketTab.title', 'Tournament Bracket')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {typeof onInitializeBracket === 'function' && (
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
          <TournamentGrid rounds={tournamentRounds} entrants={entrants} /> {/* Pass entrants down */}
        </Paper>
      )}
    </Box>
  );
};

export default BracketTab; 