import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  
  // Add debug log to check stored role value
  console.log('Home component - userRole from localStorage:', localStorage.getItem('userRole'));
  
  useEffect(() => {
    // This will update when localStorage changes
    const handleStorageChange = () => {
      setUsername(localStorage.getItem('username') || '');
      setUserRole(localStorage.getItem('userRole') || 'user');
      // Add debug log inside event handler
      console.log('Auth change event - userRole updated to:', localStorage.getItem('userRole'));
    };
    
    window.addEventListener('auth-change', handleStorageChange);
    
    return () => {
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, []);

  const handleJoinDebate = () => {
    navigate('/debates');
  };

  const handleCreateDebate = () => {
    navigate('/host-debate');
  };

  // Add debug log to check role display mapping
  const getRoleDisplay = (role) => {
    console.log('Mapping role to display name:', role);
    switch(role) {
      case 'judge': return 'Judge';
      case 'organizer': return 'Organizer';
      case 'user':
      default: return 'Debater';
    }
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
      
      {localStorage.getItem('token') && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderLeft: '5px solid',
            borderColor: 'primary.main'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.main',
                  width: 50,
                  height: 50,
                  mr: 2
                }}
              >
                {username ? username[0]?.toUpperCase() : ''}
              </Avatar>
              <Box>
                <Typography variant="h5">
                  Welcome, {username}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Chip 
                    label={getRoleDisplay(userRole)} 
                    color="primary" 
                    size="small"
                    sx={{ fontWeight: 'medium' }}
                  />
                </Box>
              </Box>
            </Box>
            <Button 
              variant="contained" 
              onClick={() => navigate('/profile')}
            >
              View Profile
            </Button>
          </Box>
        </Paper>
      )}

      <Grid container spacing={4}>
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
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;