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

// Assume JudgeDialog and DeleteConfirmationDialog will be created later

const JudgesTab = ({
  judges = [],
  onAddJudge, // Corresponds to handleOpenJudgeDialog(false)
  onEditJudge, // Corresponds to handleOpenJudgeDialog(true, judge)
  onDeleteJudge, // Corresponds to handleDeleteJudge(id)
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  // Simple client-side filtering
  const filteredJudges = judges.filter(judge =>
    judge.name.toLowerCase().includes(searchTerm) ||
    (judge.email && judge.email.toLowerCase().includes(searchTerm)) ||
    (judge.role && judge.role.toLowerCase().includes(searchTerm))
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Tournament Judges ({judges.length})
        </Typography>
        {/* Optional Search Field */}
        <TextField
            size="small"
            placeholder="Search judges..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 250, mr: 2 }} // Add margin if needed
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddJudge}
        >
          Add Judge
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJudges.map((judge) => (
              <TableRow key={judge.id}>
                <TableCell>{judge.name}</TableCell>
                <TableCell>{judge.role}</TableCell>
                <TableCell>{judge.email}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => onEditJudge(judge)} // Pass judge data
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => onDeleteJudge(judge.id)} // Pass judge ID
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredJudges.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {judges.length > 0 ? 'No judges match search' : 'No judges found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs handled by parent */}
    </Box>
  );
};

export default JudgesTab;