import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  Alert, 
  CircularProgress,
  Container,
  Divider,
  Link
} from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

const TeamRegistrationForm = ({ onRegistrationComplete }) => {
  const { id } = useParams(); // Get tournament ID from URL
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [formData, setFormData] = useState({
    leaderName: '',
    leaderEmail: '',
    speakerName: '',
    speakerEmail: '',
    teamName: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    const fetchTournamentDetails = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch(`${api.baseUrl}/api/debates/${id}`, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tournament details');
        }
        
        const data = await response.json();
        
        // Validate that this is a tournament
        if (data.format !== 'tournament') {
          throw new Error('This is not a tournament');
        }
        
        // Check if registration is still open
        if (data.status !== 'upcoming') {
          throw new Error('Tournament registration is closed');
        }
        
        if (data.registrationDeadline) {
          const now = new Date();
          const deadline = new Date(data.registrationDeadline);
          if (now > deadline) {
            throw new Error('Registration deadline has passed');
          }
        }
        
        setTournament(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchTournamentDetails();
  }, [id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate form
      if (!formData.leaderName || !formData.leaderEmail || !formData.speakerName || 
          !formData.speakerEmail || !formData.teamName) {
        throw new Error('Please fill in all fields');
      }
      
      // Call the API to register the team
      const response = await fetch(`${api.baseUrl}/api/debates/${id}/register-team`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leader: {
            name: formData.leaderName,
            email: formData.leaderEmail
          },
          speaker: {
            name: formData.speakerName,
            email: formData.speakerEmail
          },
          teamName: formData.teamName
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register team');
      }
      
      const data = await response.json();
      setSuccess('Team registered successfully! You will receive further instructions via email.');
      
      // Reset the form
      setFormData({
        leaderName: '',
        leaderEmail: '',
        speakerName: '',
        speakerEmail: '',
        teamName: ''
      });
      
      // Notify parent component
      if (onRegistrationComplete) {
        onRegistrationComplete(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (initialLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading tournament details...
        </Typography>
      </Container>
    );
  }
  
  if (error && !tournament) {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          component={RouterLink} 
          to={`/debates/${id}`}
          variant="outlined"
        >
          Back to Tournament
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {tournament && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Register for {tournament.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registration Deadline: {new Date(tournament.registrationDeadline).toLocaleString()}
          </Typography>
        </Box>
      )}
      
      <Paper elevation={3} sx={{ padding: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ color: 'primary.main' }}>
          Register Your Team
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Complete the form below to register a team for this tournament. 
          Each team requires a Leader and a Speaker.
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="outlined" 
                size="small" 
                component={RouterLink}
                to={`/debates/${id}`}
              >
                Back to Tournament
              </Button>
            </Box>
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Team Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Team Name"
                name="teamName"
                value={formData.teamName}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Team Leader Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Leader Full Name"
                name="leaderName"
                value={formData.leaderName}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Leader Email"
                name="leaderEmail"
                type="email"
                value={formData.leaderEmail}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Team Speaker Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Speaker Full Name"
                name="speakerName"
                value={formData.speakerName}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Speaker Email"
                name="speakerEmail"
                type="email"
                value={formData.speakerEmail}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                type="submit" 
                size="large"
                disabled={loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register Team'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button 
          variant="text" 
          component={RouterLink}
          to={`/debates/${id}`}
        >
          Back to Tournament
        </Button>
      </Box>
    </Container>
  );
};

export default TeamRegistrationForm;