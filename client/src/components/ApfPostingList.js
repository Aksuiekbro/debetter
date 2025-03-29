import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  InputAdornment,
  Divider,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Alert,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  Room as LocationIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  DirectionsRun as InProgressIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Send as SendIcon,
  Videocam as VideocamIcon,
  NotificationsActive as NotifyIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return 'Not scheduled';
  
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Status chip renderer
const StatusChip = ({ status }) => {
  let chipProps = {
    label: 'Unknown',
    color: 'default',
    icon: <ScheduleIcon />
  };
  
  switch(status) {
    case 'scheduled':
      chipProps = {
        label: 'Scheduled',
        color: 'primary',
        icon: <ScheduleIcon />
      };
      break;
    case 'in_progress':
      chipProps = {
        label: 'In Progress',
        color: 'warning',
        icon: <InProgressIcon />
      };
      break;
    case 'completed':
      chipProps = {
        label: 'Completed',
        color: 'success',
        icon: <CheckCircleIcon />
      };
      break;
    case 'cancelled':
      chipProps = {
        label: 'Cancelled',
        color: 'error',
        icon: <CancelIcon />
      };
      break;
    default:
      break;
  }
  
  return <Chip {...chipProps} size="small" />;
};

const ApfPostingList = ({ 
  postings = [], 
  isLoading = false,
  onStatusChange = () => {},
  onSendReminder = () => {},
  onEdit = () => {},
  onDelete = () => {}
}) => {
  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filteredPostings, setFilteredPostings] = useState(postings);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedPosting, setSelectedPosting] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Apply filters when postings change or filter criteria change
  useEffect(() => {
    filterPostings();
  }, [postings, searchTerm, filterStatus]);
  
  const filterPostings = () => {
    let filtered = [...postings];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(post => post.status === filterStatus);
    }
    
    // Apply search filter (match team names, location, theme, or judges)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(post => {
        return (
          (post.team1Name?.toLowerCase().includes(lowerSearch) || post.team1?.name?.toLowerCase().includes(lowerSearch)) || 
          (post.team2Name?.toLowerCase().includes(lowerSearch) || post.team2?.name?.toLowerCase().includes(lowerSearch)) ||
          post.location?.toLowerCase().includes(lowerSearch) ||
          post.virtualLink?.toLowerCase().includes(lowerSearch) ||
          (typeof post.theme === 'string' && post.theme.toLowerCase().includes(lowerSearch)) ||
          post.judgeNames?.toLowerCase().includes(lowerSearch) ||
          post.batchName?.toLowerCase().includes(lowerSearch)
        );
      });
    }
    
    // Sort by scheduled time (newest first)
    filtered.sort((a, b) => {
      const dateA = a.scheduledTime ? new Date(a.scheduledTime) : new Date(0);
      const dateB = b.scheduledTime ? new Date(b.scheduledTime) : new Date(0);
      return dateB - dateA;
    });
    
    setFilteredPostings(filtered);
  };
  
  // Handle menu operations
  const handleOpenStatusMenu = (event, posting) => {
    setStatusMenuAnchor(event.currentTarget);
    setSelectedPosting(posting);
  };
  
  const handleOpenActionMenu = (event, posting) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedPosting(posting);
  };
  
  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null);
  };
  
  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
  };
  
  const handleStatusChange = (status) => {
    if (selectedPosting) {
      onStatusChange(selectedPosting.id, status);
    }
    handleCloseStatusMenu();
  };
  
  // Confirmation dialog handlers
  const handleOpenConfirmDialog = (action) => {
    setConfirmAction(action);
    setConfirmDialogOpen(true);
    handleCloseActionMenu();
  };
  
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };
  
  const handleConfirmAction = () => {
    if (!selectedPosting) return;
    
    switch (confirmAction) {
      case 'delete':
        onDelete(selectedPosting.id);
        break;
      case 'reminder':
        onSendReminder(selectedPosting.id);
        break;
      default:
        break;
    }
    
    handleCloseConfirmDialog();
  };
  
  const handleEditPosting = () => {
    if (selectedPosting) {
      onEdit(selectedPosting);
    }
    handleCloseActionMenu();
  };
  
  // Group postings by batch
  const groupedPostings = {};
  filteredPostings.forEach(posting => {
    const batchName = posting.batchName || 'Ungrouped Games';
    if (!groupedPostings[batchName]) {
      groupedPostings[batchName] = [];
    }
    groupedPostings[batchName].push(posting);
  });
  
  return (
    <Box>
      {/* Search and filter toolbar */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          placeholder="Search games, teams, locations..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: '150px' }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {isLoading ? (
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
      ) : filteredPostings.length > 0 ? (
        // Display postings grouped by batch
        Object.entries(groupedPostings).map(([batchName, batchPostings]) => (
          <Box key={batchName} sx={{ mb: 4 }}>
            {/* Batch header (only show if it's a named batch) */}
            {batchName !== 'Ungrouped Games' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon color="primary" />
                  {batchName}
                  <Chip 
                    label={`${batchPostings.length} Games`} 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                </Typography>
              </Box>
            )}
            
            <Grid container spacing={2}>
              {batchPostings.map((posting) => (
                <Grid item xs={12} md={6} lg={4} key={posting.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      position: 'relative',
                      borderLeft: '4px solid',
                      borderColor: posting.status === 'completed' ? 'success.main' : 
                                   posting.status === 'in_progress' ? 'warning.main' : 
                                   posting.status === 'cancelled' ? 'error.main' : 'primary.main',
                    }}
                  >
                    <CardContent>
                      {/* Game header with teams and status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {posting.team1Name || posting.team1?.name || 'Team 1'} vs {posting.team2Name || posting.team2?.name || 'Team 2'}
                        </Typography>
                        <Box>
                          <StatusChip status={posting.status} />
                        </Box>
                      </Box>
                      
                      {/* Game details as chips */}
                      <Stack direction="column" spacing={1} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {formatDate(posting.scheduledTime)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {posting.virtualLink ? (
                            <VideocamIcon fontSize="small" color="action" />
                          ) : (
                            <LocationIcon fontSize="small" color="action" />
                          )}
                          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {posting.virtualLink ? 'Virtual Meeting' : posting.location || 'No location set'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {posting.judgeNames || `${posting.judges?.length || 0} Judges`}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <AssignmentIcon fontSize="small" color="action" sx={{ mt: 0.5 }} />
                          <Typography variant="body2" sx={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {posting.useCustomModel ? 'Custom Model' : (
                              typeof posting.theme === 'string' ? posting.theme : posting.themeLabel || 'No theme set'
                            )}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      {/* Notification indicator if applicable */}
                      {posting.notifications?.judgesNotified && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                          <NotifyIcon fontSize="small" color="success" />
                          <Typography variant="caption" color="text.secondary">
                            Notifications sent {posting.notifications.sentAt ? 
                              `on ${new Date(posting.notifications.sentAt).toLocaleDateString()}` : ''}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* Action buttons */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Tooltip title="Change Status">
                          <IconButton size="small" onClick={(e) => handleOpenStatusMenu(e, posting)}>
                            <ScheduleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Actions">
                          <IconButton size="small" onClick={(e) => handleOpenActionMenu(e, posting)}>
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          No games found matching your filters. Try adjusting your search or filter criteria.
        </Alert>
      )}
      
      {/* Status change menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleCloseStatusMenu}
      >
        <MenuItem onClick={() => handleStatusChange('scheduled')}>
          <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
          Mark as Scheduled
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('in_progress')}>
          <InProgressIcon fontSize="small" sx={{ mr: 1 }} />
          Mark as In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('completed')}>
          <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
          Mark as Completed
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('cancelled')}>
          <CancelIcon fontSize="small" sx={{ mr: 1 }} />
          Mark as Cancelled
        </MenuItem>
      </Menu>
      
      {/* Actions menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
      >
        <MenuItem onClick={handleEditPosting}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Game
        </MenuItem>
        <MenuItem onClick={() => handleOpenConfirmDialog('reminder')}>
          <SendIcon fontSize="small" sx={{ mr: 1 }} />
          Send Reminder
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleOpenConfirmDialog('delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Game
        </MenuItem>
      </Menu>
      
      {/* Confirmation dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>
          {confirmAction === 'delete' ? 'Confirm Deletion' : 
           confirmAction === 'reminder' ? 'Send Reminder' : 'Confirm Action'}
        </DialogTitle>
        <DialogContent>
          {confirmAction === 'delete' && (
            <Typography>
              Are you sure you want to delete this game? This action cannot be undone.
            </Typography>
          )}
          {confirmAction === 'reminder' && (
            <Typography>
              Send a reminder notification to all judges and team members about this game?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction} 
            color={confirmAction === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            {confirmAction === 'delete' ? 'Delete' : 
             confirmAction === 'reminder' ? 'Send Reminder' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApfPostingList; 