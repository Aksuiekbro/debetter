import React, { useState } from 'react'; // Import useState
import { useTranslation } from 'react-i18next'; // Import useTranslation
// import { useNavigate } from 'react-router-dom'; // Commented out as it's not currently used
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
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { useTournamentData } from '../hooks/useTournamentData';
import { useTournamentUIManager } from '../hooks/useTournamentUIManager';
// Removed useEntrantManagement import
// Removed useEntrantCheckIn import
import { useTeamManagement } from '../hooks/useTeamManagement';
import { useJudgeManagement } from '../hooks/useJudgeManagement';
import { useApfPostingManagement } from '../hooks/useApfPostingManagement';
// Import Tab Components
// Removed EntrantsTab import
import TeamsTab from './TournamentManagement/TeamsTab';
import JudgesTab from './TournamentManagement/JudgesTab';
import PostingTab from './TournamentManagement/PostingTab';
import TournamentPostingTab from './TournamentManagement/TournamentPostingTab'; // Import new tournament posting tab
import StandingsTab from './TournamentManagement/StandingsTab';
// import BracketTab from './TournamentManagement/BracketTab'; // Commented out
import AnnouncementsTab from './TournamentManagement/AnnouncementsTab'; // Added import
import CustomRegistrationFields from './TournamentManagement/CustomRegistrationFields'; // Import custom fields component
import CheckInTab from './TournamentManagement/CheckInTab'; // Import check-in component
import ResultsTab from './TournamentManagement/ResultsTab'; // Import results component
import MatchPostingsTab from './TournamentManagement/MatchPostingsTab'; // Import match postings component
import OrganizerManagementTab from './TournamentManagement/OrganizerManagementTab'; // Placeholder for the new tab component

// Import Dialog Components
import DeleteConfirmationDialog from './TournamentManagement/DeleteConfirmationDialog';
// Removed EntrantDialog import
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
  // const navigate = useNavigate(); // Commented out as it's not currently used
  const { t } = useTranslation(); // Initialize useTranslation

  // --- Initialize Hooks ---
  const { user: currentUser, loading: authLoading } = useAuth(); // Get current user AND loading state
  console.log('[TournamentManagement] useAuth() hook result - currentUser:', currentUser ? `ID: ${currentUser._id}` : 'null/undefined', 'authLoading:', authLoading); // Log context values immediately

  // Add a useEffect to log changes to currentUser and authLoading
  React.useEffect(() => {
    console.log('[TournamentManagement] useEffect detected change - currentUser:', currentUser ? `ID: ${currentUser._id}` : 'null/undefined', 'authLoading:', authLoading);
  }, [currentUser, authLoading]);

  const uiManager = useTournamentUIManager();
  const dataManager = useTournamentData(); // Fetches core data
  const [selectedOrganizers, setSelectedOrganizers] = useState([]); // State for the organizer management UI (will be populated later)

  // Pass necessary state/setters/handlers from dataManager and uiManager to management hooks
  // Removed entrantManager initialization
  const teamManager = useTeamManagement(
    dataManager.tournamentId,
    dataManager.teams,
    dataManager.setTeams, // Pass setter (though API refresh is preferred)
    dataManager.entrants, // Needed for dialog - KEEPING THIS FOR NOW, might be needed by TeamDialog
    uiManager.showNotification,
    dataManager.refreshData // Pass refresh function
  );
  const judgeManager = useJudgeManagement(
    dataManager.judges,
    dataManager.setJudges, // Pass setter for local updates
    uiManager.showNotification,
    dataManager.refreshData // Pass refresh function
  );
  const apfManager = useApfPostingManagement(
    dataManager.tournamentId,
    dataManager.teams, // Needed for dialog/card
    dataManager.judges, // Needed for dialog/card
    uiManager.showNotification,
    dataManager.refreshPostings // Pass specific refresh function
  );

  // Removed entrantCheckIn initialization

  // --- Loading and Error States ---
  // Combine loading checks
  // Ensure both authentication status (currentUser) and tournament data are loaded
  if (authLoading || dataManager.loading) {
    console.log('[TournamentManagement] Showing loading spinner (authLoading || dataManager.loading)');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check ONLY for data loading error AFTER loading is complete
  if (dataManager.error) {
    console.log('[TournamentManagement] Showing dataManager error alert');
    return (
      <Container>
        <Alert severity="error">{dataManager.error || 'Failed to load tournament data.'}</Alert>
      </Container>
    );
  }

  // **** ADDED CHECK: Explicitly check for currentUser AFTER loading is done ****
  if (!currentUser) {
    // Corrected console.log statement
    console.log("[TournamentManagement] Showing 'Not Logged In' alert because currentUser is missing after loading.");
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">{t('errors.mustBeLoggedIn', 'You must be logged in to manage a tournament.')}</Alert>
      </Container>
    );
  }

  // If loading is finished, no data error, AND currentUser exists, proceed to render.
  console.log('[TournamentManagement] Proceeding to render main content, currentUser exists:', !!currentUser);

  // --- Extract Creator ID ---
  const tournamentCreatorId = dataManager.tournament?.creator?._id; // Get creator ID safely

// --- Determine User Role ---
  const isOrganizer = currentUser && dataManager.tournament && (
    currentUser._id === tournamentCreatorId ||
    dataManager.tournament.organizers?.some(org => org._id === currentUser._id)
  );
  // --- Render Component ---
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('tournamentManagement.title', 'Tournament: {{name}}', { name: dataManager.tournament.title })}
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={uiManager.tabValue}
          onChange={uiManager.handleTabChange}
          aria-label="tournament management tabs"
          variant="scrollable" // Ensure tabs can scroll if needed
          scrollButtons="auto" // Show scroll buttons automatically
        >
          <Tab label={t('tournamentManagement.tabs.announcements', 'Announcements')} /> {/* Index 0 */}
          {/* Removed Entrants Tab */}
          <Tab label={t('tournamentManagement.tabs.teams', 'Teams')} /> {/* Now Index 1 */}
          <Tab label={t('tournamentManagement.tabs.judges', 'Judges')} /> {/* Now Index 2 */}
          <Tab label={t('tournamentManagement.tabs.posting', 'Posting')} /> {/* Now Index 3 */}
          <Tab label={t('tournamentManagement.tabs.tournamentPosting', 'Tournament Posting')} /> {/* Now Index 4 */}
          <Tab label={t('tournamentManagement.tabs.matchPostings', 'Match Postings')} /> {/* Now Index 5 */}
          <Tab label={t('tournamentManagement.tabs.standings', 'Standings')} /> {/* Now Index 6 */}
          <Tab label={t('tournamentManagement.tabs.results', 'Results')} /> {/* Now Index 7 */}
          {/* <Tab label={t('tournamentManagement.tabs.bracket', 'Bracket')} /> */}{/* Index 8 - Commented out */}
          <Tab label={t('tournamentManagement.tabs.checkIn', 'Check-In')} /> {/* Now Index 8 (was 9) */}
          <Tab label={t('tournamentManagement.tabs.organizers', 'Organizers')} /> {/* Now Index 9 (was 10) */}
          <Tab label={t('tournamentManagement.tabs.customFields', 'Custom Fields')} /> {/* Now Index 10 (was 11) */}
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={uiManager.tabValue} index={0}> {/* Announcements Panel */}
        <AnnouncementsTab currentUser={currentUser} tournamentCreatorId={tournamentCreatorId} tournament={dataManager.tournament} />
      </TabPanel>
      {/* Removed EntrantsTab Panel */}
      <TabPanel value={uiManager.tabValue} index={1}> {/* Teams Panel - Index updated */}
        <TeamsTab
          teams={dataManager.teams}
          onAddTeam={() => teamManager.handleOpenTeamDialog(false)}
          onEditTeam={(team) => teamManager.handleOpenTeamDialog(true, team)}
          onDeleteTeam={teamManager.handleDeleteTeam}
          onRandomizeTeams={teamManager.randomizeTeams}
          // Add check-in/out props from TeamsTab component definition
          onCheckInTeam={teamManager.checkInTeam} // Assuming checkInTeam exists in teamManager
          onCheckOutTeam={teamManager.checkOutTeam} // Assuming checkOutTeam exists in teamManager
          loadingTeams={teamManager.loadingTeams}
          currentUser={currentUser}
          tournamentCreatorId={tournamentCreatorId}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={2}> {/* Judges Panel - Index updated */}
        <JudgesTab
          judges={dataManager.judges}
          onAddJudge={() => judgeManager.handleOpenJudgeDialog(false)}
          onEditJudge={(judge) => judgeManager.handleOpenJudgeDialog(true, judge)}
          onDeleteJudge={judgeManager.handleDeleteJudge}
          // Add check-in/out props from JudgesTab component definition
          onCheckInJudge={judgeManager.checkInJudge} // Assuming checkInJudge exists in judgeManager
          onCheckOutJudge={judgeManager.checkOutJudge} // Assuming checkOutJudge exists in judgeManager
          currentUser={currentUser}
          tournamentCreatorId={tournamentCreatorId}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={3}> {/* Posting Panel - Index updated */}
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
          currentUser={currentUser}
          tournamentCreatorId={tournamentCreatorId}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={4}> {/* Tournament Posting Panel - Index updated */}
        <TournamentPostingTab
          currentUser={currentUser}
          tournamentCreatorId={tournamentCreatorId}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={5}> {/* Match Postings Panel - Index updated */}
        <MatchPostingsTab
          currentUser={currentUser}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={6}> {/* Standings Panel - Index updated */}
        <StandingsTab
          teams={dataManager.teams} // Pass teams potentially updated by standings fetch
          onRefreshStandings={async () => {
            await dataManager.refreshStandings();
            uiManager.showNotification('Standings refreshed successfully', 'success');
          }}
          loading={dataManager.loadingStandings} // Use the specific loading state for standings
          error={dataManager.standingsError} // Pass the specific error state for standings
          currentUser={currentUser}
          tournamentCreatorId={tournamentCreatorId}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={7}> {/* Results Panel - Index updated */}
        <ResultsTab
          currentUser={currentUser}
          tournamentId={dataManager.tournamentId}
        />
      </TabPanel>
      {/* <TabPanel value={uiManager.tabValue} index={8}> */}{/* Bracket Panel - Commented out */}
        {/* <BracketTab
          tournamentRounds={dataManager.tournament?.tournamentRounds || []}
          teams={dataManager.teams} // Pass teams data
          loading={dataManager.loading}
          onInitializeBracket={async () => {
            try {
              await dataManager.initializeBracket();
              uiManager.showNotification('Tournament bracket initialized successfully', 'success');
            } catch (error) {
              uiManager.showNotification(error.message || 'Failed to initialize bracket', 'error');
            }
          }}
          initializing={dataManager.initializingBracket}
          currentUser={currentUser}
          tournamentCreatorId={tournamentCreatorId}
        /> */}
      {/* </TabPanel> */}
      <TabPanel value={uiManager.tabValue} index={8}> {/* Check-In Panel - Index updated */}
        <CheckInTab
          tournamentId={dataManager.tournamentId}
          currentUser={currentUser}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={9}> {/* Organizer Management Panel - Index updated */}
        {/* Placeholder or actual component for Organizer Management */}
        <OrganizerManagementTab
          tournamentId={dataManager.tournamentId}
          organizers={dataManager.tournament?.organizers || []} // Pass organizers
          currentUser={currentUser}
          tournamentCreatorId={tournamentCreatorId}
          onUpdateOrganizers={dataManager.refreshData} // Assuming refreshData updates organizers
          showNotification={uiManager.showNotification}
        />
      </TabPanel>
      <TabPanel value={uiManager.tabValue} index={10}> {/* Custom Fields Panel - Index updated */}
        {/* Check if core data is loading OR if tournament data/sub-properties are missing */}
        {dataManager.loading || !dataManager.tournament || !dataManager.tournament.creator || !dataManager.tournament.organizers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            {/* Optional: Add a message like <Typography sx={{ ml: 2 }}>Loading tournament details...</Typography> */}
          </Box>
        ) : (
          // Data is ready, render the component
          <CustomRegistrationFields
             tournament={dataManager.tournament} // Pass the complete tournament object
             currentUser={currentUser} // Pass the confirmed currentUser
             // No need to pass isOrganizer or tournamentId, component handles them internally
           />
        )}
      </TabPanel>

      {/* --- Render Dialogs --- */}
      {/* Removed Entrant Dialogs */}

      {/* Team Dialogs */}
      <TeamDialog
        open={teamManager.openTeamDialog}
        onClose={teamManager.handleCloseTeamDialog}
        onSubmit={teamManager.handleSubmitTeam}
        isEditing={teamManager.isEditingTeam}
        teamForm={teamManager.teamForm}
        onFormChange={teamManager.handleTeamFormChange}
        entrants={dataManager.entrants} // Pass entrants for dropdown - KEEPING THIS FOR NOW
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
