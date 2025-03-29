import React from 'react';
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
  Paper
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material'; // Changed from ShuffleIcon

const StandingsTab = ({
  teams = [], // Expects teams array already potentially updated with standings data
  onRefreshStandings, // Function to trigger fetching standings
  loading // Optional: pass loading state if standings refresh is slow
}) => {

  // Sort teams by wins (primary) and points (secondary) for display
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.wins !== a.wins) return (b.wins || 0) - (a.wins || 0);
    return (b.points || 0) - (a.points || 0);
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Tournament Standings</Typography>
        <Button
          variant="outlined"
          onClick={onRefreshStandings}
          startIcon={<RefreshIcon />}
          disabled={loading} // Disable button while refreshing
        >
          Refresh Standings
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Team</TableCell>
              <TableCell align="right">Wins</TableCell>
              <TableCell align="right">Losses</TableCell>
              <TableCell align="right">Points</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTeams.map((team, index) => (
              <TableRow key={team.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{team.name}</TableCell>
                <TableCell align="right">{team.wins || 0}</TableCell>
                <TableCell align="right">{team.losses || 0}</TableCell>
                <TableCell align="right">{team.points || 0}</TableCell>
              </TableRow>
            ))}
            {sortedTeams.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No teams available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StandingsTab;