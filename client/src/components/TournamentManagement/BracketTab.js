import React from 'react';
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
  loading = false,
  onInitializeBracket,
  initializing = false
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Tournament Bracket
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
              {tournamentRounds?.length > 0 ? 'Regenerate Bracket' : 'Initialize Bracket'}
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
            No tournament bracket has been initialized yet. Click the button above to create one.
          </Alert>
        </Paper>
      )}

      {!initializing && !loading && tournamentRounds?.length > 0 && (
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <TournamentGrid rounds={tournamentRounds} />
        </Paper>
      )}
    </Box>
  );
};

export default BracketTab; 