import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';

const TournamentGrid = ({ rounds }) => {
  const calculateMatchPosition = (roundIndex, matchIndex, totalRounds) => {
    const spacing = Math.pow(2, totalRounds - roundIndex);
    return {
      marginTop: matchIndex === 0 ? 0 : `${spacing * 4}rem`,
      marginBottom: `${spacing * 4}rem`
    };
  };

  return (
    <Box sx={{ overflowX: 'auto', py: 4 }}>
      <Grid container spacing={4}>
        {rounds.map((round, roundIndex) => (
          <Grid item key={round.roundNumber}>
            <Typography variant="h6" gutterBottom>
              Round {round.roundNumber}
            </Typography>
            <Box>
              {round.matches.map((match, matchIndex) => (
                <Paper
                  key={match.matchNumber}
                  elevation={2}
                  sx={{
                    width: '200px',
                    ...calculateMatchPosition(roundIndex, matchIndex, rounds.length)
                  }}
                >
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Match {match.matchNumber}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: match.winner?._id === match.team1?._id ? 'bold' : 'normal',
                            color: match.winner?._id === match.team1?._id ? 'success.main' : 'text.primary'
                          }}
                        >
                          {match.team1?.username || 'TBD'}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: match.winner?._id === match.team2?._id ? 'bold' : 'normal',
                            color: match.winner?._id === match.team2?._id ? 'success.main' : 'text.primary'
                          }}
                        >
                          {match.team2?.username || 'TBD'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Paper>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TournamentGrid;