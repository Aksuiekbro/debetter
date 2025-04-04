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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Shuffle as ShuffleIcon } from '@mui/icons-material';

// Assume TeamDialog and DeleteConfirmationDialog will be created later

const TeamsTab = ({
  teams = [],
  onAddTeam, // Corresponds to handleOpenTeamDialog(false)
  onEditTeam, // Corresponds to handleOpenTeamDialog(true, team)
  onDeleteTeam, // Corresponds to handleDeleteTeam(id)
  onRandomizeTeams, // Corresponds to randomizeTeams()
  loadingTeams // Loading state from useTeamManagement
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  // Simple client-side filtering
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm) ||
    (team.leader && team.leader.toLowerCase().includes(searchTerm)) ||
    (team.speaker && team.speaker.toLowerCase().includes(searchTerm))
  );

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
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ShuffleIcon />}
            onClick={onRandomizeTeams}
            disabled={loadingTeams} // Disable while randomizing/saving
          >
            {t('teamsTab.randomizeButton', { defaultValue: 'Randomize Teams' })}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddTeam}
            disabled={loadingTeams}
          >
            {t('teamsTab.addTeamButton', { defaultValue: 'Add Team' })}
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('teamsTab.headerName', { defaultValue: 'Team Name' })}</TableCell>
              <TableCell>{t('teamsTab.headerLeader', { defaultValue: 'Role 1 / Leader' })}</TableCell>
              <TableCell>{t('teamsTab.headerSpeaker', { defaultValue: 'Role 2 / Speaker' })}</TableCell>
              {/* Optional: Add Wins/Losses/Points if needed here */}
              {/* <TableCell align="right">Wins</TableCell> */}
              {/* <TableCell align="right">Points</TableCell> */}
              <TableCell align="right">{t('teamsTab.headerActions', { defaultValue: 'Actions' })}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTeams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>{team.name}</TableCell>
                <TableCell>{team.leader}</TableCell>
                <TableCell>{team.speaker}</TableCell>
                {/* <TableCell align="right">{team.wins || 0}</TableCell> */}
                {/* <TableCell align="right">{team.points || 0}</TableCell> */}
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => onEditTeam(team)}
                    disabled={loadingTeams}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => onDeleteTeam(team.id)}
                    disabled={loadingTeams}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredTeams.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center"> {/* Adjust colSpan if columns added */}
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