import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';

const MyDebates = () => {
  const navigate = useNavigate();
  const [debates, setDebates] = useState({ created: [], participated: [] });
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedDebate, setSelectedDebate] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    startDate: new Date(),
    maxParticipants: 2
  });

  useEffect(() => {
    fetchMyDebates();
  }, []);

  const fetchMyDebates = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch('http://localhost:5001/api/debates/my-debates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDebates(data);
      } else {
        const errorData = await response.json();
        console.error('Error fetching debates:', errorData.message);
      }
    } catch (error) {
      console.error('Error fetching debates:', error);
    }
  };

  const handleEditClick = (debate) => {
    setSelectedDebate(debate);
    setEditForm({
      title: debate.title,
      description: debate.description,
      category: debate.category,
      difficulty: debate.difficulty,
      startDate: new Date(debate.startDate),
      maxParticipants: debate.maxParticipants
    });
    setEditDialog(true);
  };

  const handleEditSubmit = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/debates/${selectedDebate._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        fetchMyDebates();
        setEditDialog(false);
      }
    } catch (error) {
      console.error('Error updating debate:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const DebateCard = ({ debate, isCreator }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6">{debate.title}</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {debate.description}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2">
              Category: {debate.category}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              Difficulty: {debate.difficulty}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              Status: {debate.status}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2">
              Participants: {debate.participants?.length}/{debate.maxParticipants}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => navigate(`/debates/${debate._id}`)}>
          View Details
        </Button>
        {isCreator && (
          <Button size="small" onClick={() => handleEditClick(debate)}>
            Edit Settings
          </Button>
        )}
      </CardActions>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Debates
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Created Debates" />
          <Tab label="Participated Debates" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {debates.created.map(debate => (
            <Grid item xs={12} key={debate._id}>
              <DebateCard debate={debate} isCreator={true} />
            </Grid>
          ))}
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {debates.participated.map(debate => (
            <Grid item xs={12} key={debate._id}>
              <DebateCard debate={debate} isCreator={false} />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Debate Settings</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            >
              <MenuItem value="politics">Politics</MenuItem>
              <MenuItem value="technology">Technology</MenuItem>
              <MenuItem value="science">Science</MenuItem>
              <MenuItem value="society">Society</MenuItem>
              <MenuItem value="economics">Economics</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={editForm.difficulty}
              onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Date"
              value={editForm.startDate}
              onChange={(newValue) => setEditForm({ ...editForm, startDate: newValue })}
              renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
            />
          </LocalizationProvider>
          <TextField
            fullWidth
            label="Max Participants"
            type="number"
            value={editForm.maxParticipants}
            onChange={(e) => setEditForm({ ...editForm, maxParticipants: parseInt(e.target.value) })}
            margin="normal"
            inputProps={{ min: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyDebates;