import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box
} from '@mui/material';

// This component displays the tabulation/results for American Parliamentary Format debates
const ApfTabulation = ({ teams = [] }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom color="primary">
        A.P.D. Results
      </Typography>
      
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Teams</TableCell>
              <TableCell align="center">Rank</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Won</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.length > 0 ? (
              teams.map((team) => (
                <TableRow 
                  key={team.id} 
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {team.name}
                  </TableCell>
                  <TableCell align="center">{team.rank}</TableCell>
                  <TableCell align="center">{team.score}</TableCell>
                  <TableCell align="center">{team.wins} {team.wins === 1 ? 'game' : 'games'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">No team results available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Typography variant="caption" color="text.secondary">
          Results are updated as judges submit evaluations
        </Typography>
      </Box>
    </Paper>
  );
};

export default ApfTabulation;