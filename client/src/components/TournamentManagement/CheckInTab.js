import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { api } from '../../config/api';

// TabPanel component for the inner tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`check-in-tabpanel-${index}`}
      aria-labelledby={`check-in-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CheckInTab = ({ tournamentId, currentUser }) => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkInData, setCheckInData] = useState({ teams: [], judges: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch check-in data
  const fetchCheckInData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.client.get(`/api/debates/${tournamentId}/check-in`);
      setCheckInData(response.data.data);
    } catch (err) {
      console.error('Error fetching check-in data:', err);
      setError(err.response?.data?.message || t('checkInTab.errors.loadFailed', 'Failed to load check-in data'));
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCheckInData();
  }, [tournamentId]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCheckInData();
    setRefreshing(false);
  };

  // Handle team check-in
  const handleTeamCheckIn = async (teamId) => {
    try {
      await api.client.post(`/api/debates/${tournamentId}/check-in/teams/${teamId}/check-in`);
      // Update local state
      setCheckInData(prev => ({
        ...prev,
        teams: prev.teams.map(team => 
          team.id === teamId 
            ? { ...team, isPresent: true, checkedInAt: new Date().toISOString() } 
            : team
        )
      }));
    } catch (err) {
      console.error('Error checking in team:', err);
      setError(err.response?.data?.message || t('checkInTab.errors.checkInTeamFailed', 'Failed to check in team'));
    }
  };

  // Handle team check-out
  const handleTeamCheckOut = async (teamId) => {
    try {
      await api.client.post(`/api/debates/${tournamentId}/check-in/teams/${teamId}/check-out`);
      // Update local state
      setCheckInData(prev => ({
        ...prev,
        teams: prev.teams.map(team => 
          team.id === teamId 
            ? { ...team, isPresent: false, checkedInAt: null } 
            : team
        )
      }));
    } catch (err) {
      console.error('Error checking out team:', err);
      setError(err.response?.data?.message || t('checkInTab.errors.checkOutTeamFailed', 'Failed to check out team'));
    }
  };

  // Handle judge check-in
  const handleJudgeCheckIn = async (judgeId) => {
    try {
      await api.client.post(`/api/debates/${tournamentId}/check-in/judges/${judgeId}/check-in`);
      // Update local state
      setCheckInData(prev => ({
        ...prev,
        judges: prev.judges.map(judge => 
          judge.id === judgeId 
            ? { ...judge, isPresent: true, checkedInAt: new Date().toISOString() } 
            : judge
        )
      }));
    } catch (err) {
      console.error('Error checking in judge:', err);
      setError(err.response?.data?.message || t('checkInTab.errors.checkInJudgeFailed', 'Failed to check in judge'));
    }
  };

  // Handle judge check-out
  const handleJudgeCheckOut = async (judgeId) => {
    try {
      await api.client.post(`/api/debates/${tournamentId}/check-in/judges/${judgeId}/check-out`);
      // Update local state
      setCheckInData(prev => ({
        ...prev,
        judges: prev.judges.map(judge => 
          judge.id === judgeId 
            ? { ...judge, isPresent: false, checkedInAt: null } 
            : judge
        )
      }));
    } catch (err) {
      console.error('Error checking out judge:', err);
      setError(err.response?.data?.message || t('checkInTab.errors.checkOutJudgeFailed', 'Failed to check out judge'));
    }
  };

  // Filter teams based on search term
  const filteredTeams = checkInData.teams.filter(team => {
    const nameMatch = team.name.toLowerCase().includes(searchTerm);
    const membersMatch = team.members?.some(member => 
      member.name.toLowerCase().includes(searchTerm)
    ) || false;
    const clubMatch = (team.club || '').toLowerCase().includes(searchTerm);
    const cityMatch = (team.city || '').toLowerCase().includes(searchTerm);
    const institutionMatch = (team.institution || '').toLowerCase().includes(searchTerm);
    
    return nameMatch || membersMatch || clubMatch || cityMatch || institutionMatch;
  });

  // Filter judges based on search term
  const filteredJudges = checkInData.judges.filter(judge => {
    const nameMatch = judge.name.toLowerCase().includes(searchTerm);
    const clubMatch = (judge.club || '').toLowerCase().includes(searchTerm);
    const statusMatch = (judge.judgeStatus || '').toLowerCase().includes(searchTerm);
    
    return nameMatch || clubMatch || statusMatch;
  });

  // Calculate statistics
  const teamStats = {
    total: checkInData.teams.length,
    present: checkInData.teams.filter(team => team.isPresent).length
  };

  const judgeStats = {
    total: checkInData.judges.length,
    present: checkInData.judges.filter(judge => judge.isPresent).length
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('checkInTab.title', 'Tournament Check-In')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={t('checkInTab.searchPlaceholder', 'Search...')}
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? t('checkInTab.refreshing', 'Refreshing...') : t('checkInTab.refresh', 'Refresh')}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label={t('checkInTab.teamsTab', `Teams ({{present}}/{{total}})`, { present: teamStats.present, total: teamStats.total })} />
          <Tab label={t('checkInTab.judgesTab', `Judges ({{present}}/{{total}})`, { present: judgeStats.present, total: judgeStats.total })} />
        </Tabs>

        {/* Teams Tab */}
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('checkInTab.teamName', 'Team Name')}</TableCell>
                    <TableCell>{t('checkInTab.members', 'Members')}</TableCell>
                    <TableCell>{t('checkInTab.club', 'Club')}</TableCell>
                    <TableCell>{t('checkInTab.city', 'City')}</TableCell>
                    <TableCell>{t('checkInTab.institution', 'Institution')}</TableCell>
                    <TableCell>{t('checkInTab.status', 'Status')}</TableCell>
                    <TableCell>{t('checkInTab.checkedInAt', 'Checked In At')}</TableCell>
                    <TableCell align="right">{t('checkInTab.actions', 'Actions')}</TableCell>
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
                        ) : t('common.notApplicable', 'N/A')}
                      </TableCell>
                      <TableCell>{team.club || t('common.notApplicable', 'N/A')}</TableCell>
                      <TableCell>{team.city || t('common.notApplicable', 'N/A')}</TableCell>
                      <TableCell>{team.institution || t('common.notApplicable', 'N/A')}</TableCell>
                      <TableCell>
                        {team.isPresent ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label={t('checkInTab.present', 'Present')}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<CancelIcon />}
                            label={t('checkInTab.absent', 'Absent')}
                            color="error"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {team.checkedInAt ? new Date(team.checkedInAt).toLocaleString() : t('common.notApplicable', 'N/A')}
                      </TableCell>
                      <TableCell align="right">
                        {team.isPresent ? (
                          <IconButton
                            color="error"
                            onClick={() => handleTeamCheckOut(team.id)}
                            title={t('checkInTab.markAbsent', 'Mark as Absent')}
                          >
                            <CancelIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            color="success"
                            onClick={() => handleTeamCheckIn(team.id)}
                            title={t('checkInTab.markPresent', 'Mark as Present')}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTeams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        {checkInData.teams.length > 0
                          ? t('checkInTab.noTeamsMatch', 'No teams match search')
                          : t('checkInTab.noTeams', 'No teams found')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Judges Tab */}
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('checkInTab.judgeName', 'Judge Name')}</TableCell>
                    <TableCell>{t('checkInTab.club', 'Club')}</TableCell>
                    <TableCell>{t('checkInTab.judgeStatus', 'Status')}</TableCell>
                    <TableCell>{t('checkInTab.presence', 'Presence')}</TableCell>
                    <TableCell>{t('checkInTab.checkedInAt', 'Checked In At')}</TableCell>
                    <TableCell align="right">{t('checkInTab.actions', 'Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredJudges.map((judge) => (
                    <TableRow key={judge.id}>
                      <TableCell>{judge.name}</TableCell>
                      <TableCell>{judge.club || t('common.notApplicable', 'N/A')}</TableCell>
                      <TableCell>{judge.judgeStatus || t('common.notApplicable', 'N/A')}</TableCell>
                      <TableCell>
                        {judge.isPresent ? (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label={t('checkInTab.present', 'Present')}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<CancelIcon />}
                            label={t('checkInTab.absent', 'Absent')}
                            color="error"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {judge.checkedInAt ? new Date(judge.checkedInAt).toLocaleString() : t('common.notApplicable', 'N/A')}
                      </TableCell>
                      <TableCell align="right">
                        {judge.isPresent ? (
                          <IconButton
                            color="error"
                            onClick={() => handleJudgeCheckOut(judge.id)}
                            title={t('checkInTab.markAbsent', 'Mark as Absent')}
                          >
                            <CancelIcon />
                          </IconButton>
                        ) : (
                          <IconButton
                            color="success"
                            onClick={() => handleJudgeCheckIn(judge.id)}
                            title={t('checkInTab.markPresent', 'Mark as Present')}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredJudges.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {checkInData.judges.length > 0
                          ? t('checkInTab.noJudgesMatch', 'No judges match search')
                          : t('checkInTab.noJudges', 'No judges found')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default CheckInTab;
