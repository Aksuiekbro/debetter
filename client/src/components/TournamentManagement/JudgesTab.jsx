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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon } from '@mui/icons-material';

// Assume JudgeDialog and DeleteConfirmationDialog will be created later

const JudgesTab = ({
  judges = [],
  onAddJudge, // Added prop
  onEditJudge, // Added prop
  onDeleteJudge, // Added prop
  onCheckInJudge,
  onCheckOutJudge,
  currentUser, // Added prop
  tournamentCreatorId, // Added prop
  isViewOnly // Add isViewOnly prop
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
    (judge.judgeRank && judge.judgeRank.toLowerCase().includes(searchTerm)) ||
    (judge.judgeStatus && judge.judgeStatus.toLowerCase().includes(searchTerm))
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
        {/* Hide Add button if view-only */}
        {isOrganizerOrAdmin && !isViewOnly && (
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
              <TableCell>{t('judgesTab.headerClub', { defaultValue: 'Club' })}</TableCell>
              <TableCell>{t('judgesTab.headerRank', { defaultValue: 'Rank' })}</TableCell>
              <TableCell>{t('judgesTab.headerStatus', { defaultValue: 'Status' })}</TableCell>
              <TableCell>{t('judgesTab.headerPresence', { defaultValue: 'Present' })}</TableCell>
              {/* Hide Actions column if view-only */}
              {isOrganizerOrAdmin && !isViewOnly && <TableCell align="right">{t('judgesTab.headerActions', { defaultValue: 'Actions' })}</TableCell>}
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
                <TableCell>{judge.club || t('common.notAvailable', { defaultValue: 'N/A' })}</TableCell>
                <TableCell>
                  {judge.yearsExperience > 0 || judge.courseLevel ? (
                    <>
                      {judge.yearsExperience > 0 && (
                        <span>{t('judgesTab.yearsExperience', { years: judge.yearsExperience, defaultValue: `${judge.yearsExperience} years` })}</span>
                      )}
                      {judge.yearsExperience > 0 && judge.courseLevel && ', '}
                      {judge.courseLevel && (
                        <span>{judge.courseLevel}</span>
                      )}
                      <br />
                      <span style={{ color: 'gray', fontSize: '0.9em' }}>
                        {judge.judgeRank || t('common.notAvailable', { defaultValue: 'N/A' })}
                      </span>
                    </>
                  ) : (
                    judge.judgeRank || t('common.notAvailable', { defaultValue: 'N/A' })
                  )}
                </TableCell>
                <TableCell>{judge.judgeStatus || t('common.notAvailable', { defaultValue: 'N/A' })}</TableCell>
                <TableCell>
                  {judge.isPresent ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )}
                </TableCell>
                {/* Hide Actions cell content if view-only */}
                {isOrganizerOrAdmin && !isViewOnly && (
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {judge.isPresent ? (
                        <IconButton
                          color="error"
                          onClick={() => onCheckOutJudge(judge.id)}
                          title={t('judgesTab.checkOutAction', { defaultValue: 'Mark as Absent' })}
                        >
                          <CancelIcon />
                        </IconButton>
                      ) : (
                        <IconButton
                          color="success"
                          onClick={() => onCheckInJudge(judge.id)}
                          title={t('judgesTab.checkInAction', { defaultValue: 'Mark as Present' })}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
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
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {filteredJudges.length === 0 && (
              <TableRow>
                {/* Adjust colspan based on whether Actions column is visible */}
                <TableCell colSpan={isOrganizerOrAdmin && !isViewOnly ? 8 : 7} align="center">
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