import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, Shuffle as ShuffleIcon } from '@mui/icons-material';
import { api } from '../config/api';
import { getAuthHeaders } from '../utils/auth';
import ApfPostingCard from './ApfPostingCard';

// TabPanel component to handle tab content
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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TournamentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [entrants, setEntrants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [judges, setJudges] = useState([]);
  const [posts, setPosts] = useState([]);
  
  // Dialog states
  const [openEntrantDialog, setOpenEntrantDialog] = useState(false);
  const [openTeamDialog, setOpenTeamDialog] = useState(false);
  const [openJudgeDialog, setOpenJudgeDialog] = useState(false);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // Form states
  const [entrantForm, setEntrantForm] = useState({ name: '', email: '' });
  const [teamForm, setTeamForm] = useState({ name: '', leader: '', speaker: '' });
  const [judgeForm, setJudgeForm] = useState({ name: '', email: '', role: 'Judge' });
  const [postForm, setPostForm] = useState({ title: '', content: '' });
  const [deleteItem, setDeleteItem] = useState({ type: '', id: null });
  
  // Notification state
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // State for APF Posting Card
  const [currentApfGameData, setCurrentApfGameData] = useState({
    team1: null, // Should store the selected team object or ID
    team2: null, // Should store the selected team object or ID
    location: '',
    judges: [], // Should store array of selected judge objects or IDs
    theme: null // Can be string (freeSolo) or object (if predefined)
  });
  const [apfPostings, setApfPostings] = useState([]); // Stores successfully posted games
  // const [availableThemes, setAvailableThemes] = useState([]); // Optional: For predefined themes
  
  // Add state for standings
  const [standings, setStandings] = useState([]);
  
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const response = await fetch(`${api.baseUrl}/api/debates/${id}`, {
          headers: getAuthHeaders()
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tournament');
        }
        
        const data = await response.json();
        setTournament(data);
        
        // Extract entrants, judges, and organize into teams if necessary
        const tournamentEntrants = data.participants.filter(p => p.role !== 'judge');
        const tournamentJudges = data.participants.filter(p => p.role === 'judge');
        
        setEntrants(tournamentEntrants.map(e => ({
          id: e._id,
          name: e.username,
          email: e.email || 'N/A',
          enrollDate: new Date(e.createdAt || Date.now()).toLocaleDateString()
        })));
        
        setJudges(tournamentJudges.map(j => ({
          id: j._id,
          name: j.username,
          email: j.email || 'N/A',
          role: j.judgeRole || 'Judge'
        })));
        
        // If there are teams in the tournament data
        if (data.teams && data.teams.length > 0) {
          setTeams(data.teams.map(team => {
            // Get leader and speaker details from the populated userId field
            const leaderMember = team.members.find(m => m.role === 'leader');
            const speakerMember = team.members.find(m => m.role === 'speaker');
            
            return {
              id: team._id,
              name: team.name,
              // Access username from the populated userId object
              leader: leaderMember?.userId?.username || 'Unknown',
              speaker: speakerMember?.userId?.username || 'Unknown',
              leaderId: leaderMember?.userId?._id || leaderMember?.userId,
              speakerId: speakerMember?.userId?._id || speakerMember?.userId,
              wins: team.wins || 0,
              losses: team.losses || 0,
              points: team.points || 0
            };
          }));
        } else {
          // Build teams from participants
          const mockTeams = [];
          for (let i = 0; i < Math.floor(tournamentEntrants.length / 2); i++) {
            if (i*2+1 < tournamentEntrants.length) {
              mockTeams.push({
                id: `team-${i}`,
                name: `Team ${i+1}`,
                leader: tournamentEntrants[i*2].username,
                speaker: tournamentEntrants[i*2+1].username,
                leaderId: tournamentEntrants[i*2]._id,
                speakerId: tournamentEntrants[i*2+1]._id,
                wins: 0,
                losses: 0,
                points: 0
              });
            }
          }
          setTeams(mockTeams);
        }
        
        // Mock posts data for now
        setPosts([
          {
            id: '1',
            title: 'Tournament Schedule',
            date: new Date().toLocaleDateString(),
            content: 'The schedule for the tournament has been finalized. Please check your email for details.'
          }
        ]);
        
        // Fetch standings data
        fetchStandings();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tournament:', error);
        setNotification({
          open: true,
          message: 'Failed to load tournament data',
          severity: 'error'
        });
        setLoading(false);
      }
    };
    
    fetchTournament();
  }, [id]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle dialog open/close
  const handleOpenDialog = (type, isEdit = false, item = null) => {
    switch (type) {
      case 'entrant':
        if (isEdit && item) {
          setEntrantForm({ name: item.name, email: item.email });
          setIsEditing(true);
          setEditId(item.id);
        } else {
          setEntrantForm({ name: '', email: '' });
          setIsEditing(false);
          setEditId(null);
        }
        setOpenEntrantDialog(true);
        break;
      case 'team':
        if (isEdit && item) {
          setTeamForm({ name: item.name, leader: item.leaderId, speaker: item.speakerId });
          setIsEditing(true);
          setEditId(item.id);
        } else {
          setTeamForm({ name: '', leader: '', speaker: '' });
          setIsEditing(false);
          setEditId(null);
        }
        setOpenTeamDialog(true);
        break;
      case 'judge':
        if (isEdit && item) {
          setJudgeForm({ name: item.name, email: item.email, role: item.role });
          setIsEditing(true);
          setEditId(item.id);
        } else {
          setJudgeForm({ name: '', email: '', role: 'Judge' });
          setIsEditing(false);
          setEditId(null);
        }
        setOpenJudgeDialog(true);
        break;
      case 'post':
        if (isEdit && item) {
          setPostForm({ title: item.title, content: item.content });
          setIsEditing(true);
          setEditId(item.id);
        } else {
          setPostForm({ title: '', content: '' });
          setIsEditing(false);
          setEditId(null);
        }
        setOpenPostDialog(true);
        break;
      default:
        break;
    }
  };
  
  const handleCloseDialog = (type) => {
    switch (type) {
      case 'entrant':
        setOpenEntrantDialog(false);
        break;
      case 'team':
        setOpenTeamDialog(false);
        break;
      case 'judge':
        setOpenJudgeDialog(false);
        break;
      case 'post':
        setOpenPostDialog(false);
        break;
      case 'delete':
        setOpenDeleteDialog(false);
        break;
      default:
        break;
    }
  };
  
  // Handle form changes
  const handleEntrantFormChange = (e) => {
    setEntrantForm({ ...entrantForm, [e.target.name]: e.target.value });
  };
  
  const handleTeamFormChange = (e) => {
    setTeamForm({ ...teamForm, [e.target.name]: e.target.value });
  };
  
  const handleJudgeFormChange = (e) => {
    setJudgeForm({ ...judgeForm, [e.target.name]: e.target.value });
  };
  
  const handlePostFormChange = (e) => {
    setPostForm({ ...postForm, [e.target.name]: e.target.value });
  };

  // Handle APF Posting Card changes
  const handleApfCardChange = (fieldName, value) => {
    setCurrentApfGameData(prevData => ({
      ...prevData,
      [fieldName]: value
    }));
  };

  // Handle delete confirmation
  const handleDeleteItem = (type, id) => {
    setDeleteItem({ type, id });
    setOpenDeleteDialog(true);
  };
  
  // Handle submitting forms
  const handleSubmitEntrant = async () => {
    // Here you would normally make an API call to add/edit an entrant
    // For now, we'll just update the local state
    try {
      if (isEditing) {
        // Edit existing entrant
        setEntrants(entrants.map(e => 
          e.id === editId ? { ...e, name: entrantForm.name, email: entrantForm.email } : e
        ));
      } else {
        // Add new entrant
        const newEntrant = {
          id: `entrant-${Date.now()}`,
          name: entrantForm.name,
          email: entrantForm.email,
          enrollDate: new Date().toLocaleDateString()
        };
        setEntrants([...entrants, newEntrant]);
      }
      
      setNotification({
        open: true,
        message: isEditing ? 'Entrant updated successfully' : 'Entrant added successfully',
        severity: 'success'
      });
      
      handleCloseDialog('entrant');
    } catch (error) {
      console.error('Error submitting entrant:', error);
      setNotification({
        open: true,
        message: 'Failed to save entrant',
        severity: 'error'
      });
    }
  };
  
  const handleSubmitTeam = async () => {
    try {
      // Find the team members by ID
      const leader = entrants.find(e => e.id === teamForm.leader);
      const speaker = entrants.find(e => e.id === teamForm.speaker);
      
      if (isEditing) {
        // Edit existing team
        setTeams(teams.map(t => 
          t.id === editId ? {
            ...t,
            name: teamForm.name,
            leader: leader?.name || '',
            speaker: speaker?.name || '',
            leaderId: teamForm.leader,
            speakerId: teamForm.speaker
          } : t
        ));
      } else {
        // Add new team
        const newTeam = {
          id: `team-${Date.now()}`,
          name: teamForm.name,
          leader: leader?.name || '',
          speaker: speaker?.name || '',
          leaderId: teamForm.leader,
          speakerId: teamForm.speaker
        };
        setTeams([...teams, newTeam]);
      }
      
      setNotification({
        open: true,
        message: isEditing ? 'Team updated successfully' : 'Team added successfully',
        severity: 'success'
      });
      
      handleCloseDialog('team');
    } catch (error) {
      console.error('Error submitting team:', error);
      setNotification({
        open: true,
        message: 'Failed to save team',
        severity: 'error'
      });
    }
  };
  
  const handleSubmitJudge = async () => {
    try {
      if (isEditing) {
        // Edit existing judge
        setJudges(judges.map(j => 
          j.id === editId ? { ...j, name: judgeForm.name, email: judgeForm.email, role: judgeForm.role } : j
        ));
      } else {
        // Add new judge
        const newJudge = {
          id: `judge-${Date.now()}`,
          name: judgeForm.name,
          email: judgeForm.email,
          role: judgeForm.role
        };
        setJudges([...judges, newJudge]);
      }
      
      setNotification({
        open: true,
        message: isEditing ? 'Judge updated successfully' : 'Judge added successfully',
        severity: 'success'
      });
      
      handleCloseDialog('judge');
    } catch (error) {
      console.error('Error submitting judge:', error);
      setNotification({
        open: true,
        message: 'Failed to save judge',
        severity: 'error'
      });
    }
  };
  
  const handleSubmitPost = async () => {
    try {
      if (isEditing) {
        // Edit existing post
        setPosts(posts.map(p => 
          p.id === editId ? { ...p, title: postForm.title, content: postForm.content } : p
        ));
      } else {
        // Add new post
        const newPost = {
          id: `post-${Date.now()}`,
          title: postForm.title,
          content: postForm.content,
          date: new Date().toLocaleDateString()
        };
        setPosts([...posts, newPost]);
      }
      
      setNotification({
        open: true,
        message: isEditing ? 'Post updated successfully' : 'Post added successfully',
        severity: 'success'
      });
      
      handleCloseDialog('post');
    } catch (error) {
      console.error('Error submitting post:', error);
      setNotification({
        open: true,
        message: 'Failed to save post',
        severity: 'error'
      });
    }
  };
  

  // Handle confirming and posting a new APF game
  const handleConfirmApfGame = async () => {
    const { team1, team2, location, judges, theme } = currentApfGameData;

    // Basic Validation
    if (!team1 || !team2 || !location || judges.length === 0 || !theme) {
      setNotification({
        open: true,
        message: 'Please fill in all fields for the game posting.',
        severity: 'warning'
      });
      return;
    }
    if (team1.id === team2.id) {
      setNotification({
        open: true,
        message: 'Team 1 and Team 2 cannot be the same.',
        severity: 'warning'
      });
      return;
    }

    console.log('Attempting to post APF game:', currentApfGameData);
    console.log('Judges being sent:', judges);
    console.log('Tournament participants:', tournament.participants);
    
    // Debug: Check if judge IDs match tournament participant IDs
    const tournamentJudges = tournament.participants.filter(p => p.role === 'judge');
    console.log('Tournament judges:', tournamentJudges);
    const judgeIdsInTournament = tournamentJudges.map(j => j._id);
    console.log('Judge IDs in tournament:', judgeIdsInTournament);
    
    // Important: We no longer need to filter judges by role in the client
    // Instead, we'll send the judge IDs directly and let the server validate
    // that they are participants in the tournament regardless of their role
    const judgeIdsToSend = judges.map(judge => judge.id);
    console.log('Judge IDs being sent:', judgeIdsToSend);
    
    setLoading(true); // Indicate loading state

    try {
      // Make actual API call to save the game posting
      const response = await fetch(`${api.baseUrl}/api/debates/${id}/postings`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          team1Id: team1.id,
          team2Id: team2.id,
          location,
          judgeIds: judgeIdsToSend,
          theme: typeof theme === 'string' ? theme : theme.label, // Handle freeSolo or object
          tournamentId: id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to post game: ${errorText}`);
      }

      const postedGame = await response.json();
      console.log('API Success:', postedGame);

      // Update apfPostings state with the response from the server
      const newPostedGame = {
        id: postedGame._id || `apf-${Date.now()}`,
        team1Name: team1.name,
        team2Name: team2.name,
        location: location,
        judgeNames: judges.map(j => j.name).join(', '),
        themeLabel: typeof theme === 'string' ? theme : theme.label
      };

      setApfPostings(prev => [...prev, newPostedGame]);

      // Reset the form
      setCurrentApfGameData({
        team1: null,
        team2: null,
        location: '',
        judges: [],
        theme: null
      });

      setNotification({
        open: true,
        message: 'APF game posted successfully!',
        severity: 'success'
      });

    } catch (error) {
      console.error('Error posting APF game:', error);
      setNotification({
        open: true,
        message: `Failed to post game: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const { type, id } = deleteItem;
      
      switch (type) {
        case 'entrant':
          setEntrants(entrants.filter(e => e.id !== id));
          break;
        case 'team':
          setTeams(teams.filter(t => t.id !== id));
          break;
        case 'judge':
          setJudges(judges.filter(j => j.id !== id));
          break;
        case 'post':
          setPosts(posts.filter(p => p.id !== id));
          break;
        default:
          break;
      }
      
      setNotification({
        open: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        severity: 'success'
      });
      
      handleCloseDialog('delete');
    } catch (error) {
      console.error('Error deleting item:', error);
      setNotification({
        open: true,
        message: 'Failed to delete item',
        severity: 'error'
      });
    }
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Function to fetch standings data
  const fetchStandings = async () => {
    try {
      const response = await fetch(`${api.baseUrl}/api/apf/tabulation/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch standings: ${response.status}`);
      }
      
      const standingsData = await response.json();
      console.log('Fetched standings data:', standingsData);
      setStandings(standingsData);
      
      // Update teams with standings data
      if (standingsData.length > 0) {
        setTeams(prevTeams => {
          const updatedTeams = [...prevTeams];
          
          // Update each team with its standings data
          for (const team of updatedTeams) {
            const teamStanding = standingsData.find(s => s.id === team.id);
            if (teamStanding) {
              team.wins = teamStanding.wins || 0;
              team.points = teamStanding.score || 0;
              // Calculate losses based on total games (we could improve this with actual game count)
              team.losses = 0; // For now, just showing wins
            }
          }
          
          return updatedTeams;
        });
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
      // Don't show error notification for standings as it's non-critical
    }
  };

  const generateTestData = async () => {
    try {
      setLoading(true);
      console.log('Starting test data generation...');
      
      setNotification({
        open: true,
        message: 'Generating test data...',
        severity: 'info'
      });

      // First, fetch all test users from database
      console.log('[generateTestData] Fetching potential judges and debaters...');
      const testJudgesResponse = await fetch(`${api.baseUrl}/api/users/test/judges`, {
        headers: getAuthHeaders()
      });
      
      const testDebatersResponse = await fetch(`${api.baseUrl}/api/users/test/debaters`, {
        headers: getAuthHeaders()
      });
      
      if (!testJudgesResponse.ok || !testDebatersResponse.ok) {
        const judgesError = await testJudgesResponse.text();
        const debatersError = await testDebatersResponse.text();
        throw new Error(`Failed to fetch test users: Judges(${testJudgesResponse.status}): ${judgesError}, Debaters(${testDebatersResponse.status}): ${debatersError}`);
      }
      
      const testJudgesData = await testJudgesResponse.json();
      const testDebatersData = await testDebatersResponse.json();
      const testJudges = testJudgesData.users;
      const testDebaters = testDebatersData.users;
      
      console.log(`Found ${testJudges.length} judges and ${testDebaters.length} debaters`);
      
      if (!testJudges.length || !testDebaters.length) {
        throw new Error(`Insufficient test users found. Judges: ${testJudges.length}, Debaters: ${testDebaters.length}`);
      }
      
      // Register these users to the tournament
      console.log('[generateTestData] Registering participants...');
      const updateResponse = await fetch(`${api.baseUrl}/api/debates/${id}/register-participants`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          judges: testJudges.map(j => j._id.toString()),
          debaters: testDebaters.map(d => d._id.toString())
        })
      });
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to register participants to the tournament: ${errorText}`);
      }
      
      const updatedData = await updateResponse.json();
      console.log('Registration successful:', updatedData);
      
      // Update the local state with new data
      setTournament(updatedData);
      
      // Update entrants and judges lists
      const newEntrants = testDebaters.map(debater => ({
        id: debater._id,
        name: debater.username,
        email: debater.email,
        enrollDate: new Date(debater.createdAt).toLocaleDateString()
      }));
      setEntrants(newEntrants);
      
      const newJudges = testJudges.map(judge => ({
        id: judge._id,
        name: judge.username,
        email: judge.email,
        role: judge.judgeRole || 'Judge'
      }));
      setJudges(newJudges);
      
      // Initialize standings for all teams with zero stats
      setStandings([]);
      
      // Set teams with zero stats
      if (updatedData.teams && updatedData.teams.length > 0) {
        const updatedTeams = updatedData.teams.map(team => {
          const leaderMember = team.members.find(m => m.role === 'leader');
          const speakerMember = team.members.find(m => m.role === 'speaker');
          
          return {
            id: team._id,
            name: team.name,
            leader: leaderMember?.userId?.username || 'Unknown',
            speaker: speakerMember?.userId?.username || 'Unknown',
            leaderId: leaderMember?.userId?._id || leaderMember?.userId,
            speakerId: speakerMember?.userId?._id || speakerMember?.userId,
            wins: 0,
            losses: 0,
            points: 0
          };
        });
        
        setTeams(updatedTeams);
      }
      
      setNotification({
        open: true,
        message: 'Test participants registered successfully. Click "Randomize Teams" to create teams.',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('API error during test data generation:', error);
      console.log('[generateTestData] Error occurred:', error);
      setNotification({
        open: true,
        message: 'Failed to generate test data: ' + error.message,
        severity: 'error'
      });
    } finally {
      console.log('[generateTestData] Finished.');
      setLoading(false);
    }
  };

  // Function to randomize team selection
  const randomizeTeams = async () => {
    try {
      setLoading(true);
      
      // Check if we have enough entrants
      if (entrants.length < 2) {
        setNotification({
          open: true,
          message: 'Need at least 2 entrants to form teams',
          severity: 'warning'
        });
        setLoading(false);
        return;
      }
      
      // Create a copy of the entrants array and shuffle it
      const shuffledEntrants = [...entrants].sort(() => Math.random() - 0.5);
      
      // Clear existing teams
      const newTeams = [];
      const teamDataForDb = [];
      
      // Create new teams with randomly paired entrants
      for (let i = 0; i < Math.floor(shuffledEntrants.length / 2); i++) {
        const entrant1 = shuffledEntrants[i*2];
        const entrant2 = shuffledEntrants[i*2+1];
        
        // Create new team with randomized pairs
        const newTeam = {
          id: `team-${Date.now()}-${i}`,
          name: `Team ${i+1}`,
          leader: entrant1.name,
          speaker: entrant2.name,
          leaderId: entrant1.id,
          speakerId: entrant2.id,
          wins: 0,
          losses: 0,
          points: 0
        };
        
        // Add to new teams array for UI
        newTeams.push(newTeam);
        
        // Prepare team data for database
        teamDataForDb.push({
          name: newTeam.name,
          leader: newTeam.leaderId,
          speaker: newTeam.speakerId,
        });
      }
      
      // Save all teams to the database at once
      try {
        const response = await fetch(`${api.baseUrl}/api/debates/${id}/randomize-teams`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            teams: teamDataForDb
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save randomized teams: ${errorText}`);
        }
        
        // Update tournament data with response
        const updatedTournament = await response.json();
        setTournament(updatedTournament);
        
        // Initialize standings with zero stats for all teams
        setStandings([]);
        
        // Update teams state with data from server
        if (updatedTournament.teams && updatedTournament.teams.length > 0) {
          setTeams(updatedTournament.teams.map(team => ({
            id: team._id,
            name: team.name,
            leader: team.members.find(m => m.role === 'leader')?.userId?.username || 'Unknown',
            speaker: team.members.find(m => m.role === 'speaker')?.userId?.username || 'Unknown',
            leaderId: team.members.find(m => m.role === 'leader')?.userId?._id,
            speakerId: team.members.find(m => m.role === 'speaker')?.userId?._id,
            wins: 0,
            losses: 0,
            points: 0
          })));
        } else {
          // Fallback to local teams if server didn't return team data
          setTeams(newTeams);
        }
      } catch (error) {
        console.error('Failed to save teams to database:', error);
        // Update local state even if server request failed
        setTeams(newTeams);
        throw error; // rethrow to be caught by outer catch block
      }
      
      // Handle odd number of entrants if there are any
      if (shuffledEntrants.length % 2 !== 0) {
        setNotification({
          open: true,
          message: `Teams randomized successfully! Note: One entrant (${shuffledEntrants[shuffledEntrants.length-1].name}) was left without a team due to odd number of participants.`,
          severity: 'info'
        });
      } else {
        setNotification({
          open: true,
          message: 'Teams randomized successfully!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error randomizing teams:', error);
      setNotification({
        open: true,
        message: 'Failed to randomize teams: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!tournament) {
    return (
      <Container>
        <Alert severity="error">Tournament not found</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Tournament Header */}
      <Typography variant="h4" sx={{ mb: 3 }}>
        Tournament: {tournament.title}
      </Typography>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tournament management tabs">
          <Tab label="Entrants" />
          <Tab label="Teams" />
          <Tab label="Judges" />
          <Tab label="Posting" />
          <Tab label="Table" />
        </Tabs>
      </Box>
      
      {/* Entrants Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Tournament Entrants ({entrants.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by name or email..."
              sx={{ width: 250 }}
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                setEntrants(prev => prev.map(entrant => ({
                  ...entrant,
                  hidden: !(entrant.name.toLowerCase().includes(searchTerm) ||
                          entrant.email.toLowerCase().includes(searchTerm))
                })));
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('entrant')}
              >
                Add Entrant
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={generateTestData}
              >
                Generate Test Data
              </Button>
            </Box>
          </Box>
        </Box>
        
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Enroll Date</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entrants.filter(e => !e.hidden).map((entrant) => (
                <TableRow key={entrant.id}>
                  <TableCell>{entrant.name}</TableCell>
                  <TableCell>{entrant.enrollDate}</TableCell>
                  <TableCell>{entrant.email}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog('entrant', true, entrant)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteItem('entrant', entrant.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {entrants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No entrants found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
      
      {/* Teams Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Tournament Teams ({teams.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search teams..."
              sx={{ width: 250 }}
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                setTeams(prev => prev.map(team => ({
                  ...team,
                  hidden: !(team.name.toLowerCase().includes(searchTerm) ||
                          team.leader.toLowerCase().includes(searchTerm) ||
                          team.speaker.toLowerCase().includes(searchTerm))
                })));
              }}
            />
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ShuffleIcon />}
              onClick={randomizeTeams}
            >
              Randomize Teams
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('team')}
            >
              Add Team
            </Button>
          </Box>
        </Box>
        
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Team Name</TableCell>
                <TableCell>Role 1 / Leader</TableCell>
                <TableCell>Role 2 / Speaker</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.filter(t => !t.hidden).map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>{team.leader}</TableCell>
                  <TableCell>{team.speaker}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog('team', true, team)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteItem('team', team.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {teams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No teams found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
      
      {/* Judges Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Tournament Judges ({judges.length})
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('judge')}
          >
            Add Judge
          </Button>
        </Box>
        
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {judges.map((judge) => (
                <TableRow key={judge.id}>
                  <TableCell>{judge.name}</TableCell>
                  <TableCell>{judge.role}</TableCell>
                  <TableCell>{judge.email}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog('judge', true, judge)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteItem('judge', judge.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {judges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">No judges found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
      
      {/* Posting Tab */}
      <TabPanel value={tabValue} index={3}>
        {/* APF Posting Section */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Post New APF Game
        </Typography>

        {/* Render ApfPostingCard component */}
        <Box sx={{ mb: 4 }}>
          <ApfPostingCard
            teams={teams} // Pass existing teams state
            judges={judges} // Pass existing judges state
            // themes={availableThemes} // Pass themes if using predefined ones
            currentCardData={currentApfGameData}
            onInputChange={handleApfCardChange} // Pass the actual handler
            onConfirm={handleConfirmApfGame} // Pass the actual handler
          />
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" sx={{ mb: 2 }}>
          Posted APF Games
        </Typography>

        {/* Placeholder for displaying posted APF games */}
        <Box>
          {apfPostings.length === 0 ? (
            <Typography>No APF games posted yet.</Typography>
          ) : (
            apfPostings.map(game => (
              <Paper key={game.id} sx={{ p: 2, mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Game: <strong>{game.team1Name || game.team1?.name || 'N/A'}</strong> vs <strong>{game.team2Name || game.team2?.name || 'N/A'}</strong>
                </Typography>
                <Typography variant="body2"><strong>Location:</strong> {game.location || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Judges:</strong> {game.judgeNames || game.judges?.map(j => j.name).join(', ') || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Theme:</strong> {game.themeLabel || game.theme || 'N/A'}</Typography>
              </Paper>
            ))
          )}
          {/* Example structure:
          {apfPostings.length === 0 ? (
            <Typography>No APF games posted yet.</Typography>
          ) : (
            apfPostings.map(game => (
              <Paper key={game.id} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">Game: {game.team1.name} vs {game.team2.name}</Typography>
                <Typography variant="body2">Location: {game.location}</Typography>
                <Typography variant="body2">Judges: {game.judges.map(j => j.name).join(', ')}</Typography>
                <Typography variant="body2">Theme: {game.theme}</Typography>
              </Paper>
            ))
          )}
          */}
        </Box>
      </TabPanel>
      
      {/* Table Tab */}
      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6" sx={{ mb: 2 }}>Tournament Standings</Typography>
        
        {/* Add refresh button for standings */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={fetchStandings}
            startIcon={<ShuffleIcon />}
          >
            Refresh Standings
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Team</TableCell>
                <TableCell align="right">Wins</TableCell>
                <TableCell align="right">Losses</TableCell>
                <TableCell align="right">Points</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Sort teams by wins (primary) and points (secondary) */}
              {teams
                .slice()
                .sort((a, b) => {
                  if (b.wins !== a.wins) return b.wins - a.wins;
                  return b.points - a.points;
                })
                .map((team, index) => (
                  <TableRow key={team.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{team.name}</TableCell>
                    <TableCell align="right">{team.wins || 0}</TableCell>
                    <TableCell align="right">{team.losses || 0}</TableCell>
                    <TableCell align="right">{team.points || 0}</TableCell>
                  </TableRow>
                ))}
                
              {teams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No teams available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
      
      {/* Entrant Dialog */}
      <Dialog open={openEntrantDialog} onClose={() => handleCloseDialog('entrant')} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Entrant' : 'Add Entrant'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={entrantForm.name}
            onChange={handleEntrantFormChange}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={entrantForm.email}
            onChange={handleEntrantFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('entrant')}>Cancel</Button>
          <Button onClick={handleSubmitEntrant} color="primary">
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Team Dialog */}
      <Dialog open={openTeamDialog} onClose={() => handleCloseDialog('team')} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Team' : 'Add Team'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Team Name"
            type="text"
            fullWidth
            variant="outlined"
            value={teamForm.name}
            onChange={handleTeamFormChange}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id="leader-label">Team Leader</InputLabel>
            <Select
              labelId="leader-label"
              id="leader"
              name="leader"
              value={teamForm.leader}
              label="Team Leader"
              onChange={handleTeamFormChange}
            >
              {entrants.map((entrant) => (
                <MenuItem key={entrant.id} value={entrant.id}>
                  {entrant.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth variant="outlined">
            <InputLabel id="speaker-label">Team Speaker</InputLabel>
            <Select
              labelId="speaker-label"
              id="speaker"
              name="speaker"
              value={teamForm.speaker}
              label="Team Speaker"
              onChange={handleTeamFormChange}
            >
              {entrants.map((entrant) => (
                <MenuItem key={entrant.id} value={entrant.id}>
                  {entrant.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('team')}>Cancel</Button>
          <Button onClick={handleSubmitTeam} color="primary">
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Judge Dialog */}
      <Dialog open={openJudgeDialog} onClose={() => handleCloseDialog('judge')} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Judge' : 'Add Judge'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={judgeForm.name}
            onChange={handleJudgeFormChange}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={judgeForm.email}
            onChange={handleJudgeFormChange}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth variant="outlined">
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={judgeForm.role}
              label="Role"
              onChange={handleJudgeFormChange}
            >
              <MenuItem value="Head Judge">Head Judge</MenuItem>
              <MenuItem value="Judge">Judge</MenuItem>
              <MenuItem value="Assistant Judge">Assistant Judge</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('judge')}>Cancel</Button>
          <Button onClick={handleSubmitJudge} color="primary">
            {isEditing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Post Dialog */}
      <Dialog open={openPostDialog} onClose={() => handleCloseDialog('post')} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Post' : 'Create Post'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Post Title"
            type="text"
            fullWidth
            variant="outlined"
            value={postForm.title}
            onChange={handlePostFormChange}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="content"
            label="Content"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={postForm.content}
            onChange={handlePostFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('post')}>Cancel</Button>
          <Button onClick={handleSubmitPost} color="primary">
            {isEditing ? 'Update' : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => handleCloseDialog('delete')}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this {deleteItem.type}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCloseDialog('delete')}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TournamentManagement;