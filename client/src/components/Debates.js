import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  InputAdornment,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const Debates = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categories: new Set(),
    status: new Set(),
    difficulty: new Set(),
  });
  const [currentUser, setCurrentUser] = useState(null);

  const fetchDebates = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (sortBy) {
        queryParams.append('sortBy', sortBy);
      }

      // Handle filters
      if (filters.categories.size > 0) {
        queryParams.append('categories', Array.from(filters.categories).join(','));
      }
      if (filters.status.size > 0) {
        queryParams.append('status', Array.from(filters.status).join(','));
      }
      if (filters.difficulty.size > 0) {
        queryParams.append('difficulty', Array.from(filters.difficulty).join(','));
      }

      const response = await fetch(`http://localhost:5001/api/debates?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch debates');
      }
      const data = await response.json();
      setDebates(data);
    } catch (error) {
      console.error('Error fetching debates:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, filters]);

  const getCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('http://localhost:5001/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchDebates();
  }, [fetchDebates]);

  const handleFilterChange = (section, item) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const newSet = new Set(prev[section]);
      
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      
      newFilters[section] = newSet;
      return newFilters;
    });
  };

  const handleJoinDebate = async (debateId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5001/api/debates/${debateId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchDebates();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error('Error joining debate:', error);
    }
  };

  const handleLeaveDebate = async (debateId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch(`http://localhost:5001/api/debates/${debateId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        fetchDebates();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error('Error leaving debate:', error);
    }
  };

  const filterOptions = {
    categories: ['politics', 'technology', 'science', 'society', 'economics'],
    status: ['upcoming', 'ongoing', 'completed'],
    difficulty: ['beginner', 'intermediate', 'advanced']
  };

  const FilterSection = ({ title, items, section }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
        {title}
      </Typography>
      <FormGroup>
        {items.map((item) => (
          <FormControlLabel
            key={item}
            control={
              <Checkbox
                checked={filters[section].has(item)}
                onChange={() => handleFilterChange(section, item)}
                sx={{ color: 'primary.main' }}
              />
            }
            label={item.charAt(0).toUpperCase() + item.slice(1)}
          />
        ))}
      </FormGroup>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
              Filters
            </Typography>
            <FilterSection
              title="Categories"
              items={filterOptions.categories}
              section="categories"
            />
            <Divider sx={{ my: 2 }} />
            <FilterSection
              title="Status"
              items={filterOptions.status}
              section="status"
            />
            <Divider sx={{ my: 2 }} />
            <FilterSection
              title="Difficulty"
              items={filterOptions.difficulty}
              section="difficulty"
            />
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search debates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

          {/* Sort Options */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="recent">Most Recent</MenuItem>
                <MenuItem value="popular">Most Popular</MenuItem>
                <MenuItem value="upcoming">Upcoming First</MenuItem>
                <MenuItem value="difficulty">Difficulty Level</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Active Filters Display */}
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(filters).map(([section, valueSet]) => 
              Array.from(valueSet).map(value => (
                <Chip
                  key={`${section}-${value}`}
                  label={`${value.charAt(0).toUpperCase() + value.slice(1)}`}
                  onDelete={() => handleFilterChange(section, value)}
                  color="primary"
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              ))
            )}
          </Box>

          {/* Debates List */}
          <Grid container spacing={3}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 4 }}>
                <Typography>Loading debates...</Typography>
              </Box>
            ) : debates.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 4 }}>
                <Typography>No debates found matching your criteria</Typography>
              </Box>
            ) : (
              debates.map((debate) => (
                <Grid item xs={12} key={debate._id}>
                  <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                    <CardContent>
                      <Typography variant="h5" component="div" sx={{ color: 'primary.main' }}>
                        {debate.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {debate.description}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="primary">
                          Category: {debate.category}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          Status: {debate.status}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          Difficulty: {debate.difficulty}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          Participants: {debate.participants.length}/{debate.maxParticipants}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          Start Date: {new Date(debate.startDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => navigate(`/debates/${debate._id}`)}
                      >
                        View Details
                      </Button>
                      {currentUser && (
                        <>
                          {debate.host === currentUser._id ? (
                            <Button 
                              size="small" 
                              color="primary" 
                              variant="contained"
                              onClick={() => navigate(`/debates/${debate._id}/manage`)}
                            >
                              Manage Debate
                            </Button>
                          ) : debate.participants.includes(currentUser._id) ? (
                            <Button 
                              size="small" 
                              color="secondary" 
                              variant="contained"
                              onClick={() => handleLeaveDebate(debate._id)}
                            >
                              Leave Debate
                            </Button>
                          ) : (
                            <Button 
                              size="small" 
                              color="primary" 
                              variant="contained"
                              onClick={() => handleJoinDebate(debate._id)}
                              disabled={debate.participants.length >= debate.maxParticipants}
                            >
                              {debate.participants.length >= debate.maxParticipants ? 'Full' : 'Join Debate'}
                            </Button>
                          )}
                        </>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Debates;