import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, TextField, CircularProgress, Alert,
  List, ListItem, ListItemText, Divider, Paper, IconButton, Avatar,
  Card, CardHeader, CardContent, CardMedia, CardActions, Grid,
  InputAdornment, Menu, MenuItem, Tooltip, Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Image as ImageIcon,
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Palette as PaletteIcon,
  Comment as CommentIcon,
  ThumbUp as ThumbUpIcon
} from '@mui/icons-material';
// Assuming api config and auth context are correctly pathed relative to this new file location
import { api } from '../../config/api';

const AnnouncementsFeedView = ({ currentUser, tournamentCreatorId, tournament }) => {
  console.log('AnnouncementsFeedView props:', { currentUser, tournamentCreatorId, tournament });
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  // State for announcements and UI
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for creating announcements
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [newAnnouncementImage, setNewAnnouncementImage] = useState(null);
  const [newAnnouncementImagePreview, setNewAnnouncementImagePreview] = useState('');
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('#ffffff');
  const [createError, setCreateError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for comments
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // State for menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Color options for announcements
  const colorOptions = [
    '#ffffff', // White
    '#f5f5f5', // Light Gray
    '#e3f2fd', // Light Blue
    '#e8f5e9', // Light Green
    '#fff8e1', // Light Yellow
    '#ffebee', // Light Red
    '#f3e5f5', // Light Purple
    '#e0f7fa', // Light Cyan
  ];

  // Check if user is organizer or admin
  // Temporarily set to true for testing
  const isOrganizerOrAdmin = true;

  console.log('isOrganizerOrAdmin:', isOrganizerOrAdmin, 'currentUser:', currentUser, 'tournamentCreatorId:', tournamentCreatorId);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.client.get(`/api/debates/${tournamentId}/announcements`);
      console.log('Announcements API response:', response.data);
      // Handle both response structures
      let announcements = [];
      if (response.data && response.data.data && response.data.data.announcements) {
        // New API structure
        announcements = response.data.data.announcements;
      } else if (Array.isArray(response.data)) {
        // Old API structure
        announcements = response.data;
      } else if (response.data && Array.isArray(response.data.announcements)) {
        // Another possible structure
        announcements = response.data.announcements;
      }
      console.log('Parsed announcements:', announcements);
      setAnnouncements(announcements);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError(t('announcementsFeedView.fetchError', 'Failed to load announcements'));
    } finally {
      setLoading(false);
    }
  }, [tournamentId, t]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewAnnouncementImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setNewAnnouncementImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image selection
  const handleClearImage = () => {
    setNewAnnouncementImage(null);
    setNewAnnouncementImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Create announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);

    try {
      console.log('Creating announcement with data:', {
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
        backgroundColor: selectedBackgroundColor,
        tournamentId
      });

      // First create the announcement
      const response = await api.client.post(`/api/debates/${tournamentId}/announcements`, {
        title: newAnnouncementTitle,
        content: newAnnouncementContent,
        backgroundColor: selectedBackgroundColor
      });

      console.log('Announcement creation response:', response.data);

      // Check if the response has the expected structure
      if (!response.data || !response.data.data || !response.data.data.announcement) {
        console.error('Unexpected response structure:', response.data);
        throw new Error('Unexpected response structure from server');
      }

      const announcementId = response.data.data.announcement._id;
      console.log('Created announcement with ID:', announcementId);

      // If there's an image, upload it
      if (newAnnouncementImage) {
        console.log('Uploading image for announcement:', announcementId);
        const formData = new FormData();
        formData.append('image', newAnnouncementImage);

        const imageResponse = await api.client.post(
          `/api/debates/${tournamentId}/announcements/${announcementId}/image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        console.log('Image upload response:', imageResponse.data);
      }

      // Reset form
      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      setNewAnnouncementImage(null);
      setNewAnnouncementImagePreview('');
      setSelectedBackgroundColor('#ffffff');
      setShowCreateForm(false);

      // Refresh announcements
      await fetchAnnouncements();
    } catch (err) {
      console.error("Error creating announcement:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setCreateError(err.response?.data?.message || t('announcementsFeedView.createError', 'Failed to create announcement'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle create form
  const toggleCreateForm = () => {
    setShowCreateForm(!showCreateForm);
    if (!showCreateForm) {
      // Reset form when opening
      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      setNewAnnouncementImage(null);
      setNewAnnouncementImagePreview('');
      setSelectedBackgroundColor('#ffffff');
    }
    setCreateError(null);
  };

  // Handle menu open
  const handleMenuOpen = (event, announcement) => {
    setAnchorEl(event.currentTarget);
    setSelectedAnnouncement(announcement);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAnnouncement(null);
  };

  // Delete announcement
  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement) return;

    try {
      await api.client.delete(`/api/debates/${tournamentId}/announcements/${selectedAnnouncement._id}`);
      await fetchAnnouncements();
      handleMenuClose();
    } catch (err) {
      console.error("Error deleting announcement:", err);
      setError(t('announcementsFeedView.deleteError', 'Failed to delete announcement'));
    }
  };

  // Add comment
  const handleAddComment = async (announcementId) => {
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    setCommentError(null);

    try {
      await api.client.post(`/api/debates/${tournamentId}/announcements/${announcementId}/comments`, {
        content: commentText
      });

      setCommentText('');
      await fetchAnnouncements();
    } catch (err) {
      console.error("Error adding comment:", err);
      setCommentError(t('announcementsFeedView.commentError', 'Failed to add comment'));
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Box sx={{ pt: 2 }}>
      {/* Create Announcement Button */}
      {isOrganizerOrAdmin && !showCreateForm && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={toggleCreateForm}
          sx={{ mb: 2 }}
        >
          {t('announcementsFeedView.createButton', 'Create Announcement')}
        </Button>
      )}

      {/* Create Announcement Form */}
      {isOrganizerOrAdmin && showCreateForm && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('announcementsFeedView.createFormTitle', 'Create New Announcement')}
          </Typography>

          <Box component="form" onSubmit={handleCreateAnnouncement} noValidate>
            {/* Title Field */}
            <TextField
              label={t('announcementsFeedView.formTitleLabel', 'Title')}
              fullWidth
              margin="normal"
              value={newAnnouncementTitle}
              onChange={(e) => setNewAnnouncementTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />

            {/* Content Field */}
            <TextField
              label={t('announcementsFeedView.formContentLabel', 'Content')}
              fullWidth
              margin="normal"
              multiline
              rows={4}
              value={newAnnouncementContent}
              onChange={(e) => setNewAnnouncementContent(e.target.value)}
              required
              disabled={isSubmitting}
            />

            {/* Background Color Selection */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('announcementsFeedView.selectBackgroundColor', 'Background Color')}:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {colorOptions.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setSelectedBackgroundColor(color)}
                    sx={{
                      width: 30,
                      height: 30,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      outline: selectedBackgroundColor === color ? '2px solid #1976d2' : 'none',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Image Upload */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="announcement-image-upload"
                type="file"
                onChange={handleImageSelect}
                ref={fileInputRef}
              />
              <label htmlFor="announcement-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<ImageIcon />}
                  disabled={isSubmitting}
                >
                  {t('announcementsFeedView.uploadImage', 'Upload Image')}
                </Button>
              </label>

              {newAnnouncementImagePreview && (
                <Box sx={{ mt: 2, position: 'relative' }}>
                  <img
                    src={newAnnouncementImagePreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '200px', display: 'block' }}
                  />
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                    onClick={handleClearImage}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            {createError && <Alert severity="error" sx={{ mt: 1 }}>{createError}</Alert>}

            {/* Form Actions */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={toggleCreateForm} disabled={isSubmitting}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || !newAnnouncementTitle || !newAnnouncementContent}
              >
                {isSubmitting ? <CircularProgress size={24} /> : t('announcementsFeedView.submitButton', 'Post')}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Loading and Error States */}
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {/* No Announcements Message */}
      {!loading && !error && announcements.length === 0 && (
        <Typography>{t('announcementsFeedView.noAnnouncements', 'No announcements yet')}</Typography>
      )}

      {/* Announcements Feed */}
      {!loading && !error && announcements.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {announcements.map((announcement) => (
            <Card
              key={announcement._id}
              sx={{
                mb: 2,
                backgroundColor: announcement.backgroundColor || '#ffffff',
                borderRadius: 2,
                boxShadow: 2
              }}
            >
              {/* Card Header with Author Info and Menu */}
              <CardHeader
                avatar={
                  <Avatar
                    src={announcement.createdBy?.profilePhotoUrl}
                    alt={announcement.createdBy?.username || 'User'}
                  >
                    {(announcement.createdBy?.username || 'U')[0].toUpperCase()}
                  </Avatar>
                }
                action={
                  isOrganizerOrAdmin && (
                    <IconButton onClick={(e) => handleMenuOpen(e, announcement)}>
                      <MoreVertIcon />
                    </IconButton>
                  )
                }
                title={announcement.title}
                subheader={new Date(announcement.createdAt).toLocaleString()}
              />

              {/* Card Content */}
              <CardContent>
                <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                  {announcement.content}
                </Typography>
              </CardContent>

              {/* Image if available */}
              {announcement.imageUrl && (
                <CardMedia
                  component="img"
                  image={announcement.imageUrl}
                  alt={announcement.title}
                  sx={{ maxHeight: 400 }}
                />
              )}

              {/* Comments Section */}
              <Box sx={{ px: 2, py: 1, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {announcement.comments?.length || 0} {t('announcementsFeedView.comments', 'Comments')}
                </Typography>

                {/* Comment List */}
                {announcement.comments && announcement.comments.length > 0 && (
                  <List dense sx={{ py: 0 }}>
                    {announcement.comments.map((comment) => (
                      <ListItem
                        key={comment._id}
                        alignItems="flex-start"
                        sx={{ px: 0, py: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                src={comment.createdBy?.profilePhotoUrl}
                                alt={comment.createdBy?.username || 'User'}
                                sx={{ width: 24, height: 24 }}
                              >
                                {(comment.createdBy?.username || 'U')[0].toUpperCase()}
                              </Avatar>
                              <Typography variant="subtitle2">
                                {comment.createdBy?.username || 'Unknown User'}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ pl: 4 }}>
                              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                                {comment.content}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(comment.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                {/* Add Comment Form */}
                <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={t('announcementsFeedView.addComment', 'Add a comment...')}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={submittingComment}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() => handleAddComment(announcement._id)}
                            disabled={!commentText.trim() || submittingComment}
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                {commentError && <Alert severity="error" sx={{ mt: 1 }}>{commentError}</Alert>}
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* Menu for Announcement Actions */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteAnnouncement}>
          <ListItemText primary={t('announcementsFeedView.deleteAnnouncement', 'Delete')} />
          <DeleteIcon fontSize="small" sx={{ ml: 1 }} />
        </MenuItem>
      </Menu>
    </Box>
  );
};

// Updated export name
export default AnnouncementsFeedView;