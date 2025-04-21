import React, { useState, useEffect, useCallback, Fragment } from 'react';
import PostCreationDialog from './PostCreationDialog';
import CommentSection from './CommentSection';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, CircularProgress, Alert,
  IconButton, Avatar, Card, CardHeader, CardContent, CardMedia,
  Menu, MenuItem, Dialog, DialogContent, Zoom, ListItemText
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
// Assuming api config and auth context are correctly pathed relative to this new file location
import { api } from '../../config/api';
import websocketService from '../../services/websocketService';

const AnnouncementsFeedView = ({ currentUser, tournamentCreatorId, tournament }) => {
  console.log('AnnouncementsFeedView props:', { currentUser, tournamentCreatorId, tournament });
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  // State for announcements and UI
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  // State for menu and image preview
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);



  // Force authentication for testing
  const isAuthenticated = true;

  // For debugging
  console.log('Debug auth info:', {
    currentUser,
    tournamentCreatorId,
    isAuthenticated,
    token: localStorage.getItem('token'),
    userRole: localStorage.getItem('userRole'),
    username: localStorage.getItem('username'),
    userId: localStorage.getItem('userId')
  });

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

    // Set up WebSocket connection for real-time updates
    websocketService.initialize();
    websocketService.joinTournament(tournamentId);

    // Add event listeners for announcements and comments
    const createdListener = websocketService.addEventListener('announcement:created', () => {
      fetchAnnouncements();
    });

    const updatedListener = websocketService.addEventListener('announcement:updated', () => {
      fetchAnnouncements();
    });

    const deletedListener = websocketService.addEventListener('announcement:deleted', () => {
      fetchAnnouncements();
    });

    const commentCreatedListener = websocketService.addEventListener('comment:created', () => {
      fetchAnnouncements();
    });

    const commentDeletedListener = websocketService.addEventListener('comment:deleted', () => {
      fetchAnnouncements();
    });

    // Clean up WebSocket connection and event listeners
    return () => {
      createdListener();
      updatedListener();
      deletedListener();
      commentCreatedListener();
      commentDeletedListener();
      websocketService.leaveTournament(tournamentId);
    };
  }, [fetchAnnouncements, tournamentId]);



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



  return (
    <Box sx={{
      pt: 2,
      maxWidth: { xs: '100%', sm: '600px', md: '650px' },
      mx: 'auto',
      px: { xs: 1, sm: 2 }
    }}>
      {/* Post Creation Dialog - Render as FAB */}
      {(
        <PostCreationDialog
          tournamentId={tournamentId}
          onPostCreated={fetchAnnouncements}
          buttonPosition="bottom-right" // Changed from "inline"
        />
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
                mb: 3,
                backgroundColor: announcement.backgroundColor || '#ffffff',
                borderRadius: { xs: 1, sm: 2 },
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                overflow: 'visible',
                transition: 'box-shadow 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)'
                }
              }}
            >
              {/* Card Header with Author Info and Menu */}
              <CardHeader
                avatar={
                  <Avatar
                    src={announcement.createdBy?.profilePhotoUrl}
                    alt={announcement.createdBy?.username || 'User'}
                    sx={{
                      bgcolor: 'primary.main',
                      width: 38,
                      height: 38,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    {(announcement.createdBy?.username || 'U')[0].toUpperCase()}
                  </Avatar>
                }
                action={
                  (
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, announcement)}
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )
                }
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="600"
                      sx={{ fontSize: '0.95rem', color: '#2e3c42' }}
                    >
                      {announcement.createdBy?.username || 'Tournament Organizer'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {new Date(announcement.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                }
                subheader={
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      mt: 0.5,
                      color: '#1a2c35'
                    }}
                  >
                    {announcement.title}
                  </Typography>
                }
                sx={{
                  pb: 0.5,
                  '& .MuiCardHeader-content': {
                    overflow: 'hidden'
                  }
                }}
              />

              {/* Image if available - displayed first like in Telegram */}
              {announcement.imageUrl && (
                <Box sx={{ position: 'relative', mb: 1, px: 0, pt: 0 }}>
                  <Box
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      '&:hover': {
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          zIndex: 1
                        }
                      }
                    }}
                    onClick={() => {
                      setPreviewImage(announcement.imageUrl);
                      setImageZoom(1);
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={announcement.imageUrl}
                      alt={announcement.title}
                      sx={{
                        maxHeight: 500,
                        width: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <ZoomInIcon fontSize="small" />
                      {t('announcementsFeedView.viewImage', 'View')}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Card Content - displayed after image */}
              <CardContent sx={{
                pt: announcement.imageUrl ? 1.5 : 0,
                pb: 1.5,
                px: 2.5,
                '&:last-child': { pb: 1.5 }
              }}>
                <Typography
                  variant="body1"
                  component="div"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    letterSpacing: '0.01em',
                    color: '#4e5a60',
                    '& a': {
                      color: '#2481cc',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }
                  }}
                >
                  {announcement.content}
                </Typography>
              </CardContent>

              {/* Comments Section */}
              <CommentSection
                tournamentId={tournamentId}
                announcement={announcement}
                currentUser={currentUser}
                onCommentAdded={fetchAnnouncements}
                onCommentDeleted={fetchAnnouncements}
              />
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

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="xl"
        fullWidth
        TransitionComponent={Zoom}
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            m: 0,
            p: 0,
            borderRadius: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {previewImage && (
            <Fragment>
              <Box
                component="img"
                src={previewImage}
                alt="Preview"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${imageZoom})`,
                  transition: 'transform 0.3s ease'
                }}
              />
              <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => setImageZoom(prev => Math.min(prev + 0.2, 3))}
                  sx={{ color: 'white', bgcolor: 'rgba(0, 0, 0, 0.5)', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' } }}
                >
                  <ZoomInIcon />
                </IconButton>
                <IconButton
                  onClick={() => setImageZoom(prev => Math.max(prev - 0.2, 0.5))}
                  sx={{ color: 'white', bgcolor: 'rgba(0, 0, 0, 0.5)', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' } }}
                >
                  <ZoomOutIcon />
                </IconButton>
                <IconButton
                  onClick={() => {
                    setPreviewImage(null);
                    setImageZoom(1);
                  }}
                  sx={{ color: 'white', bgcolor: 'rgba(0, 0, 0, 0.5)', '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' } }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Fragment>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Updated export name
export default AnnouncementsFeedView;
