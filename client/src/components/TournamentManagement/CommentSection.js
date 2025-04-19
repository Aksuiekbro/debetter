import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  ChatBubbleOutline as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon
} from '@mui/icons-material';
import { api } from '../../config/api';

const CommentSection = ({
  tournamentId,
  announcement,
  currentUser,
  onCommentAdded,
  onCommentDeleted
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commentMenuAnchorEl, setCommentMenuAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);

  // Check if user can comment (all authenticated users can comment)
  const canComment = !!currentUser;

  // Get comment count
  const commentCount = announcement.comments?.length || 0;

  // Toggle comment section expansion
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  // Open all comments dialog
  const handleOpenAllComments = () => {
    setShowAllComments(true);
  };

  // Close all comments dialog
  const handleCloseAllComments = () => {
    setShowAllComments(false);
  };

  // Handle comment submission
  const handleAddComment = async () => {
    if (!commentText.trim() || !canComment) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.client.post(`/api/debates/${tournamentId}/announcements/${announcement._id}/comments`, {
        content: commentText
      });

      setCommentText('');
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      setError(t('commentSection.errorAddingComment', 'Failed to add comment'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment menu open
  const handleCommentMenuOpen = (event, comment) => {
    setCommentMenuAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  // Handle comment menu close
  const handleCommentMenuClose = () => {
    setCommentMenuAnchorEl(null);
    setSelectedComment(null);
  };

  // Handle comment deletion
  const handleDeleteComment = async () => {
    if (!selectedComment) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.client.delete(`/api/debates/${tournamentId}/announcements/comments/${selectedComment._id}`);

      if (onCommentDeleted) {
        onCommentDeleted();
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError(t('commentSection.errorDeletingComment', 'Failed to delete comment'));
    } finally {
      setSubmitting(false);
      handleCommentMenuClose();
    }
  };

  // Check if user can delete a comment (comment author or admin/organizer)
  const canDeleteComment = (comment) => {
    if (!currentUser) return false;

    const isCommentAuthor = comment.createdBy?._id === currentUser._id;
    const isOrganizerOrAdmin = currentUser.role === 'organizer' || currentUser.role === 'admin';

    return isCommentAuthor || isOrganizerOrAdmin;
  };

  // Render a single comment
  const renderComment = (comment, showMenu = true) => (
    <ListItem
      key={comment._id}
      alignItems="flex-start"
      sx={{
        px: 0,
        py: 0.75,
        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
        position: 'relative',
        borderRadius: 1
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={comment.createdBy?.profilePhotoUrl}
              alt={comment.createdBy?.username || 'User'}
              sx={{
                width: 22,
                height: 22,
                fontSize: '0.75rem',
                bgcolor: 'primary.light'
              }}
            >
              {(comment.createdBy?.username || 'U')[0].toUpperCase()}
            </Avatar>
            <Typography
              variant="subtitle2"
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#2e3c42'
              }}
            >
              {comment.createdBy?.username || 'Unknown User'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.7rem' }}
            >
              {new Date(comment.createdAt).toLocaleString()}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ pl: 3.75, mt: 0.25 }}>
            <Typography
              variant="body2"
              component="div"
              sx={{
                whiteSpace: 'pre-wrap',
                fontSize: '0.85rem',
                color: '#4e5a60',
                lineHeight: 1.4
              }}
            >
              {comment.content}
            </Typography>

            {/* Telegram-like action buttons */}
            <Box sx={{ display: 'flex', mt: 0.5, gap: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <ThumbUpIcon sx={{ fontSize: '0.85rem' }} />
                {t('commentSection.like', 'Like')}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                {t('commentSection.reply', 'Reply')}
              </Typography>
            </Box>
          </Box>
        }
        sx={{
          margin: 0,
          '& .MuiListItemText-primary': {
            marginBottom: 0
          }
        }}
      />

      {showMenu && canDeleteComment(comment) && (
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 0,
            color: 'text.secondary',
            padding: 0.5
          }}
          onClick={(e) => handleCommentMenuOpen(e, comment)}
        >
          <MoreVertIcon fontSize="small" sx={{ fontSize: '1rem' }} />
        </IconButton>
      )}
    </ListItem>
  );

  return (
    <>
      {/* Comment Section Header - Always visible */}
      <Box
        sx={{
          px: 2.5,
          py: 1,
          borderTop: '1px solid rgba(0,0,0,0.08)',
          mt: 0,
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' }
        }}
        onClick={handleToggleExpand}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#6a7d8a'
            }}
          >
            <CommentIcon fontSize="small" sx={{ fontSize: '1rem', color: '#6a7d8a' }} />
            {commentCount > 0 ? (
              <>
                {commentCount} {t('commentSection.comments', 'Comments')}
              </>
            ) : (
              t('commentSection.leaveComment', 'Leave a comment')
            )}
          </Typography>
          {expanded ?
            <ExpandLessIcon fontSize="small" sx={{ color: '#6a7d8a' }} /> :
            <ExpandMoreIcon fontSize="small" sx={{ color: '#6a7d8a' }} />
          }
        </Box>
      </Box>

      {/* Collapsible Comment Section */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2.5, pb: 2 }}>
          {/* Comment List - Show up to 3 most recent comments */}
          {announcement.comments && announcement.comments.length > 0 && (
            <>
              <List dense sx={{ py: 0.5, mt: 0.5 }}>
                {announcement.comments.slice(-3).map(comment => renderComment(comment))}
              </List>

              {/* "View all comments" button if there are more than 3 comments */}
              {announcement.comments.length > 3 && (
                <Button
                  size="small"
                  onClick={handleOpenAllComments}
                  sx={{
                    mt: 0.5,
                    textTransform: 'none',
                    color: '#2481cc',
                    padding: '2px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 400,
                    '&:hover': {
                      backgroundColor: 'rgba(36, 129, 204, 0.05)'
                    }
                  }}
                >
                  {t('commentSection.viewAllComments', 'View all {{count}} comments', { count: announcement.comments.length })}
                </Button>
              )}
            </>
          )}

          {/* Add Comment Form */}
          {canComment ? (
            <Box sx={{ display: 'flex', mt: 1.5, gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={t('commentSection.addComment', 'Add a comment...')}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submitting}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    '&.Mui-focused': {
                      backgroundColor: '#fff'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2481cc',
                      borderWidth: 1
                    },
                    '& fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.08)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0, 0, 0, 0.15)'
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.85rem',
                    padding: '10px 14px'
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || submitting}
                        color="primary"
                        sx={{
                          color: '#2481cc',
                          '&.Mui-disabled': {
                            color: 'rgba(0, 0, 0, 0.26)'
                          }
                        }}
                      >
                        {submitting ? <CircularProgress size={18} /> : <SendIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1.5,
                fontStyle: 'italic',
                fontSize: '0.8rem',
                color: '#6a7d8a'
              }}
            >
              {t('commentSection.loginToComment', 'Please log in to leave a comment')}
            </Typography>
          )}

          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </Box>
      </Collapse>

      {/* All Comments Dialog */}
      <Dialog
        open={showAllComments}
        onClose={handleCloseAllComments}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{
          fontSize: '1rem',
          fontWeight: 600,
          color: '#2e3c42',
          py: 1.5
        }}>
          {t('commentSection.allComments', 'All Comments')} ({announcement.comments?.length || 0})
        </DialogTitle>
        <Divider sx={{ opacity: 0.6 }} />
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          {announcement.comments && announcement.comments.length > 0 ? (
            <List sx={{ py: 0 }}>
              {announcement.comments.map(comment => renderComment(comment, true))}
            </List>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: 'center', py: 3 }}
            >
              {t('commentSection.noComments', 'No comments yet')}
            </Typography>
          )}
        </DialogContent>
        <Divider sx={{ opacity: 0.6 }} />
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button
            onClick={handleCloseAllComments}
            sx={{
              color: '#2481cc',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            {t('common.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Menu */}
      <Menu
        anchorEl={commentMenuAnchorEl}
        open={Boolean(commentMenuAnchorEl)}
        onClose={handleCommentMenuClose}
        PaperProps={{
          sx: {
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            borderRadius: 1.5,
            minWidth: 150
          }
        }}
      >
        <MenuItem
          onClick={handleDeleteComment}
          sx={{
            py: 1,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ListItemText
            primary={t('commentSection.deleteComment', 'Delete')}
            primaryTypographyProps={{
              sx: { fontSize: '0.85rem', fontWeight: 500 }
            }}
          />
          <DeleteIcon fontSize="small" sx={{ ml: 1, color: '#f44336', fontSize: '1.1rem' }} />
        </MenuItem>
      </Menu>
    </>
  );
};

export default CommentSection;
