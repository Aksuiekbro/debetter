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
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  CardMedia,
  useTheme,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [recentDebates, setRecentDebates] = useState([]);
  const [userStats, setUserStats] = useState({
    participatedDebates: 0,
    wins: 0,
    totalPoints: 0,
    winRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [communityStats, setCommunityStats] = useState({
    activeUsers: 0,
    debatesHosted: 0,
    activeTournaments: 0,
    teamsFormed: 0
  });
  
  useEffect(() => {
    // This will update when localStorage changes
    const handleStorageChange = () => {
      setUsername(localStorage.getItem('username') || '');
      setUserRole(localStorage.getItem('userRole') || 'user');
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    
    window.addEventListener('auth-change', handleStorageChange);
    
    // Always fetch community stats regardless of auth status
    fetchCommunityStats();
    
    // Fetch recent debates and user stats if authenticated
    if (isAuthenticated) {
      fetchUserData();
      fetchRecentDebates();
    } else {
      // For non-authenticated users, just fetch some public debates
      fetchPublicDebates();
    }
    
    return () => {
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, [isAuthenticated]);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/stats/users/stats', { headers: getAuthHeaders() });
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Keep the previous stats if there's an error
    }
  };

  const fetchRecentDebates = async () => {
    try {
      const response = await api.get('/debates/user/mydebates', { headers: getAuthHeaders() });
      // Combine created and participated debates, sort by date
      const allDebates = [...response.data.created, ...response.data.participated]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // Get only the 5 most recent
      
      setRecentDebates(allDebates);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching debates:', error);
      setLoading(false);
    }
  };

  const fetchPublicDebates = async () => {
    try {
      const response = await api.get('/debates', {
        params: {
          limit: 5,
          sortBy: 'recent'
        }
      });
      setRecentDebates(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching public debates:', error);
      setLoading(false);
    }
  };

  const fetchCommunityStats = async () => {
    try {
      const response = await api.get('/stats/community');
      setCommunityStats(response.data);
    } catch (error) {
      console.error('Error fetching community stats:', error);
      // Keep the previous stats if there's an error
    }
  };

  const handleJoinDebate = () => {
    navigate('/debates');
  };

  const handleCreateDebate = () => {
    navigate('/host-debate');
  };

  const handleViewDebate = (id) => {
    navigate(`/debates/${id}`);
  };

  // Convert role to display name
  const getRoleDisplay = (role) => {
    switch(role) {
      case 'judge': return 'Judge';
      case 'organizer': return 'Organizer';
      case 'user':
      default: return 'Debater';
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // The debate topics for showcase
  const featuredTopics = [
    {
      title: "Ethical Implications of AI",
      description: "Debate on the ethical challenges posed by advancing artificial intelligence and how society should address them.",
      image: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
    },
    {
      title: "Climate Change Solutions",
      description: "Explore different approaches to addressing global climate change and their potential impacts.",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
    },
    {
      title: "The Future of Education",
      description: "Discuss how education systems should evolve to meet the challenges of the 21st century.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2322&q=80"
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Hero Section */}
      <Box sx={{ 
        mb: 6, 
        textAlign: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
        p: 5,
        borderRadius: 2,
        color: 'white',
        boxShadow: 3
      }}>
        <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
          Welcome to DeBetter
        </Typography>
        <Typography variant="h5" sx={{ mb: 4, maxWidth: '800px', mx: 'auto', opacity: 0.9 }}>
          A platform for meaningful discussions, structured debates, and intellectual growth
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={handleJoinDebate}
            sx={{ 
              bgcolor: 'white', 
              color: 'primary.main',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              px: 4
            }}
          >
            Join Debates
          </Button>
          <Button 
            variant="outlined" 
            size="large"
            onClick={handleCreateDebate}
            sx={{ 
              borderColor: 'white', 
              color: 'white',
              '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              px: 4
            }}
          >
            Host a Debate
          </Button>
        </Box>
      </Box>
      
      {/* User Welcome Section - Only for authenticated users */}
      {isAuthenticated && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 5, 
            backgroundColor: 'white',
            borderRadius: 2,
            boxShadow: 2
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main',
                    width: 60,
                    height: 60,
                    mr: 2
                  }}
                >
                  {username ? username[0]?.toUpperCase() : ''}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    Welcome back, {username}!
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Chip 
                      label={getRoleDisplay(userRole)} 
                      color="primary" 
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                      Last active: Today
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<PersonIcon />}
                  onClick={() => navigate('/profile')}
                >
                  My Profile
                </Button>
                <Button 
                  variant="outlined"
                  startIcon={<CalendarMonthIcon />}
                  onClick={() => navigate('/my-debates')}
                >
                  My Debates
                </Button>
                <Button 
                  variant="contained"
                  startIcon={<EmojiEventsIcon />}
                  onClick={() => navigate('/tournaments')}
                >
                  Tournaments
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {/* User Stats */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Your Stats</Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="h3" color="primary.main">{userStats.participatedDebates}</Typography>
                  <Typography variant="body2">Debates</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="h3" color="primary.main">{userStats.wins}</Typography>
                  <Typography variant="body2">Wins</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="h3" color="primary.main">{userStats.totalPoints}</Typography>
                  <Typography variant="body2">Total Points</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <Typography variant="h3" color="primary.main">{userStats.winRate}%</Typography>
                  </Box>
                  <Typography variant="body2">Win Rate</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      <Grid container spacing={4}>
        {/* Main Content Section */}
        <Grid item xs={12} md={8}>
          {/* Topic Categories */}
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Featured Debate Topics
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Explore these thought-provoking topics and join the conversation
            </Typography>
            
            <Grid container spacing={3}>
              {featuredTopics.map((topic, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 2 }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={topic.image}
                      alt={topic.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {topic.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {topic.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={handleJoinDebate}
                        sx={{ color: 'primary.main' }}
                      >
                        Explore Debates
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Upcoming Debates Section */}
          <Box sx={{ mt: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                <CalendarMonthIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Upcoming Debates
              </Typography>
              <Button 
                variant="text" 
                onClick={handleJoinDebate}
              >
                View All
              </Button>
            </Box>
            
            {loading ? (
              <LinearProgress sx={{ mb: 2 }} />
            ) : (
              <Grid container spacing={2}>
                {recentDebates
                  .filter(debate => debate.status === 'scheduled')
                  .map((debate) => (
                    <Grid item xs={12} key={debate.id}>
                      <Card sx={{ boxShadow: 1 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {debate.title}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  <CalendarMonthIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'text-top' }} />
                                  {formatDate(debate.date)}
                                  {debate.time && ` at ${debate.time}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <PeopleIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'text-top' }} />
                                  {debate.participants} Participants
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label="Upcoming" 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleViewDebate(debate.id)}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={() => handleViewDebate(debate.id)}
                          >
                            Join Debate
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            )}
            
            {recentDebates.filter(debate => debate.status === 'scheduled').length === 0 && (
              <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography>No upcoming debates scheduled.</Typography>
                <Button 
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={handleCreateDebate}
                >
                  Host a New Debate
                </Button>
              </Box>
            )}
          </Box>
          
          {/* Recent Debates Results */}
          {recentDebates.some(debate => debate.status === 'completed') && (
            <Box sx={{ mt: 5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                  <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Debate Results
                </Typography>
                <Button 
                  variant="text" 
                  onClick={handleJoinDebate}
                >
                  View All
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {recentDebates
                  .filter(debate => debate.status === 'completed')
                  .map((debate) => (
                    <Grid item xs={12} key={debate.id}>
                      <Card sx={{ boxShadow: 1 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {debate.title}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  <CalendarMonthIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'text-top' }} />
                                  {formatDate(debate.date)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <PeopleIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'text-top' }} />
                                  {debate.participants} Participants
                                </Typography>
                              </Box>
                              {debate.winner && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  <strong>Winner:</strong> {debate.winner}
                                </Typography>
                              )}
                            </Box>
                            <Chip 
                              label="Completed" 
                              size="small" 
                              color="success" 
                              variant="outlined" 
                            />
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            onClick={() => handleViewDebate(debate.id)}
                          >
                            View Results
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Box>
          )}
        </Grid>

        {/* Sidebar Section */}
        <Grid item xs={12} md={4}>
          {/* Get Started / Login Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
              {isAuthenticated ? 'Quick Actions' : 'Get Started'}
            </Typography>
            
            {!isAuthenticated ? (
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  startIcon={<PersonIcon />}
                >
                  Create Account
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="body2" color="text.secondary">or</Typography>
                </Divider>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleJoinDebate}
                  sx={{ mt: 1 }}
                >
                  Browse as Guest
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleCreateDebate}
                  startIcon={<ForumIcon />}
                >
                  Create New Debate
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/tournaments')}
                  startIcon={<EmojiEventsIcon />}
                >
                  Join Tournament
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/judge-panel')}
                  startIcon={<SchoolIcon />}
                >
                  Judge Panel
                </Button>
              </Stack>
            )}
          </Paper>

          {/* Platform Stats */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
              Community Stats
            </Typography>
            <List disablePadding>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <PeopleIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="Active Users" 
                  secondary={communityStats.activeUsers.toLocaleString()}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                  secondaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'primary.main' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <ForumIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="Debates Hosted" 
                  secondary={communityStats.debatesHosted.toLocaleString()}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                  secondaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'primary.main' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <EmojiEventsIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="Active Tournaments" 
                  secondary={communityStats.activeTournaments.toLocaleString()}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                  secondaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'primary.main' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <GroupsIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary="Teams Formed" 
                  secondary={communityStats.teamsFormed.toLocaleString()}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                  secondaryTypographyProps={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'primary.main' }}
                />
              </ListItem>
            </List>
          </Paper>
          
          {/* Platform Overview */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
              About DeBetter
            </Typography>
            <Typography variant="body2" paragraph>
              DeBetter is a platform designed to facilitate structured debates and thoughtful discussions on a wide range of topics.
            </Typography>
            <Typography variant="body2" paragraph>
              Our mission is to foster critical thinking, effective communication, and respectful exchange of ideas in a structured environment.
            </Typography>
            <Typography variant="body2">
              Whether you're looking to sharpen your debating skills, explore diverse perspectives, or organize tournaments, DeBetter provides the tools and community to help you succeed.
            </Typography>
            <Button 
              variant="text" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={() => window.open('#', '_blank')}
            >
              Learn More
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;