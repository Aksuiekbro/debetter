import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  const handleJoinDebate = () => {
    navigate('/debates');
  };

  const handleCreateDebate = () => {
    navigate('/host-debate');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" align="center" sx={{ color: 'primary.main', mb: 2 }}>
          Welcome to DeBetter
        </Typography>
        <Typography variant="h5" align="center" sx={{ color: 'text.secondary', mb: 4 }}>
          Engage in meaningful discussions and structured debates
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Featured Debates Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="h4" sx={{ color: 'primary.main', mb: 3 }}>
              Featured Debates
            </Typography>
            <Grid container spacing={3}>
              {[1, 2, 3].map((debate) => (
                <Grid item xs={12} key={debate}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        Sample Debate Topic {debate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Join this exciting debate about current events and share your perspective.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={handleJoinDebate}
                        sx={{ color: 'primary.main' }}
                      >
                        Join Debate
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Action Panel */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="h4" sx={{ color: 'primary.main', mb: 3 }}>
              Get Started
            </Typography>
            {!localStorage.getItem('token') ? (
              <Box>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mb: 2 }}
                  onClick={() => navigate('/register')}
                >
                  Register Now
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
              </Box>
            ) : (
              <Box>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mb: 2 }}
                  onClick={handleCreateDebate}
                >
                  Create New Debate
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleJoinDebate}
                >
                  Browse Debates
                </Button>
              </Box>
            )}
          </Paper>

          {/* User Stats/Info Section */}
          {localStorage.getItem('token') && (
            <Paper elevation={3} sx={{ p: 3, mt: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                Your Profile
              </Typography>
              <Typography variant="body1">
                Role: {userRole === 'judge' ? 'Judge' : 'Debater'}
              </Typography>
              {/* More stats will be added here */}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;