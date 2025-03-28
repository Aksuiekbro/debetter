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
  Alert,
  Badge
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';
import GavelIcon from '@mui/icons-material/Gavel';

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

// Define DebateCard outside MyDebates
const DebateCard = ({ debate, navigate, userRole, userId, judgeAssignments, loadingAssignments }) => { // Add loadingAssignments prop
  const isTournament = debate.format === 'tournament';
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'in-progress': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  // Find judge assignments for this tournament
  const tournamentAssignments = userRole === 'judge'
    ? judgeAssignments.filter(assignment => assignment.tournamentId === debate._id)
    : [];

  return (
    <Card sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
          
          {userRole === 'judge' && tournamentAssignments.length > 0 && (
            <Badge
              badgeContent={tournamentAssignments.length}
              color="primary"
              showZero={false}
              sx={{ mr: 1 }}
            >
              <Chip
                icon={<GavelIcon />}
                label="Judge Assignments"
                variant="outlined"
                color="primary"
                sx={{ ml: 2 }}
              />
            </Badge>
          )}
        </Box>
        
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
        
        {/* Display assigned games for judges */}
        {userRole === 'judge' && tournamentAssignments.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Your Judge Assignments
            </Typography>
            <Grid container spacing={2}>
              {tournamentAssignments.map((assignment, index) => (
                <Grid item xs={12} sm={6} key={assignment.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Judge Assignment #{index + 1}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Teams:</strong> {assignment.team1.name} vs {assignment.team2.name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Theme:</strong> {assignment.theme}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Location:</strong> {assignment.location}
                      </Typography>
                      <Typography variant="body2">
                        <Chip
                          size="small"
                          label={assignment.status === 'evaluated' ? 'Evaluated' : 'Pending'}
                          color={assignment.status === 'evaluated' ? 'success' : 'primary'}
                          sx={{ mt: 1 }}
                        />
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => navigate('/judge-panel')}
                      >
                        {assignment.status === 'evaluated' ? 'View Evaluation' : 'Evaluate'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
        
        {/* Display tournament postings for regular participants */}
        {isTournament && debate.postings && debate.postings.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Tournament Games
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
                      {/* Use component="div" to avoid nesting div (Chip) inside p (Typography) */}
                      <Typography variant="body2" component="div">
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
                        // Only disable if the assignments are still loading
                        disabled={loadingAssignments}
                        onClick={() => {
                          console.log(`Button clicked for posting: ${posting._id}, status: ${posting.status}`);
                          const isJudgeForPosting = userRole === 'judge' &&
                                                    posting.judges &&
                                                    posting.judges.some(judge => judge._id === userId);
                          console.log(`User ID: ${userId}, Role: ${userRole}, Is Judge for Posting: ${isJudgeForPosting}`);
                          
                          if (isJudgeForPosting && posting.status !== 'completed') {
                            // Create a simplified game object that matches what JudgePanel expects
                            const gameData = {
                              id: posting._id,
                              tournamentId: debate._id,
                              team1: {
                                id: posting.team1?._id || posting.team1,
                                name: posting.team1Name || 'Team 1' 
                              },
                              team2: {
                                id: posting.team2?._id || posting.team2,
                                name: posting.team2Name || 'Team 2'
                              },
                              theme: posting.theme,
                              location: posting.location,
                              status: 'pending'
                            };
                            
                            console.log('Navigating to judge-panel with game data:', gameData);
                            navigate('/judge-panel', { 
                              state: { selectedGame: gameData }
                            });
                          } else {
                            console.log('Navigating to details page:', `/debates/${debate._id}/postings/${posting._id}`);
                            navigate(`/debates/${debate._id}/postings/${posting._id}`);
                          }
                        }}
                      >
                        {posting.status === 'completed'
                          ? 'View Results'
                          : (userRole === 'judge' && posting.judges?.some(j => j._id === userId) ? 'Evaluate' : 'View Details')}
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
        {userRole === 'judge' && tournamentAssignments.length > 0 && (
          <Button
            size="small"
            color="secondary"
            onClick={() => navigate('/judge-panel')}
          >
            Go to Judge Panel
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const MyDebates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [debates, setDebates] = useState({ created: [], participated: [] });
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [judgeAssignments, setJudgeAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    fetchMyDebates();
    const role = localStorage.getItem('userRole');
    setUserRole(role);
    const storedUserId = localStorage.getItem('userId');
    setUserId(storedUserId);
    if (role === 'judge') {
      fetchJudgeAssignments();
    }
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

  const fetchJudgeAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const response = await fetch(`${api.baseUrl}/api/apf/assignments`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch judge assignments');
      }

      const data = await response.json();
      setJudgeAssignments(data);
    } catch (error) {
      console.error('Error fetching judge assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
        {userRole === 'judge' && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/judge-panel')}
              startIcon={<GavelIcon />}
            >
              {judgeAssignments.filter(a => a.status === 'pending').length > 0 
                ? `Judge Panel (${judgeAssignments.filter(a => a.status === 'pending').length} pending)` 
                : 'Judge Panel'}
            </Button>
          </Box>
        )}
        
        {debates.participated.length === 0 ? (
          <Alert severity="info">
            You haven't joined any debates yet. Browse available debates to participate.
          </Alert>
        ) : (
          debates.participated.map(debate => (
            <DebateCard
              key={debate._id}
              debate={debate}
              navigate={navigate}
              userRole={userRole}
              userId={userId}
              judgeAssignments={judgeAssignments}
              loadingAssignments={loadingAssignments} // Pass loading state
            />
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
            <DebateCard
              key={debate._id}
              debate={debate}
              navigate={navigate}
              userRole={userRole}
              userId={userId}
              judgeAssignments={judgeAssignments}
              loadingAssignments={loadingAssignments} // Pass loading state
            />
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