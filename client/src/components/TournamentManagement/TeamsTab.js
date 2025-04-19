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
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, Shuffle as ShuffleIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';

// Assume TeamDialog and DeleteConfirmationDialog will be created later

const TeamsTab = ({
  teams = [],
  onDeleteTeam,
  onAddTeam,
  onEditTeam,
  onRandomizeTeams,
  onCheckInTeam,
  onCheckOutTeam,
  loadingTeams = false,
  currentUser,
  tournamentCreatorId,
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
          {isOrganizerOrAdmin && (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onAddTeam}
                disabled={loadingTeams}
              >
                {t('teamsTab.addTeam', { defaultValue: 'Add Team' })}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShuffleIcon />}
                onClick={onRandomizeTeams}
                disabled={loadingTeams}
              >
                {t('teamsTab.randomize', { defaultValue: 'Randomize' })}
              </Button>
            </>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('teamsTab.headerName', { defaultValue: 'Team Name' })}</TableCell>
              <TableCell>{t('teamsTab.headerMembers', { defaultValue: 'Members' })}</TableCell>
              <TableCell>{t('teamsTab.headerClub', { defaultValue: 'Club' })}</TableCell>
              <TableCell>{t('teamsTab.headerCity', { defaultValue: 'City' })}</TableCell>
              <TableCell>{t('teamsTab.headerInstitution', { defaultValue: 'Institution' })}</TableCell>
              <TableCell>{t('teamsTab.headerPresence', { defaultValue: 'Present' })}</TableCell>
              {isOrganizerOrAdmin && <TableCell align="right">{t('teamsTab.headerActions', { defaultValue: 'Actions' })}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTeams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>{team.name}</TableCell>
                <TableCell>
                  {team.members ? (
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {team.members.map((member, idx) => (
                        <li key={idx}>{member.name} ({member.role})</li>
                      ))}
                    </ul>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>{team.club || 'N/A'}</TableCell>
                <TableCell>{team.city || 'N/A'}</TableCell>
                <TableCell>{team.institution || 'N/A'}</TableCell>
                <TableCell>
                  {team.isPresent ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </TableCell>
                {isOrganizerOrAdmin && (
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {team.isPresent ? (
                        <IconButton
                          color="error"
                          onClick={() => onCheckOutTeam(team.id)}
                          title={t('teamsTab.checkOutAction', { defaultValue: 'Mark as Absent' })}
                          disabled={loadingTeams}
                        >
                          <CancelIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          color="success"
                          onClick={() => onCheckInTeam(team.id)}
                          title={t('teamsTab.checkInAction', { defaultValue: 'Mark as Present' })}
                          disabled={loadingTeams}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      <IconButton
                        color="primary"
                        onClick={() => onEditTeam(team)}
                        title={t('teamsTab.editAction', { defaultValue: 'Edit Team' })}
                        disabled={loadingTeams}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => onDeleteTeam(team.id)}
                        title={t('teamsTab.deleteAction', { defaultValue: 'Delete Team' })}
                        disabled={loadingTeams}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredTeams.length === 0 && (
              <TableRow>
                <TableCell colSpan={isOrganizerOrAdmin ? 7 : 6} align="center"> {/* Adjust colspan based on number of columns */}
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