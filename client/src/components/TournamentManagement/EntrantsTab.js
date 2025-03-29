import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

// Assume EntrantDialog and DeleteConfirmationDialog will be created later
// import EntrantDialog from './EntrantDialog';
// import DeleteConfirmationDialog from './DeleteConfirmationDialog';

const EntrantsTab = ({
  entrants = [],
  onAddEntrant, // Corresponds to handleOpenEntrantDialog(false)
  onEditEntrant, // Corresponds to handleOpenEntrantDialog(true, entrant)
  onDeleteEntrant, // Corresponds to handleDeleteEntrant(id)
  onGenerateTestData, // Function to trigger test data generation
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  // Simple client-side filtering based on search term
  const filteredEntrants = entrants.filter(entrant =>
    entrant.name.toLowerCase().includes(searchTerm) ||
    (entrant.email && entrant.email.toLowerCase().includes(searchTerm))
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Tournament Entrants ({entrants.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 250 }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddEntrant} // Use the passed handler
          >
            Add Entrant
          </Button>
          {/* Keep Generate Test Data button if needed */}
          {onGenerateTestData && (
             <Button
               variant="outlined"
               color="secondary"
               onClick={onGenerateTestData}
             >
               Generate Test Data
             </Button>
           )}
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Enroll Date</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntrants.map((entrant) => (
              <TableRow key={entrant.id}>
                <TableCell>{entrant.name}</TableCell>
                <TableCell>{entrant.enrollDate}</TableCell>
                <TableCell>{entrant.email}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => onEditEntrant(entrant)} // Pass entrant data
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => onDeleteEntrant(entrant.id)} // Pass entrant ID
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredEntrants.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {entrants.length > 0 ? 'No entrants match search' : 'No entrants found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/*
        Dialogs will be rendered in the main TournamentManagement component
        and controlled by the state within the respective hooks.
        We pass the handlers (onAddEntrant, onEditEntrant, onDeleteEntrant)
        up to the parent, which then uses the hook functions.
      */}
    </Box>
  );
};

export default EntrantsTab;