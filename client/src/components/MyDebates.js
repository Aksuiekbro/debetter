import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button, 
  Divider, 
  Tabs, 
  Tab, 
  Chip,
  CircularProgress,
  Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

// TabPanel component for the tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MyDebates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [debates, setDebates] = useState({ created: [], participated: [] });
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyDebates();
  }, []);

  const fetchMyDebates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/debates/user/mydebates`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch debates');
      }

      const data = await response.json();
      setDebates(data);
    } catch (error) {
      console.error('Error fetching debates:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const DebateCard = ({ debate }) => {
    const isTournament = debate.format === 'tournament';

    const getStatusColor = (status) => {
      switch (status) {
        case 'upcoming': return 'primary';
        case 'in-progress': return 'warning';
        case 'completed': return 'success';
        default: return 'default';
      }
    };

    return (
      <Card sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <CardContent>
          <Typography gutterBottom variant="h5" component="div" sx={{ color: 'primary.main' }}>
            {debate.title}
            {isTournament && (
              <Chip 
                size="small" 
                label="Tournament" 
                color="secondary" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              size="small"
              label={`Status: ${debate.status}`}
              color={getStatusColor(debate.status)}
              variant="outlined"
            />
            <Chip 
              size="small"
              label={`Category: ${debate.category}`}
              color="primary"
              variant="outlined"
            />
            <Chip 
              size="small"
              label={`Difficulty: ${debate.difficulty}`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            {debate.description}
          </Typography>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            Start Date: {new Date(debate.startDate).toLocaleString()}
          </Typography>
          
          {/* Display assigned games in tournaments */}
          {isTournament && debate.postings && debate.postings.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Assigned Games
              </Typography>
              <Grid container spacing={2}>
                {debate.postings.map((posting, index) => (
                  <Grid item xs={12} sm={6} key={posting._id || index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Game #{index + 1}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Theme:</strong> {posting.theme}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Location:</strong> {posting.location}
                        </Typography>
                        <Typography variant="body2">
                          <Chip 
                            size="small"
                            label={posting.status === 'completed' ? 'Completed' : 'Scheduled'}
                            color={posting.status === 'completed' ? 'success' : 'primary'}
                            sx={{ mt: 1 }}
                          />
                          {posting.winner && (
                            <Chip 
                              size="small"
                              label={`Winner: ${posting.winnerName || 'Team'}`}
                              color="success"
                              sx={{ mt: 1, ml: 1 }}
                            />
                          )}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          color="primary"
                          onClick={() => navigate(`/debates/${debate._id}/postings/${posting._id}`)}
                        >
                          {posting.status === 'completed' ? 'View Results' : 'View Details'}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </CardContent>
        <CardActions>
          <Button 
            size="small" 
            color="primary"
            onClick={() => navigate(`/debates/${debate._id}`)}
          >
            View Details
          </Button>
          {debate.format === 'tournament' && (
            <Button 
              size="small" 
              color="primary"
              onClick={() => navigate(`/tournaments/${debate._id}`)}
            >
              Tournament Dashboard
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 5, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your debates...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
        My Debates
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="debate tabs">
          <Tab label="Participated" />
          <Tab label="Created" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {debates.participated.length === 0 ? (
          <Alert severity="info">
            You haven't joined any debates yet. Browse available debates to participate.
          </Alert>
        ) : (
          debates.participated.map(debate => (
            <DebateCard key={debate._id} debate={debate} />
          ))
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {debates.created.length === 0 ? (
          <Alert severity="info">
            You haven't created any debates yet. Click the button below to host a new debate.
          </Alert>
        ) : (
          debates.created.map(debate => (
            <DebateCard key={debate._id} debate={debate} />
          ))
        )}
        <Box textAlign="center" mt={3}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/host')}
          >
            Host a New Debate
          </Button>
        </Box>
      </TabPanel>
    </Container>
  );
};

export default MyDebates;