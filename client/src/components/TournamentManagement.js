import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';

// Import Hooks
import { useTournamentData } from '../hooks/useTournamentData';
import { useTournamentUIManager } from '../hooks/useTournamentUIManager';
import { useEntrantManagement } from '../hooks/useEntrantManagement';
import { useTeamManagement } from '../hooks/useTeamManagement';
import { useJudgeManagement } from '../hooks/useJudgeManagement';
import { useApfPostingManagement } from '../hooks/useApfPostingManagement';

// Import Tab Components
import EntrantsTab from './TournamentManagement/EntrantsTab';
import TeamsTab from './TournamentManagement/TeamsTab';
import JudgesTab from './TournamentManagement/JudgesTab';
import PostingTab from './TournamentManagement/PostingTab';
import StandingsTab from './TournamentManagement/StandingsTab';
import BracketTab from './TournamentManagement/BracketTab';

// Import Dialog Components
import DeleteConfirmationDialog from './TournamentManagement/DeleteConfirmationDialog';
import EntrantDialog from './TournamentManagement/EntrantDialog';
import TeamDialog from './TournamentManagement/TeamDialog';
import JudgeDialog from './TournamentManagement/JudgeDialog';
import ApfGameDialog from './TournamentManagement/ApfGameDialog';

// Helper TabPanel component (can be moved to a shared location if used elsewhere)
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tournament-tabpanel-${index}`}
      aria-labelledby={`tournament-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentManagement = () => {
  const navigate = useNavigate(); // Keep navigate if needed for other actions

  // --- Initialize Hooks ---
  const uiManager = useTournamentUIManager();
  const dataManager = useTournamentData(); // Fetches core data

  // Pass necessary state/setters/handlers from dataManager and uiManager to management hooks
  const entrantManager = useEntrantManagement(
    dataManager.entrants,
    dataManager.setEntrants, // Pass setter for local updates
    uiManager.showNotification
  );
  const teamManager = useTeamManagement(
    dataManager.tournamentId,
    dataManager.teams,
    dataManager.setTeams, // Pass setter (though API refresh is preferred)
    dataManager.entrants, // Needed for dialog
    uiManager.showNotification,
    dataManager.refreshData // Pass refresh function
  );
  const judgeManager = useJudgeManagement(
    dataManager.judges,
    dataManager.setJudges, // Pass setter for local updates
    uiManager.showNotification
  );
  const apfManager = useApfPostingManagement(
    dataManager.tournamentId,
    dataManager.teams, // Needed for dialog/card
    dataManager.judges, // Needed for dialog/card
    uiManager.showNotification,
    dataManager.refreshPostings // Pass specific refresh function
  );

  // --- Loading and Error States ---
  if (dataManager.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (dataManager.error || !dataManager.tournament) {
    return (
      <Container>
        <Alert severity="error">{dataManager.error || 'Tournament not found'}</Alert>
      </Container>
    );
  }

  // --- Render Component ---
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 3 }}>
        Tournament: {dataManager.tournament.title}
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={uiManager.tabValue} onChange={uiManager.handleTabChange} aria-label="tournament management tabs">
          <Tab label="Entrants" />
          <Tab label="Teams" />
          <Tab label="Judges" />
          <Tab label="Posting" />
          <Tab label="Standings" />
          <Tab label="Bracket" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={uiManager.tabValue} index={0}>
        <EntrantsTab
          entrants={dataManager.entrants}
          onAddEntrant={() => entrantManager.handleOpenEntrantDialog(false)}
          onEditEntrant={(entrant) => entrantManager.handleOpenEntrantDialog(true, entrant)}
          onDeleteEntrant={entrantManager.handleDeleteEntrant}
          onGenerateTestData={async () => {
            try {
              await dataManager.generateTestData();
              uiManager.showNotification('Test data generated successfully', 'success');
            } catch (error) {
              uiManager.showNotification(error.message || 'Failed to generate test data', 'error');
            }
          }}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={1}>
        <TeamsTab
          teams={dataManager.teams}
          onAddTeam={() => teamManager.handleOpenTeamDialog(false)}
          onEditTeam={(team) => teamManager.handleOpenTeamDialog(true, team)}
          onDeleteTeam={teamManager.handleDeleteTeam}
          onRandomizeTeams={teamManager.randomizeTeams}
          loadingTeams={teamManager.loadingTeams}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={2}>
        <JudgesTab
          judges={dataManager.judges}
          onAddJudge={() => judgeManager.handleOpenJudgeDialog(false)}
          onEditJudge={(judge) => judgeManager.handleOpenJudgeDialog(true, judge)}
          onDeleteJudge={judgeManager.handleDeleteJudge}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={3}>
        <PostingTab
          teams={dataManager.teams}
          judges={dataManager.judges}
          apfPostings={dataManager.postings}
          loadingPostings={dataManager.loading} // Use main loading or add specific one
          currentApfGameData={apfManager.currentApfGameData}
          batchMode={apfManager.batchMode}
          setBatchMode={apfManager.setBatchMode}
          onInputChange={apfManager.handleApfCardChange}
          onConfirm={apfManager.handleConfirmApfGame}
          onBatchCreate={apfManager.handleBatchCreate}
          onStatusChange={apfManager.handlePostingStatusChange}
          onSendReminder={apfManager.handleSendReminder}
          onEdit={(posting) => apfManager.handleOpenApfDialog(true, posting)} // Open dialog in edit mode
          onDelete={apfManager.handleDeletePosting} // Trigger delete confirmation
          onAddNewGame={() => apfManager.handleOpenApfDialog(false)} // Open dialog in add mode
          loadingApf={apfManager.loadingApf}
        />
      </TabPanel>
       <TabPanel value={uiManager.tabValue} index={4}>
        <StandingsTab
          teams={dataManager.teams} // Pass teams potentially updated by standings fetch
          onRefreshStandings={dataManager.refreshStandings}
          loading={dataManager.loading} // Use main loading or add specific one
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={5}>
        <BracketTab
          tournamentRounds={dataManager.tournament?.tournamentRounds || []}
          loading={dataManager.loading}
          onInitializeBracket={async () => {
            try {
              // This function should be added to dataManager
              await dataManager.initializeBracket();
              uiManager.showNotification('Tournament bracket initialized successfully', 'success');
            } catch (error) {
              uiManager.showNotification(error.message || 'Failed to initialize bracket', 'error');
            }
          }}
          initializing={dataManager.initializingBracket}
        />
      </TabPanel>

      {/* --- Render Dialogs --- */}
      {/* Entrant Dialogs */}
      <EntrantDialog
        open={entrantManager.openEntrantDialog}
        onClose={entrantManager.handleCloseEntrantDialog}
        onSubmit={entrantManager.handleSubmitEntrant}
        isEditing={entrantManager.isEditingEntrant}
        entrantForm={entrantManager.entrantForm}
        onFormChange={entrantManager.handleEntrantFormChange}
        // loading={entrantManager.loading} // Add loading state to hook if needed
      />
      <DeleteConfirmationDialog
        open={entrantManager.openDeleteDialog}
        onClose={entrantManager.handleCloseDeleteDialog}
        onConfirm={entrantManager.confirmDeleteEntrant}
        itemName="entrant"
        // loading={entrantManager.loading}
      />

      {/* Team Dialogs */}
      <TeamDialog
        open={teamManager.openTeamDialog}
        onClose={teamManager.handleCloseTeamDialog}
        onSubmit={teamManager.handleSubmitTeam}
        isEditing={teamManager.isEditingTeam}
        teamForm={teamManager.teamForm}
        onFormChange={teamManager.handleTeamFormChange}
        entrants={dataManager.entrants} // Pass entrants for dropdown
        loading={teamManager.loadingTeams}
      />
       <DeleteConfirmationDialog
        open={teamManager.openDeleteDialog}
        onClose={teamManager.handleCloseDeleteDialog}
        onConfirm={teamManager.confirmDeleteTeam}
        itemName="team"
        loading={teamManager.loadingTeams}
      />

      {/* Judge Dialogs */}
      <JudgeDialog
        open={judgeManager.openJudgeDialog}
        onClose={judgeManager.handleCloseJudgeDialog}
        onSubmit={judgeManager.handleSubmitJudge}
        isEditing={judgeManager.isEditingJudge}
        judgeForm={judgeManager.judgeForm}
        onFormChange={judgeManager.handleJudgeFormChange}
        // loading={judgeManager.loading}
      />
       <DeleteConfirmationDialog
        open={judgeManager.openDeleteDialog}
        onClose={judgeManager.handleCloseDeleteDialog}
        onConfirm={judgeManager.confirmDeleteJudge}
        itemName="judge"
        // loading={judgeManager.loading}
      />

      {/* APF Posting Dialogs */}
      <ApfGameDialog
        open={apfManager.openApfDialog}
        onClose={apfManager.handleCloseApfDialog}
        onSubmit={apfManager.handleConfirmApfGame}
        isEditing={apfManager.isEditingApf}
        gameData={apfManager.currentApfGameData}
        onFormChange={apfManager.handleApfCardChange}
        teams={dataManager.teams}
        judges={dataManager.judges}
        loading={apfManager.loadingApf}
      />
       <DeleteConfirmationDialog
        open={apfManager.openDeletePostingDialog}
        onClose={apfManager.handleCloseDeletePostingDialog}
        onConfirm={apfManager.confirmDeletePosting}
        itemName="posting"
        loading={apfManager.loadingApf}
      />

      {/* --- Notification Snackbar --- */}
      <Snackbar
        open={uiManager.notification.open}
        autoHideDuration={6000}
        onClose={uiManager.closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Optional: Position
      >
        <Alert
          onClose={uiManager.closeNotification}
          severity={uiManager.notification.severity}
          sx={{ width: '100%' }} // Make alert fill snackbar
        >
          {uiManager.notification.message}
        </Alert>
      </Snackbar>

    </Container>
  );
};

export default TournamentManagement;