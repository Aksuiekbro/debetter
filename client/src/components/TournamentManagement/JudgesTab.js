import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button, // Added
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton, // Added
  TextField
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'; // Added

// Assume JudgeDialog and DeleteConfirmationDialog will be created later

const JudgesTab = ({
  judges = [],
  onAddJudge, // Added prop
  onEditJudge, // Added prop
  onDeleteJudge, // Added prop
  currentUser, // Added prop
  tournamentCreatorId, // Added prop
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Determine if the current user is an organizer or admin for this tournament
  const isOrganizerOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser._id === tournamentCreatorId);

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
          {t('judgesTab.title', { count: judges.length, defaultValue: `Tournament Judges (${judges.length})` })}
        </Typography>
        {/* Optional Search Field */}
        <TextField
            size="small"
            placeholder={t('judgesTab.searchPlaceholder', { defaultValue: 'Search judges...' })}
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 250 }}
        />
        {isOrganizerOrAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddJudge} // Use the passed handler
          >
            {t('judgesTab.addJudgeButton', { defaultValue: 'Add Judge' })}
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('judgesTab.headerName', { defaultValue: 'Name' })}</TableCell>
              <TableCell>{t('judgesTab.headerEmail', { defaultValue: 'Email' })}</TableCell>
              <TableCell>{t('judgesTab.headerPhone', { defaultValue: 'Phone Number' })}</TableCell>
              <TableCell>{t('judgesTab.headerRank', { defaultValue: 'Rank' })}</TableCell>
              {isOrganizerOrAdmin && <TableCell align="right">{t('judgesTab.headerActions', { defaultValue: 'Actions' })}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJudges.map((judge) => (
              <TableRow key={judge.id}>
                <TableCell>
                  <Link to={`/profile/${judge.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {judge.name}
                  </Link>
                </TableCell>
                <TableCell>{judge.email || t('common.notAvailable', { defaultValue: 'N/A' })}</TableCell>
                <TableCell>{judge.phoneNumber || t('common.notAvailable', { defaultValue: 'N/A' })}</TableCell>
                <TableCell>{judge.role || t('common.notAvailable', { defaultValue: 'N/A' })}</TableCell>
                {isOrganizerOrAdmin && (
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => onEditJudge(judge)} // Pass full judge object
                      title={t('judgesTab.editAction', { defaultValue: 'Edit Judge' })}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => onDeleteJudge(judge.id)} // Pass judge id
                      title={t('judgesTab.deleteAction', { defaultValue: 'Delete Judge' })}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredJudges.length === 0 && (
              <TableRow>
                <TableCell colSpan={isOrganizerOrAdmin ? 5 : 4} align="center"> {/* Adjust colspan */}
                  {judges.length > 0 ? t('judgesTab.noMatch', { defaultValue: 'No judges match search' }) : t('judgesTab.noJudges', { defaultValue: 'No judges found' })}
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