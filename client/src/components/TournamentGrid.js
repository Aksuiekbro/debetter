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
    const spacing = Math.pow(2, totalRounds - roundIndex - 1);
    return {
      marginTop: matchIndex === 0 ? 0 : `${spacing * 4}rem`,
      marginBottom: matchIndex === 0 ? `${spacing * 4}rem` : 0
    };
  };

  const getRoundName = (roundNumber, totalRounds) => {
    switch (roundNumber) {
      case totalRounds:
        return "Finals";
      case totalRounds - 1:
        return "Semi-Finals";
      case totalRounds - 2:
        return "Quarter-Finals";
      default:
        return `Round ${roundNumber}`;
    }
  };

  return (
    <Box sx={{ overflowX: 'auto', py: 4 }}>
      <Grid container spacing={4}>
        {rounds?.map((round, roundIndex) => (
          <Grid item key={round.roundNumber || roundIndex}>
            <Typography variant="h6" gutterBottom color="primary">
              {getRoundName(round.roundNumber, rounds.length)}
            </Typography>
            <Box>
              {round.matches.map((match, matchIndex) => (
                <Box key={`match-${match.matchNumber || matchIndex}`}>
                  <Paper
                    elevation={2}
                    sx={{
                      width: '220px',
                      ...calculateMatchPosition(roundIndex, matchIndex, rounds.length),
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        right: '-24px',
                        top: '50%',
                        width: '24px',
                        height: '2px',
                        backgroundColor: 'grey.300',
                        display: roundIndex < rounds.length - 1 ? 'block' : 'none'
                      }
                    }}
                  >
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Match {match.matchNumber}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              p: 1,
                              bgcolor: match.winner?._id === match.team1?._id ? 'success.light' : 'background.paper',
                              borderRadius: 1,
                              mb: 1
                            }}
                          >
                            {match.team1?.name || match.team1?.username || 'TBD'}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              p: 1,
                              bgcolor: match.winner?._id === match.team2?._id ? 'success.light' : 'background.paper',
                              borderRadius: 1
                            }}
                          >
                            {match.team2?.name || match.team2?.username || 'TBD'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Paper>
                </Box>
              ))}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TournamentGrid;