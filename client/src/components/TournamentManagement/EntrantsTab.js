import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
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
import { useTranslation } from 'react-i18next';

// Assume EntrantDialog and DeleteConfirmationDialog will be created later
// import EntrantDialog from './EntrantDialog';
// import DeleteConfirmationDialog from './DeleteConfirmationDialog';

const EntrantsTab = ({
  entrants = [],
  onAddEntrant,
  onEditEntrant,
  onDeleteEntrant, // Expects userId now
  onGenerateTestData,
  teams = [], // Add teams prop to map teamId to name
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

  // Updated client-side filtering
  const filteredEntrants = entrants.filter(entrant => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const team = teams.find(t => t.id === entrant.teamId);
    const teamName = team ? team.name.toLowerCase() : '';

    return (
      entrant.name.toLowerCase().includes(lowerSearchTerm) ||
      (entrant.email && entrant.email.toLowerCase().includes(lowerSearchTerm)) ||
      (entrant.phoneNumber && entrant.phoneNumber.toLowerCase().includes(lowerSearchTerm)) ||
      (entrant.club && entrant.club.toLowerCase().includes(lowerSearchTerm)) ||
      (entrant.tournamentRole && entrant.tournamentRole.toLowerCase().includes(lowerSearchTerm)) ||
      (teamName && teamName.includes(lowerSearchTerm))
    );
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('entrantsTab.title', { count: entrants.length, defaultValue: `Tournament Entrants (${entrants.length})` })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('entrantsTab.searchPlaceholder', { defaultValue: 'Search by name or email...' })}
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 250 }}
          />
          {isOrganizerOrAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onAddEntrant} // Use the passed handler
            >
              {t('entrantsTab.addEntrantButton', { defaultValue: 'Add Entrant' })}
            </Button>
          )}
          {/* Keep Generate Test Data button if needed, but only for organizers/admins */}
          {isOrganizerOrAdmin && onGenerateTestData && (
             <Button
               variant="outlined"
               color="secondary"
               onClick={onGenerateTestData}
             >
               {t('entrantsTab.generateTestDataButton', { defaultValue: 'Generate Test Data' })}
             </Button>
           )}
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('entrantsTab.headerName', { defaultValue: 'Name' })}</TableCell>
              <TableCell>{t('entrantsTab.headerEmail', { defaultValue: 'Email' })}</TableCell>
              <TableCell>{t('entrantsTab.headerPhone', { defaultValue: 'Phone Number' })}</TableCell>
              <TableCell>{t('entrantsTab.headerClub', { defaultValue: 'Club' })}</TableCell>
              <TableCell>{t('entrantsTab.headerRole', { defaultValue: 'Role' })}</TableCell>
              <TableCell>{t('entrantsTab.headerTeam', { defaultValue: 'Team' })}</TableCell>
              {isOrganizerOrAdmin && <TableCell align="right">{t('entrantsTab.headerActions', { defaultValue: 'Actions' })}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntrants.map((entrant) => {
              const team = teams.find(t => t.id === entrant.teamId);
              return (
                <TableRow key={entrant.userId}> {/* Use userId as key */}
                  <TableCell>
                    <Link to={`/profile/${entrant.userId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {entrant.name}
                    </Link>
                  </TableCell>
                  <TableCell>{entrant.email}</TableCell>
                  <TableCell>{entrant.phoneNumber}</TableCell>
                  <TableCell>{entrant.club}</TableCell>
                  <TableCell>{entrant.tournamentRole}</TableCell>
                  <TableCell>{team ? team.name : 'N/A'}</TableCell> {/* Display team name */}
                  {isOrganizerOrAdmin && (
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => onEditEntrant(entrant)} // Pass full entrant object
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => onDeleteEntrant(entrant.userId)} // Pass userId for deletion
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {filteredEntrants.length === 0 && (
              <TableRow>
                <TableCell colSpan={isOrganizerOrAdmin ? 7 : 6} align="center"> {/* Adjust colspan based on Actions column */}
                  {entrants.length > 0 ? t('entrantsTab.noMatch', { defaultValue: 'No entrants match search' }) : t('entrantsTab.noEntrants', { defaultValue: 'No entrants found' }) }
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