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
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { t } = useTranslation();

  // Function to get display name for role
  const getRoleDisplayName = (role) => {
    const roleMap = {
      'user': t('profile.role.debater', 'Debater'),
      'debater': t('profile.role.debater', 'Debater'),
      'judge': t('profile.role.judge', 'Judge'),
      'organizer': t('profile.role.organizer', 'Organizer')
    };
    return roleMap[role] || role;
  };
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
    // Add new fields from backend
    phoneNumber: '',
    club: '',
    experience: '',
    otherProfileInfo: '',
    profilePhotoUrl: '',
    awards: [],
    judgeRole: '', // This will be displayed as Rank for judges
    metrics: {
      debates: 0,
      wins: 0,
      ongoing: 0,
      judged: 0
    }
  });
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    bio: '',
    judgingStyle: '', // Added for judge edit
    newInterest: ''
  });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
    // Initialize edit form with current profile data
    setEditForm({
      username: profileData.username,
      email: profileData.email,
      phoneNumber: profileData.phoneNumber || '',
      bio: profileData.bio || '',
      // Initialize judgingStyle only if the user is a judge
      judgingStyle: profileData.role === 'judge' ? (profileData.judgingStyle || '') : '',
      newInterest: ''
    });
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      // Construct payload with updated fields from editForm
      const payload = {
        username: editForm.username,
        email: editForm.email,
        phoneNumber: editForm.phoneNumber,
        bio: editForm.bio,
        interests: profileData.interests // Interests are managed directly in profileData for now
      };

      // Add judgingStyle to payload only if user is a judge
      if (profileData.role === 'judge') {
        payload.judgingStyle = editForm.judgingStyle;
      }
      // Filter out any unchanged fields to send only updates? Or send all?
      // Sending all for simplicity, backend should handle unchanged values.
      // Ensure the endpoint is correct as per instructions: PUT /api/users/profile
      // Assuming api.endpoints.profile points to '/api/users/profile'
      const { data } = await api.client.put(api.endpoints.profile, payload);
      
      setProfileData(prev => ({
        ...prev,
        ...data
      }));
      handleCloseEditDialog();
    } catch (err) {
      console.error('Profile update error:', err.response?.data || err.message);
      setError(err.response?.data?.message || t('profile.error.updateFailed', 'Failed to update profile'));
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
        setError(t('profile.error.loginToAddFriend', 'Please log in to add friends'));
        return;
      }

      const response = await fetch(`${api.baseUrl}${api.endpoints.friend.replace(':id', profileData._id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(t('profile.error.friendRequestFailed', 'Failed to send friend request'));
      // Show success message
      alert(t('profile.alert.friendRequestSent', 'Friend request sent successfully!'));
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
        setError(err.response?.data?.message || t('profile.error.fetchFailed', 'Failed to fetch profile'));
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
            {t('profile.button.retry', 'Retry')}
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
              src={profileData.profilePhotoUrl || undefined} // Use photo URL if available
              sx={{
                width: 120,
                height: 120,
                bgcolor: 'primary.main',
                fontSize: '3rem',
                mb: 2
              }}
            >
              {/* Fallback to initial if no photo URL */}
              {!profileData.profilePhotoUrl && profileData.username[0]?.toUpperCase()}
            </Avatar>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenEditDialog}
              fullWidth
              sx={{ mb: 2 }}
            >
              {t('profile.button.editInfo', 'Edit info & settings')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={handleAddFriend}
              fullWidth
              sx={{ mb: 2 }}
            >
              {t('profile.button.addFriend', 'Add friend')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/host-debate')}
              fullWidth
            >
              {t('profile.button.addNewDebate', 'Add new debate')}
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

            {/* Common Info Section */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>{t('profile.emailLabel', 'Email:')}</strong> {profileData.email || t('common.notAvailable', 'N/A')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>{t('profile.phoneLabel', 'Phone:')}</strong> {profileData.phoneNumber || t('common.notAvailable', 'N/A')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              <strong>{t('profile.clubLabel', 'Club:')}</strong> {profileData.club || t('common.notAvailable', 'N/A')}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3, fontStyle: profileData.bio ? 'normal' : 'italic' }}
            >
              {profileData.bio || t('profile.bio.placeholder', "Add your bio to let others know about you")}
            </Typography>
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
                  {t('profile.interests.placeholder', 'Add some interests to show what topics you like')}
                </Typography>
              )}
            </Box>

            {/* Participant Specific Info */}
            {(profileData.role === 'user' || profileData.role === 'debater') && (
              <Paper elevation={1} sx={{ p: 2, mb: 3, borderLeft: '3px solid', borderColor: 'secondary.light' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.dark' }}>
                  {t('profile.participantInfoTitle', 'Participant Information')}
                </Typography>
                {/* Awards */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>{t('profile.awardsLabel', 'Awards:')}</strong>
                  {profileData.awards && profileData.awards.length > 0
                    ? profileData.awards.join(', ')
                    : t('profile.noAwards', 'No awards listed')}
                </Typography>
                {/* Feedback Received Section */}
                <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed', borderColor: 'grey.300' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'secondary.dark' }}>
                    {t('profile.feedbackReceivedTitle', 'Feedback Received')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t('profile.feedbackReceivedPlaceholder', 'Feedback from judges will appear here.')} {/* Adjusted placeholder */}
                  </Typography>
                </Box>
                {/* Optional: Team Affiliation Placeholder */}
                {/* <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>{t('profile.teamLabel', 'Team:')}</strong> {t('common.notAvailable', 'N/A')}
                </Typography> */}
              </Paper>
            )}

            {/* Judge Specific Info */}
            {profileData.role === 'judge' && (
              <Paper elevation={1} sx={{ p: 2, mb: 3, borderLeft: '3px solid', borderColor: 'primary.light' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                  {t('profile.judgeInfoTitle', 'Judge Information')}
                </Typography>
                {/* Rank (from judgeRole) */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>{t('profile.rankLabel', 'Rank:')}</strong> {profileData.judgeRole || t('common.notAvailable', 'N/A')}
                </Typography>
                {/* Experience */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>{t('profile.experienceLabel', 'Experience:')}</strong> {profileData.experience || t('common.notAvailable', 'N/A')}
                </Typography>
                {/* Judging Style Preference */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>{t('profile.judgingStyleLabel', 'Judging Style:')}</strong> {profileData.judgingStyle || t('common.notAvailable', 'N/A')}
                </Typography>
                 {/* Awards */}
                 <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                   <strong>{t('profile.awardsLabel', 'Awards:')}</strong>
                   {profileData.awards && profileData.awards.length > 0
                     ? profileData.awards.join(', ')
                     : t('profile.noAwards', 'No awards listed')}
                 </Typography>
                {/* Feedback Received Section */}
                <Box sx={{ mt: 2, pt: 1, borderTop: '1px dashed', borderColor: 'grey.300' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                    {t('profile.feedbackReceivedTitle', 'Feedback Received')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {t('profile.feedbackReceivedPlaceholderJudge', 'Feedback from participants will appear here.')} {/* Adjusted placeholder */}
                  </Typography>
                </Box>
              </Paper>
            )}
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
                    {t('profile.stats.debates', 'DEBATES')}
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
                    {t('profile.stats.wins', 'WINS')}
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
                    {t('profile.stats.ongoing', 'ONGOING')}
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
                    {t('profile.stats.judged', 'JUDGED')}
                  </Typography>
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>
          {currentTab === 0 && (
            <Typography>{t('profile.tabs.debatesPlaceholder', 'Your debates will appear here')}</Typography>
          )}
          {currentTab === 1 && (
            <Typography>{t('profile.tabs.winsPlaceholder', 'Your winning debates will appear here')}</Typography>
          )}
          <TextField
            autoFocus
            margin="dense"
            id="username"
            label={t('profile.editDialog.usernameLabel', 'Username')}
            type="text"
            fullWidth
            variant="outlined"
            value={editForm.username}
            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="email"
            label={t('profile.editDialog.emailLabel', 'Email')}
            type="email"
            fullWidth
            variant="outlined"
            value={editForm.email}
            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="phoneNumber"
            label={t('profile.editDialog.phoneLabel', 'Phone Number')}
            type="tel"
            fullWidth
            variant="outlined"
            value={editForm.phoneNumber}
            onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
            sx={{ mb: 2 }}
          />
          {currentTab === 2 && (
            <Typography>{t('profile.tabs.ongoingPlaceholder', 'Your ongoing debates will appear here')}</Typography>
          )}
          {currentTab === 3 && (
            <Typography>{t('profile.tabs.judgedPlaceholder', "Debates you've judged will appear here")}</Typography>
          )}
        </Box>
      </Paper>

      {/* Edit Profile Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('profile.editDialog.title', 'Edit Profile')}</DialogTitle>
        <DialogContent>
          {/* Basic Info Fields */}
           <TextField
            autoFocus
            margin="dense"
            id="username"
            label={t('profile.editDialog.usernameLabel', 'Username')}
            type="text"
            fullWidth
            variant="outlined"
            value={editForm.username}
            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="email"
            label={t('profile.editDialog.emailLabel', 'Email')}
            type="email"
            fullWidth
            variant="outlined"
            value={editForm.email}
            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="phoneNumber"
            label={t('profile.editDialog.phoneLabel', 'Phone Number')}
            type="tel"
            fullWidth
            variant="outlined"
            value={editForm.phoneNumber}
            onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('profile.editDialog.bioLabel', 'Bio')}
            multiline
            rows={4}
            value={editForm.bio}
            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
            sx={{ mb: 3 }} // Keep margin bottom
          />

          {/* Judge Specific Edit Field */}
          {profileData.role === 'judge' && (
            <TextField
              margin="dense"
              id="judgingStyle"
              label={t('profile.editDialog.judgingStyleLabel', 'Judging Style Preference')}
              type="text"
              fullWidth
              variant="outlined"
              value={editForm.judgingStyle}
              onChange={(e) => setEditForm(prev => ({ ...prev, judgingStyle: e.target.value }))}
              sx={{ mb: 3 }}
            />
          )}
          
          <Typography variant="subtitle1" sx={{ mb: 1 }}>{t('profile.editDialog.interestsLabel', 'Interests')}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label={t('profile.editDialog.addInterestLabel', 'Add new interest')}
              value={editForm.newInterest}
              onChange={(e) => setEditForm(prev => ({ ...prev, newInterest: e.target.value }))}
            />
            <Button
              variant="contained"
              onClick={handleAddInterest}
              startIcon={<AddIcon />}
            >
              {t('profile.editDialog.addButton', 'Add')}
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
          {error && <Typography color="error" sx={{ mr: 'auto', ml: 2 }}>{error}</Typography>}
          <Button onClick={handleCloseEditDialog}>{t('common.button.cancel', 'Cancel')}</Button>
          <Button onClick={handleSaveProfile} variant="contained" color="primary">
            {t('common.button.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;