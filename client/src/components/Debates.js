import React, { useState, useEffect, useCallback, useContext } from 'react'; // Add useContext
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Divider,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { TournamentRegistrationModal } from './TournamentRegistrationModal'; // Named import for custom field registration modal
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth hook

// Update prop name from currentUser to user
const DebateCard = ({ debate, user, onJoin, onLeave }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canJoinDebate = () => {
    if (!debate) return false;
    if (debate.format === 'tournament') {
      // Use user prop
      if (user?.role === 'judge') {
        return (debate.counts?.judges || 0) < (debate.counts?.maxJudges || 8);
      }
      // Use user prop
      return (debate.counts?.debaters || 0) < (debate.counts?.maxDebaters || 32);
    }
    return debate.participants.length < (debate.maxParticipants || 6);
  };

  return (
    <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
      <CardContent>
        <Typography variant="h5" component="div" sx={{ color: 'primary.main' }}>
          {debate.title}
          {debate.format === 'tournament' && (
            <Chip 
              size="small" 
              label={t('debatesList.card.tournamentChip', 'Tournament')}
              color="secondary"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {debate.description}
        </Typography>

        {/* Status Information Block */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 2 }}>
            {t('debatesList.card.statusLabel', 'Status: {{status}}', { status: t(`debatesList.filters.status.${debate.status}`, debate.status) })}
          </Typography>

          {debate.format === 'tournament' ? (
            <>
              <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 2 }}>
                {t('debatesList.card.debatersCount', 'Debaters: {{count}}/{{max}}', { count: debate.counts?.debaters || 0, max: 32 })}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 2 }}>
                {t('debatesList.card.judgesCount', 'Judges: {{count}}/{{max}}', { count: debate.counts?.judges || 0, max: 8 })}
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 2 }}>
                {t('debatesList.card.modeLabel', 'Mode: {{mode}}', { mode: debate.mode || t('debatesList.card.defaultMode', 'Solo') })}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 2 }}>
              {t('debatesList.card.participantsCount', 'Participants: {{count}}/{{max}}', { count: debate.participants.length, max: debate.maxParticipants })}
            </Typography>
          )}

          {debate.leagueType && ( // Changed from debate.league
            <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 2 }}>
            {/* Reverted to original nested key */}
            {t('debatesList.card.leagueLabel', { league: debate.leagueType })}
            </Typography>
          )}
        </Box>
        {/* End Status Information Block */}

        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('debatesList.card.startDateLabel', 'Start Date:')} {new Date(debate.startDate).toLocaleString()}
          {debate.format === 'tournament' && debate.registrationDeadline && (
            <>
              <br />
              {t('debatesList.card.registrationDeadlineLabel', 'Registration Deadline:')} {new Date(debate.registrationDeadline).toLocaleString()}
            </>
          )}
        </Typography>
      </CardContent>

      <CardActions>
        <Button 
          size="small" 
          color="primary"
          onClick={() => navigate(debate.format === 'tournament' ? `/tournaments/${debate._id}` : `/debates/${debate._id}`)}
        >
          {t('debatesList.card.viewButton', 'View Details')}
        </Button>
        {/* Use user prop */}
        {user && (
          <>
            {/* Use user prop */}
            {debate.creator?._id === user._id ? (
              <Button
                size="small"
                color="primary"
                variant="contained"
                onClick={() => navigate(debate.format === 'tournament' ? `/tournaments/${debate._id}/manage` : `/debates/${debate._id}/manage`)} // Use correct path for tournament
              >
                {t('debatesList.card.manageButton', 'Manage')} {/* Shorten text slightly */}
              </Button>
            ) : debate.participants.some(p => {
                  // Check if p.userId is populated (object with _id) or just an ID string
                  const participantUserId = (typeof p.userId === 'object' && p.userId !== null) ? p.userId._id : p.userId;
                  // Use user prop
                  return user && participantUserId && user._id && participantUserId.toString() === user._id.toString();
                }) ? ( // Flexible check
              <Button
                size="small"
                color="secondary"
                variant="contained"
                onClick={() => onLeave(debate._id)}
                 // Use user prop
                disabled={debate.format === 'tournament' && user.role === 'judge' && debate.creator._id === user._id}
              >
                 {/* Use user prop */}
                {debate.format === 'tournament' && user.role === 'judge' && debate.creator._id === user._id
                  ? t('debatesList.card.cannotLeaveOwnTournamentButton', 'Cannot Leave Own Tournament')
                  : t('debatesList.card.leaveButton', 'Leave Debate')}
              </Button>
            ) : (
              <Button 
                size="small" 
                color="primary" 
                variant="contained"
                onClick={() => onJoin(debate)}
                disabled={!canJoinDebate()}
              >
                {!canJoinDebate()
                  ? (debate.format === 'tournament'
                       // Use user prop
                      ? (user.role === 'judge' ? t('debatesList.card.judgesFullButton', 'Judges Full') : t('debatesList.card.debatersFullButton', 'Debaters Full'))
                      : t('debatesList.card.fullButton', 'Full'))
                  : debate.format === 'tournament'
                     // Use user prop
                    ? (user.role === 'judge' ? t('debatesList.card.joinAsJudgeButton', 'Join as Judge') : t('debatesList.card.joinAsDebaterButton', 'Join as Debater'))
                    : t('debatesList.card.joinButton', 'Join Debate')}
              </Button>
            )}
          </>
        )}
      </CardActions>
    </Card>
  );
};

const Debates = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categories: new Set(),
    status: new Set(),
    difficulty: new Set(),
  });
  // const [currentUser, setCurrentUser] = useState(null); // Remove currentUser state
  const { user } = useAuth(); // Get user from useAuth hook
  const [isRegModalOpen, setIsRegModalOpen] = useState(false); // controls registration modal for custom fields
  const [selectedTournamentId, setSelectedTournamentId] = useState(null); // for custom field modal
  const [showDebaterRegForm, setShowDebaterRegForm] = useState(false); // New state for debater form
  const [selectedDebateForReg, setSelectedDebateForReg] = useState(null); // New state for debater form context

  const fetchDebates = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (sortBy) {
        queryParams.append('sortBy', sortBy);
      }

      // Handle filters
      if (filters.categories.size > 0) {
        queryParams.append('categories', Array.from(filters.categories).join(','));
      }
      if (filters.status.size > 0) {
        queryParams.append('status', Array.from(filters.status).join(','));
      }
      if (filters.difficulty.size > 0) {
        queryParams.append('difficulty', Array.from(filters.difficulty).join(','));
      }

      const response = await fetch(`${api.baseUrl}/api/debates?${queryParams}`);
      if (!response.ok) {
        throw new Error(t('debatesList.fetchError', 'Failed to fetch debates'));
      }
      const data = await response.json();
      setDebates(data);
    } catch (error) {
      console.error('Error fetching debates:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, filters, t]);

  // Remove getCurrentUser function - user comes from context now
  // const getCurrentUser = async () => { ... };

  // Remove useEffect for getCurrentUser
  // useEffect(() => {
  //   getCurrentUser();
  // }, []);

  useEffect(() => {
    fetchDebates();
  }, [fetchDebates]);

  const handleFilterChange = (section, item) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const newSet = new Set(prev[section]);
      
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      
      newFilters[section] = newSet;
      return newFilters;
    });
  };

  // Modified handleJoinDebate
  const handleJoinDebate = async (debate) => {
    const token = localStorage.getItem('token');
    if (!token || !user) { // Also check if user context is loaded
      navigate('/login');
      return;
    }

    // --- Add Check for valid debate._id ---
    if (!debate || !debate._id) {
      console.error('handleJoinDebate called with invalid debate object:', debate);
      alert(t('debatesList.joinErrorInvalid', 'Cannot join debate: Invalid debate data.'));
      return;
    }
    // --- End Check ---

    // --- New Logic: Check if user is a debater joining a tournament ---
    if (debate.format === 'tournament' && user.role === 'debater') {
      // Trigger the debater-specific registration form/modal
      setSelectedDebateForReg(debate); // Store the whole debate object if needed, or just id
      setShowDebaterRegForm(true);
      console.log(`Debater ${user.username} attempting to join tournament ${debate.title}. Showing debater registration form.`);
      // --- End New Logic ---
    } else if (debate.format === 'tournament' && debate.customRegistrationFields) {
      // Existing logic: If tournament has custom fields (and user is not a debater or role check failed), open standard modal
      setSelectedTournamentId(debate._id);
      setIsRegModalOpen(true);
    } else {
      // Existing logic: Direct join for non-tournaments or tournaments without custom fields
      try {
        const response = await fetch(`${api.baseUrl}/api/debates/${debate._id}/join`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          fetchDebates();
        } else {
          const error = await response.json();
          alert(error.message || t('debatesList.joinError', 'Failed to join debate.'));
        }
      } catch (error) {
        console.error('Error joining debate directly:', error);
        alert(t('debatesList.joinErrorNetwork', 'Network error while joining debate.'));
      }
    }
  };

  const handleLeaveDebate = async (debateId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await fetch(`${api.baseUrl}/api/debates/${debateId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        fetchDebates();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error('Error leaving debate:', error);
    }
  };

  const filterOptions = {
    categories: ['politics', 'technology', 'science', 'society', 'economics'],
    status: ['upcoming', 'ongoing', 'completed'],
    difficulty: ['beginner', 'intermediate', 'advanced']
  };

  const FilterSection = ({ title, items, section }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
        {t(title)}
      </Typography>
      <FormGroup>
        {items.map((item) => (
          <FormControlLabel
            key={item}
            control={
              <Checkbox
                checked={filters[section].has(item)}
                onChange={() => handleFilterChange(section, item)}
                sx={{ color: 'primary.main' }}
              />
            }
            label={t(`debatesList.filters.${section}.${item}`, item.charAt(0).toUpperCase() + item.slice(1))}
          />
        ))}
      </FormGroup>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Filters Sidebar */}
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
              {t('debatesList.filters.mainTitle', 'Filters')}
            </Typography>
            <FilterSection
              title="debatesList.filters.categoriesTitle" // Pass key instead of text
              items={filterOptions.categories}
              section="categories"
            />
            <Divider sx={{ my: 2 }} />
            <FilterSection
              title="debatesList.filters.statusTitle" // Pass key instead of text
              items={filterOptions.status}
              section="status"
            />
            <Divider sx={{ my: 2 }} />
            <FilterSection
              title="debatesList.filters.difficultyTitle" // Pass key instead of text
              items={filterOptions.difficulty}
              section="difficulty"
            />
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('debatesList.searchPlaceholder', 'Search debates...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />

          {/* Sort Options */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>{t('debatesList.sort.label', 'Sort By')}</InputLabel>
              <Select
                value={sortBy}
                label={t('debatesList.sort.label', 'Sort By')}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="recent">{t('debatesList.sort.options.recent', 'Most Recent')}</MenuItem>
                <MenuItem value="popular">{t('debatesList.sort.options.popular', 'Most Popular')}</MenuItem>
                <MenuItem value="upcoming">{t('debatesList.sort.options.upcoming', 'Upcoming First')}</MenuItem>
                <MenuItem value="difficulty">{t('debatesList.sort.options.difficulty', 'Difficulty Level')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Active Filters Display */}
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {Object.entries(filters).map(([section, valueSet]) => 
              Array.from(valueSet).map(value => (
                <Chip
                  key={`${section}-${value}`}
                  label={t(`debatesList.filters.${section}.${value}`, value.charAt(0).toUpperCase() + value.slice(1))}
                  onDelete={() => handleFilterChange(section, value)}
                  color="primary"
                  variant="outlined"
                  sx={{ m: 0.5 }}
                />
              ))
            )}
          </Box>

          {/* Debates List */}
          <Grid container spacing={3}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 4 }}>
                <Typography component="div">{t('debatesList.loading', 'Loading debates...')}</Typography>
              </Box>
            ) : debates.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 4 }}>
                <Typography component="div">{t('debatesList.noDebatesFound', 'No debates found matching your criteria')}</Typography>
              </Box>
            ) : (
              debates.map((debate) => (
                <Grid item xs={12} key={debate._id}>
                  <DebateCard 
                    debate={debate}
                    user={user} // Pass user from context
                    onJoin={handleJoinDebate}
                    onLeave={handleLeaveDebate}
                  />
                </Grid>
              ))
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Registration modal for custom fields */}
      <TournamentRegistrationModal
        open={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        tournamentId={selectedTournamentId}
        onSuccess={() => {
          fetchDebates();
          setIsRegModalOpen(false);
        }}
      />

      {/* Placeholder for Debater Registration Form/Modal */}
      {showDebaterRegForm && selectedDebateForReg && (
        <Paper elevation={3} sx={{ p: 3, mt: 3, backgroundColor: 'rgba(200, 255, 200, 0.9)' }}>
          <Typography variant="h6">Debater Registration Form Placeholder</Typography>
          <Typography>Registering for: {selectedDebateForReg.title}</Typography>
          <Typography>User Role: {user?.role}</Typography>
          {/* Add actual form fields here later */}
          <Button onClick={() => setShowDebaterRegForm(false)} sx={{ mt: 2 }}>Close Placeholder</Button>
        </Paper>
      )}
    </Container>
  );
};

export default Debates;
