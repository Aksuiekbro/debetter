import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth';
import {
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Box,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const JudgePanel = ({ debate, onUpdateDebate }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [teamAssignmentOpen, setTeamAssignmentOpen] = useState(false);
  const [teams, setTeams] = useState({ proposition: [], opposition: [] });
  const [recording, setRecording] = useState(false);
  const [expandedTranscripts, setExpandedTranscripts] = useState({});
  const [currentRoom, setCurrentRoom] = useState(null);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isDebateEnded, setIsDebateEnded] = useState(false);
  const [fullTranscript, setFullTranscript] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [transcriptHistory, setTranscriptHistory] = useState([]);

  const steps = ['Team Assignment', 'Room Setup', 'Debate in Progress'];

  useEffect(() => {
    if (debate.teams && debate.teams.length > 0) {
      const propositionTeam = debate.teams.find(t => t.side === 'proposition');
      const oppositionTeam = debate.teams.find(t => t.side === 'opposition');
      setTeams({
        proposition: propositionTeam?.members || [],
        opposition: oppositionTeam?.members || []
      });
    }
  }, [debate]);

  const getCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('http://localhost:5001/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentRoom) {
      console.log('Current Room Data:', currentRoom);
      if (currentRoom.transcription) {
        const formattedTranscripts = currentRoom.transcription
          .map(t => {
            const time = new Date(t.timestamp).toLocaleTimeString();
            const speaker = t.speaker?.username || 'Unknown';
            return `[${time}] ${speaker}: ${t.text}`;
          })
          .join('\n\n');
        console.log('Formatted Transcripts:', formattedTranscripts);
        setFullTranscript(formattedTranscripts);
        setTranscriptHistory(currentRoom.transcription);
      }
    }
  }, [currentRoom]);

  // Add effect to load active room when component mounts
  useEffect(() => {
    const loadActiveRoom = async () => {
      try {
        if (!debate || !debate.rooms) return;
        
        // Find the active room
        const activeRoom = debate.rooms.find(r => r.isActive);
        if (activeRoom) {
          console.log('Found active room:', activeRoom._id);
          // Load room with populated data
          const response = await fetch(`http://localhost:5001/api/debates/${debate._id}/room/${activeRoom._id}`, {
            headers: getAuthHeaders()
          });
          
          if (response.ok) {
            const { room } = await response.json();
            console.log('Loaded room data:', room);
            setCurrentRoom(room);
            if (room.transcription && room.transcription.length > 0) {
              const formattedTranscripts = room.transcription
                .map(t => {
                  const time = new Date(t.timestamp).toLocaleTimeString();
                  const speaker = t.speaker?.username || 'Unknown';
                  return `[${time}] ${speaker}: ${t.text}`;
                })
                .join('\n\n');
              setFullTranscript(formattedTranscripts);
            }
          }
        }
      } catch (error) {
        console.error('Error loading active room:', error);
      }
    };

    loadActiveRoom();
  }, [debate]);

  const handleStartTeamAssignment = () => {
    setTeamAssignmentOpen(true);
  };

  const handleRandomizeTeams = () => {
    const participants = [...debate.participants];
    // Filter out judges
    const debaters = participants.filter(p => p.role !== 'judge');
    // Shuffle array
    const shuffled = debaters.sort(() => 0.5 - Math.random());
    // Split into two teams
    const halfLength = Math.floor(shuffled.length / 2);
    
    setTeams({
      proposition: shuffled.slice(0, halfLength),
      opposition: shuffled.slice(halfLength)
    });
  };

  const handleConfirmTeams = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/debates/${debate._id}/assign-teams`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          teams: [
            { side: 'proposition', members: teams.proposition.map(p => p._id) },
            { side: 'opposition', members: teams.opposition.map(p => p._id) }
          ]
        })
      });

      if (response.status === 401) {
        handleUnauthorized(navigate);
        return;
      }

      if (response.ok) {
        const updatedDebate = await response.json();
        onUpdateDebate(updatedDebate);
        setTeamAssignmentOpen(false);
        setActiveStep(1);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to assign teams');
      }
    } catch (error) {
      console.error('Error assigning teams:', error);
      alert('Failed to assign teams. Please try again.');
    }
  };

  const handleStartRoom = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/debates/${debate._id}/start-room`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        handleUnauthorized(navigate);
        return;
      }

      if (response.ok) {
        const { room } = await response.json();
        console.log('Room started:', room);
        setCurrentRoom(room);
        setActiveStep(2);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to start debate room');
      }
    } catch (error) {
      console.error('Error starting room:', error);
      alert('Failed to start debate room. Please try again.');
    }
  };

  const handleStartRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    if (!currentRoom || !currentRoom._id) {
      alert('No active debate room found. Please start a room first.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = async (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          
          try {
            const saveResponse = await fetch(`http://localhost:5001/api/debates/${debate._id}/save-transcript`, {
              method: 'POST',
              headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                roomId: currentRoom._id,
                text: finalTranscript.trim(),
                timestamp: new Date(),
                speaker: currentUser._id
              })
            });

            const saveResult = await saveResponse.json();
            if (saveResponse.ok) {
              // Update the local transcript display
              setFullTranscript(prev => 
                prev + (prev ? '\n\n' : '') + 
                `[${new Date().toLocaleTimeString()}] ${currentUser?.username || 'Unknown'}: ${finalTranscript.trim()}`
              );
              // Update room transcription
              setCurrentRoom(prevRoom => ({
                ...prevRoom,
                transcription: saveResult.transcription
              }));
            } else {
              console.error('Failed to save transcript:', saveResult.message);
            }
          } catch (error) {
            console.error('Error saving transcript:', error);
          }
        } else {
          interimTranscript += transcript;
          setInterimText(interimTranscript);
        }
      }
    };

    recognition.onend = () => {
      if (recording) {
        recognition.start(); // Restart if we're still supposed to be recording
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Please allow microphone access to use speech recognition.');
      }
    };

    try {
      recognition.start();
      setRecording(true);
      window.recognition = recognition; // Store for stopping later
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  const handleStopRecording = () => {
    if (window.recognition) {
      window.recognition.stop();
      delete window.recognition;
    }
    setRecording(false);
  };

  const handleEndDebate = async () => {
    try {
      if (recording) {
        handleStopRecording();
      }

      // Get the active room's transcription
      if (!currentRoom || !currentRoom.transcription || currentRoom.transcription.length === 0) {
        alert('No debate transcript available for analysis. Please record some discussion first.');
        return;
      }

      const response = await fetch(`http://localhost:5001/api/debates/${debate._id}/end`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: currentRoom._id
        })
      });

      if (response.status === 401) {
        handleUnauthorized(navigate);
        return;
      }

      const result = await response.json();
      console.log('End debate response:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to end debate');
      }

      setAnalysisResults(result.analysis);
      setIsDebateEnded(true);
      onUpdateDebate({ ...debate, status: 'completed' });

    } catch (error) {
      console.error('Error ending debate:', error);
      alert(error.message || 'Failed to end debate. Please try again.');
    }
  };

  const toggleTranscript = (transcriptId) => {
    setExpandedTranscripts(prev => ({
      ...prev,
      [transcriptId]: !prev[transcriptId]
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartTeamAssignment}
              sx={{ mt: 2 }}
            >
              Start Team Assignment
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Teams Assigned
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartRoom}
              sx={{ mt: 2 }}
            >
              Start Debate Room
            </Button>
          </Box>
        )}

        {activeStep === 2 && currentRoom && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Debate Room
              </Typography>
              {!isDebateEnded && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleEndDebate}
                >
                  End Debate
                </Button>
              )}
            </Box>
            
            {/* Recording controls - only show if debate hasn't ended */}
            {!isDebateEnded && (
              <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  color={recording ? 'error' : 'primary'}
                  startIcon={recording ? <StopIcon /> : <MicIcon />}
                  onClick={recording ? handleStopRecording : handleStartRecording}
                >
                  {recording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                
                {recording && (
                  <Chip 
                    color="error" 
                    label="Recording in progress..." 
                    sx={{ animation: 'pulse 1.5s infinite' }} 
                  />
                )}
              </Box>
            )}

            {/* Live transcription display */}
            {recording && (
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  minHeight: '100px',
                  border: '1px solid #e0e0e0'
                }}
              >
                <Typography variant="h6" color="primary" gutterBottom>
                  Live Transcription
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  {interimText}
                </Typography>
              </Paper>
            )}

            {/* Full Transcript Display */}
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                maxHeight: '400px',
                overflow: 'auto',
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography variant="h6" color="primary" gutterBottom>
                Debate Transcript
              </Typography>
              {fullTranscript ? (
                <Typography 
                  variant="body1" 
                  component="pre" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    fontFamily: 'inherit'
                  }}
                >
                  {fullTranscript}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No transcript available yet. Start recording to begin capturing the debate.
                </Typography>
              )}
            </Paper>

            {/* Final Analysis Results */}
            {isDebateEnded && analysisResults && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Debate Analysis
                </Typography>
                
                {/* Proposition Arguments */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Proposition Team Arguments
                    </Typography>
                    {analysisResults.propositionArguments.map((arg, index) => (
                      <Card key={index} sx={{ mb: 1 }}>
                        <CardContent>
                          <Typography variant="body1">
                            {arg.argument}
                          </Typography>
                          {arg.evidence && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Evidence: {arg.evidence}
                            </Typography>
                          )}
                          {arg.counterArgument && (
                            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                              Counter: {arg.counterArgument}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Opposition Arguments */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Opposition Team Arguments
                    </Typography>
                    {analysisResults.oppositionArguments.map((arg, index) => (
                      <Card key={index} sx={{ mb: 1 }}>
                        <CardContent>
                          <Typography variant="body1">
                            {arg.argument}
                          </Typography>
                          {arg.evidence && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Evidence: {arg.evidence}
                            </Typography>
                          )}
                          {arg.counterArgument && (
                            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                              Counter: {arg.counterArgument}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Statistical Claims Verification */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Statistical Claims Verification
                  </Typography>
                  {analysisResults.factCheck.map((claim, index) => (
                    <Card key={index} sx={{ mb: 1 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">
                            {claim.statement}
                          </Typography>
                          <Chip 
                            label={claim.verification} 
                            color={claim.verification === 'Verified' ? 'success' : 'warning'}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Transcripts & Analysis
              </Typography>
              {currentRoom.transcription.map((entry, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </Typography>
                      <IconButton onClick={() => toggleTranscript(index)}>
                        {expandedTranscripts[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Key Arguments:
                      </Typography>
                      {entry.aiHighlights.keyArguments.map((arg, i) => (
                        <Chip key={i} label={arg} sx={{ m: 0.5 }} />
                      ))}
                    </Box>

                    {expandedTranscripts[index] && (
                      <>
                        <Typography variant="body1">
                          {entry.text}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Statistical Claims:
                          </Typography>
                          {entry.aiHighlights.statisticalClaims.map((claim, i) => (
                            <Chip key={i} label={claim} color="info" sx={{ m: 0.5 }} />
                          ))}
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Logical Connections:
                          </Typography>
                          {entry.aiHighlights.logicalConnections.map((connection, i) => (
                            <Chip key={i} label={connection} color="secondary" sx={{ m: 0.5 }} />
                          ))}
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        <Dialog open={teamAssignmentOpen} onClose={() => setTeamAssignmentOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Assign Teams</DialogTitle>
          <DialogContent>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleRandomizeTeams}
              sx={{ mb: 3 }}
            >
              Randomize Teams
            </Button>
            
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="h6" gutterBottom>
                  Proposition Team
                </Typography>
                <List>
                  {teams.proposition.map((member) => (
                    <ListItem key={member._id}>
                      <ListItemText primary={member.username} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" gutterBottom>
                  Opposition Team
                </Typography>
                <List>
                  {teams.opposition.map((member) => (
                    <ListItem key={member._id}>
                      <ListItemText primary={member.username} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTeamAssignmentOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmTeams} variant="contained" color="primary">
              Confirm Teams
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default JudgePanel;