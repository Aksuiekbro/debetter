import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import AnnouncementsFeedView from './AnnouncementsFeedView';

// This is a test component to directly render the AnnouncementsFeedView
// without requiring authentication or navigation
const TestFeed = () => {
  // Mock data
  const mockUser = {
    _id: '123',
    username: 'testuser',
    role: 'organizer'
  };

  const mockTournament = {
    _id: 'fsfd',
    title: 'Test Tournament',
    createdBy: '123'
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Feed Component Test
        </Typography>
        <Box sx={{ mt: 3 }}>
          <AnnouncementsFeedView 
            currentUser={mockUser} 
            tournamentCreatorId="123" 
            tournament={mockTournament} 
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default TestFeed;
