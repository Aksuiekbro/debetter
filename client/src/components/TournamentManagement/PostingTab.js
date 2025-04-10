import React from 'react';
import {
  Box,
  Typography,
  Button,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Import the existing components used within this tab
import EnhancedApfPostingCard from '../EnhancedApfPostingCard';
import ApfPostingList from '../ApfPostingList';
// import ThemeManager from '../ui/ThemeManager'; // Removed - File not found

// Assume ApfGameDialog and DeleteConfirmationDialog will be created later

const PostingTab = ({
  // Data needed for the card/list
  teams = [],
  judges = [],
  apfPostings = [],
  loadingPostings, // Loading state specifically for the postings list

  // State and handlers from useApfPostingManagement
  currentApfGameData,
  batchMode,
  setBatchMode,
  onInputChange, // Renamed from handleApfCardChange for clarity as prop
  onConfirm,     // Renamed from handleConfirmApfGame
  onBatchCreate, // Renamed from handleBatchCreate
  onStatusChange, // Renamed from handlePostingStatusChange
  onSendReminder, // Renamed from handleSendReminder
  onEdit,         // Renamed from handleEditPosting -> opens dialog
  onDelete,       // Renamed from handleDeletePosting -> opens delete confirm
  onAddNewGame,   // Function to open the dialog in 'add' mode
  loadingApf,      // General loading state for posting actions
  currentUser, // Added prop
  tournamentCreatorId, // Added prop
}) => {

  const { t } = useTranslation();

  // Determine if the current user is an organizer or admin for this tournament
  const isOrganizerOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser._id === tournamentCreatorId);

  return (
    <Box>
      {/* Header and Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('postingTab.title', 'APF Game Management')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isOrganizerOrAdmin && (
            <FormControlLabel
              control={
                <Switch
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                  color="primary"
                  disabled={loadingApf}
                />
              }
              label={t('postingTab.batchModeLabel', 'Batch Creation Mode')}
            />
          )}
          {/* Button to open dialog might be redundant if card is always visible */}
          {/* Consider if the card should be inside the dialog instead */}
          {/* <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddNewGame} // Opens the dialog
            disabled={loadingApf}
          >
            Create New Game
          </Button> */}
        </Box>
      </Box>

      {/* Enhanced ApfPostingCard for creating/editing (might be inside dialog later) */}
      {/* For now, assume it's used for direct creation/batch */}
      {/* Enhanced ApfPostingCard only shown to organizers/admins */}
      {isOrganizerOrAdmin && (
        <Box sx={{ mb: 4 }}>
          <EnhancedApfPostingCard
            teams={teams}
            judges={judges}
            currentCardData={currentApfGameData}
            onInputChange={onInputChange}
            onConfirm={onConfirm} // Use for single game creation via card
            onBatchCreate={onBatchCreate} // Use for batch creation via card
            batchMode={batchMode}
            isLoading={loadingApf} // Pass loading state
          />
        </Box>
      )}

      <Divider sx={{ my: 4 }} />

      {/* List of Posted Games */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('postingTab.postedGamesTitle', 'Posted APF Games ({{count}})', { count: apfPostings.length })}
      </Typography>

      <ApfPostingList
        postings={apfPostings}
        isLoading={loadingPostings} // Use specific loading state for list
        // Only pass action handlers if user is organizer/admin
        onStatusChange={isOrganizerOrAdmin ? onStatusChange : undefined}
        onSendReminder={isOrganizerOrAdmin ? onSendReminder : undefined}
        onEdit={isOrganizerOrAdmin ? onEdit : undefined}
        onDelete={isOrganizerOrAdmin ? onDelete : undefined}
      />

      {/* Theme Management Section */}
      <Divider sx={{ my: 4 }} />
      {/* <ThemeManager /> - Removed, component not found */}

      {/*
        Dialogs (ApfGameDialog for editing/adding, DeleteConfirmationDialog)
        will be rendered in the main TournamentManagement component.
      */}
    </Box>
  );
};

export default PostingTab;