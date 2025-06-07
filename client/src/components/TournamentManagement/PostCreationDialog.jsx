import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Image as ImageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  FormatColorFill as ColorIcon
} from '@mui/icons-material';
import { api } from '../../config/api';

const PostCreationDialog = ({ tournamentId, onPostCreated, buttonPosition = 'bottom-right' }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  // Dialog state
  const [open, setOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Color options
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

  // Handle dialog open/close
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    setOpen(false);
  };

  // Reset form
  const resetForm = () => {
    setTitle('');
    setContent('');
    setImage(null);
    setImagePreview('');
    setBackgroundColor('#ffffff');
    setError(null);
    setShowColorPicker(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image drop
  const handleImageDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setImage(file);
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Handle drag over
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Clear image
  const handleClearImage = () => {
    setImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError(t('postCreation.requiredFields', 'Title and content are required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // First create the post
      // Add a token to the request if it doesn't exist
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await api.client.post(`/api/debates/${tournamentId}/announcements`, {
        title,
        content,
        backgroundColor
      }, { headers });

      // Check if the response has the expected structure
      if (!response.data || !response.data.data || !response.data.data.announcement) {
        throw new Error('Unexpected response structure from server');
      }

      const announcementId = response.data.data.announcement._id;

      // If there's an image, upload it
      if (image) {
        const formData = new FormData();
        formData.append('image', image);

        // Add token to image upload request
        const token = localStorage.getItem('token');
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        await api.client.post(
          `/api/debates/${tournamentId}/announcements/${announcementId}/image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...authHeader
            }
          }
        );
      }

      // Reset form and close dialog
      resetForm();
      setOpen(false);

      // Notify parent component
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err.response?.data?.message || t('postCreation.error', 'Failed to create post'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Button position styles
  const getButtonPositionStyle = () => {
    switch (buttonPosition) {
      case 'bottom-right':
        return { position: 'fixed', bottom: 24, right: 24, zIndex: 1000 };
      case 'bottom-left':
        return { position: 'fixed', bottom: 24, left: 24, zIndex: 1000 };
      case 'top-right':
        return { position: 'fixed', top: 24, right: 24, zIndex: 1000 };
      case 'top-left':
        return { position: 'fixed', top: 24, left: 24, zIndex: 1000 };
      case 'inline':
        return { margin: 2 };
      default:
        return { position: 'fixed', bottom: 24, right: 24, zIndex: 1000 };
    }
  };

  return (
    <>
      {/* Floating Action Button to open dialog */}
      <Tooltip title={t('postCreation.createPost', 'Create New Post')}>
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleOpen}
          sx={{
            ...getButtonPositionStyle(),
            backgroundColor: '#2481cc',
            '&:hover': {
              backgroundColor: '#1a5c9a'
            }
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Post Creation Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: backgroundColor,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            maxWidth: { xs: '100%', sm: '600px' },
            mx: 'auto'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5,
          px: 2.5
        }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#2e3c42',
              fontSize: '1.1rem'
            }}
          >
            {t('postCreation.title', 'Create New Post')}
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={isSubmitting}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Divider sx={{ opacity: 0.6 }} />

        <DialogContent sx={{ px: 2.5, py: 2 }}>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Image Upload Area */}
            <Box sx={{ mt: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('postCreation.imageUpload', 'Add an image (optional)')}
                </Typography>
                <Tooltip title={t('postCreation.backgroundColorTooltip', 'Change background color')}>
                  <IconButton
                    size="small"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    color={showColorPicker ? 'primary' : 'default'}
                  >
                    <ColorIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Color Picker */}
              {showColorPicker && (
                <Box sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="caption" gutterBottom>
                    {t('postCreation.selectBackgroundColor', 'Select background color')}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {colorOptions.map((color) => (
                      <Box
                        key={color}
                        onClick={() => setBackgroundColor(color)}
                        sx={{
                          width: 30,
                          height: 30,
                          backgroundColor: color,
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          outline: backgroundColor === color ? '2px solid #1976d2' : 'none',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {!imagePreview ? (
                <Box
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#2481cc',
                      backgroundColor: 'rgba(36, 129, 204, 0.04)'
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleImageDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="post-image-upload"
                    type="file"
                    onChange={handleImageSelect}
                    ref={fileInputRef}
                  />
                  <PhotoCameraIcon sx={{ fontSize: 48, color: '#6a7d8a', mb: 1 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6a7d8a',
                      fontSize: '0.9rem',
                      mb: 0.5
                    }}
                    gutterBottom
                  >
                    {t('postCreation.dragDropImage', 'Drag and drop an image here, or click to select')}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6a7d8a',
                      fontSize: '0.75rem'
                    }}
                  >
                    {t('postCreation.supportedFormats', 'Supported formats: JPEG, PNG, GIF')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', display: 'block' }}
                  />
                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                      onClick={handleClearImage}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Title Field */}
            <TextField
              label={t('postCreation.titleLabel', 'Title')}
              fullWidth
              margin="normal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2
                  }
                }
              }}
            />

            {/* Content Field */}
            <TextField
              label={t('postCreation.contentLabel', 'Content')}
              fullWidth
              margin="normal"
              multiline
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder={t('postCreation.contentPlaceholder', 'Write your post here...')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 2
                  }
                }
              }}
            />

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        </DialogContent>

        <Divider sx={{ opacity: 0.6 }} />

        <DialogActions sx={{ p: 2, px: 2.5 }}>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{
              borderRadius: 8,
              px: 3,
              color: '#6a7d8a',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            sx={{
              borderRadius: 8,
              px: 3,
              backgroundColor: '#2481cc',
              '&:hover': {
                backgroundColor: '#1a5c9a'
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? t('postCreation.posting', 'Posting...') : t('postCreation.post', 'Post')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostCreationDialog;
