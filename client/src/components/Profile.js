import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Tabs,
  Tab,
  Grid,
  TextField,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';

// Add the function to get display name for role
const getRoleDisplayName = (role) => {
  const roleMap = {
    'user': 'Debater',
    'debater': 'Debater',
    'judge': 'Judge',
    'organizer': 'Organizer'
  };
  return roleMap[role] || role;
};

const Profile = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    role: '',
    bio: '',
    interests: [],
    metrics: {
      debates: 0,
      wins: 0,
      ongoing: 0,
      judged: 0
    }
  });
  const [editForm, setEditForm] = useState({
    bio: profileData.bio,
    newInterest: ''
  });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
    setEditForm({
      bio: profileData.bio,
      newInterest: ''
    });
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      const { data } = await api.client.put(api.endpoints.profile, {
        bio: editForm.bio,
        interests: profileData.interests
      });
      
      setProfileData(prev => ({
        ...prev,
        ...data
      }));
      handleCloseEditDialog();
    } catch (err) {
      console.error('Profile update error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAddInterest = () => {
    if (editForm.newInterest.trim()) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, editForm.newInterest.trim()]
      }));
      setEditForm(prev => ({ ...prev, newInterest: '' }));
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  const handleAddFriend = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to add friends');
        return;
      }

      const response = await fetch(`${api.baseUrl}${api.endpoints.friend.replace(':id', profileData._id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to send friend request');
      // Show success message
      alert('Friend request sent successfully!');
    } catch (err) {
      setError(err.message);
      console.error('Friend request error:', err);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data } = await api.client.get(api.endpoints.profile);
        setProfileData(prev => ({
          ...prev,
          ...data,
          metrics: data.metrics || prev.metrics
        }));
      } catch (err) {
        console.error('Profile fetch error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to fetch profile');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Profile Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                bgcolor: 'primary.main',
                fontSize: '3rem',
                mb: 2
              }}
            >
              {profileData.username[0]?.toUpperCase()}
            </Avatar>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenEditDialog}
              fullWidth
              sx={{ mb: 2 }}
            >
              Edit info & settings
            </Button>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={handleAddFriend}
              fullWidth
              sx={{ mb: 2 }}
            >
              Add friend
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/host-debate')}
              fullWidth
            >
              Add new debate
            </Button>
          </Grid>

          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
              <Typography variant="h4" sx={{ mr: 2 }}>
                {profileData.username}
              </Typography>
              {/* Add back the role chip */}
              <Chip 
                label={getRoleDisplayName(profileData.role)} 
                color="primary" 
                variant="outlined"
                sx={{ fontSize: '0.9rem', fontWeight: 'medium' }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              {profileData.interests.map((interest, index) => (
                <Chip
                  key={index}
                  label={interest}
                  sx={{ m: 0.5 }}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {profileData.interests.length === 0 && (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Add some interests to show what topics you like
                </Typography>
              )}
            </Box>

            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mb: 3,
                fontStyle: profileData.bio ? 'normal' : 'italic'
              }}
            >
              {profileData.bio || "Add your bio to let others know about you"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Metrics and Navigation */}
      <Paper elevation={3} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }
            }}
          >
            <Tab 
              label={
                <Box>
                  <Typography variant="h6" color="primary">
                    {profileData.metrics.debates}
                  </Typography>
                  <Typography variant="caption">
                    DEBATES
                  </Typography>
                </Box>
              }
            />
            <Tab 
              label={
                <Box>
                  <Typography variant="h6" color="primary">
                    {profileData.metrics.wins}
                  </Typography>
                  <Typography variant="caption">
                    WINS
                  </Typography>
                </Box>
              }
            />
            <Tab 
              label={
                <Box>
                  <Typography variant="h6" color="primary">
                    {profileData.metrics.ongoing}
                  </Typography>
                  <Typography variant="caption">
                    ONGOING
                  </Typography>
                </Box>
              }
            />
            <Tab 
              label={
                <Box>
                  <Typography variant="h6" color="primary">
                    {profileData.metrics.judged}
                  </Typography>
                  <Typography variant="caption">
                    JUDGED
                  </Typography>
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {currentTab === 0 && (
            <Typography>Your debates will appear here</Typography>
          )}
          {currentTab === 1 && (
            <Typography>Your winning debates will appear here</Typography>
          )}
          {currentTab === 2 && (
            <Typography>Your ongoing debates will appear here</Typography>
          )}
          {currentTab === 3 && (
            <Typography>Debates you've judged will appear here</Typography>
          )}
        </Box>
      </Paper>

      {/* Edit Profile Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Bio"
            multiline
            rows={4}
            value={editForm.bio}
            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
            sx={{ mt: 2, mb: 3 }}
          />
          
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Interests</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Add new interest"
              value={editForm.newInterest}
              onChange={(e) => setEditForm(prev => ({ ...prev, newInterest: e.target.value }))}
            />
            <Button
              variant="contained"
              onClick={handleAddInterest}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {profileData.interests.map((interest, index) => (
              <Chip
                key={index}
                label={interest}
                onDelete={() => handleRemoveInterest(interest)}
                color="primary"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;