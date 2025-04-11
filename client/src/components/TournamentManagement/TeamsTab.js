import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Delete as DeleteIcon } from '@mui/icons-material'; // Removed Add, Edit, Shuffle

// Assume TeamDialog and DeleteConfirmationDialog will be created later

const TeamsTab = ({
  teams = [],
  onDeleteTeam, // Corresponds to handleDeleteTeam(id)
  // Removed onAddTeam, onEditTeam, onRandomizeTeams, loadingTeams
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

  // Simple client-side filtering based on name and members
  const filteredTeams = teams.filter(team => {
    const nameMatch = team.name.toLowerCase().includes(searchTerm);
    // Handle members potentially being an array or string, ensuring it's searchable
    const membersString = Array.isArray(team.members) ? team.members.join(', ') : (team.members || '');
    const membersMatch = membersString.toLowerCase().includes(searchTerm);
    return nameMatch || membersMatch;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('teamsTab.title', { count: teams.length, defaultValue: `Tournament Teams (${teams.length})` })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('teamsTab.searchPlaceholder', { defaultValue: 'Search teams...' })}
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 250 }}
          />
          {/* Add Team and Randomize Teams buttons removed */}
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('teamsTab.headerName', { defaultValue: 'Team Name' })}</TableCell>
              <TableCell>{t('teamsTab.headerMembers', { defaultValue: 'Members' })}</TableCell> {/* New Header */}
              {/* Removed Leader/Speaker headers */}
              {/* Removed Wins/Points comments */}
              {isOrganizerOrAdmin && <TableCell align="right">{t('teamsTab.headerActions', { defaultValue: 'Actions' })}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTeams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>{team.name}</TableCell>
                <TableCell>{team.members || 'N/A'}</TableCell>
                {/* Removed Leader/Speaker cells */}
                {/* Removed Wins/Points comments */}
                {isOrganizerOrAdmin && (
                  <TableCell align="right">
                    {/* Removed Edit Button */}
                    <IconButton
                      color="error"
                      onClick={() => onDeleteTeam(team.id)}
                      title={t('teamsTab.deleteAction', { defaultValue: 'Delete Team' })} // Added tooltip/title
                      // Removed disabled={loadingTeams} as loadingTeams prop is removed
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredTeams.length === 0 && (
              <TableRow>
                <TableCell colSpan={isOrganizerOrAdmin ? 3 : 2} align="center"> {/* Adjust colspan based on Actions column */}
                  {teams.length > 0
                    ? t('teamsTab.noMatch', { defaultValue: 'No teams match search' })
                    : t('teamsTab.noTeams', { defaultValue: 'No teams found' })}
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

export default TeamsTab;