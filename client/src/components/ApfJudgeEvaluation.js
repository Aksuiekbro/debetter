import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tabs,
  Tab,
  FormGroup,
  TextField,
  Rating
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicIcon from '@mui/icons-material/Mic';
import CloseIcon from '@mui/icons-material/Close';

const ApfJudgeEvaluation = ({ 
  game, 
  onClose, 
  onSubmitEvaluation 
}) => {
  // Debug log to see the game object structure
  console.log('ApfJudgeEvaluation - game object:', game);
  console.log('Team1 data:', game.team1);
  console.log('Team2 data:', game.team2);
  
  const [recording, setRecording] = useState(false);
  const [winningTeam, setWinningTeam] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleStartRecording = () => {
    // In the future, this would activate the STT functionality
    setRecording(true);
  };

  const handleStopRecording = () => {
    setRecording(false);
  };

  const handleDeclareWinner = (teamId) => {
    setWinningTeam(teamId);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const [speakerFeedback, setSpeckerFeedback] = useState({
    'leader_gov': '',
    'leader_opp': '',
    'speaker_gov': '',
    'speaker_opp': ''
  });

  // Add state for speaker ratings and team ratings
  const [speakerRatings, setSpeakerRatings] = useState({
    'leader_gov': {},
    'leader_opp': {},
    'speaker_gov': {},
    'speaker_opp': {}
  });
  
  const [teamRatings, setTeamRatings] = useState({
    'team1': {},
    'team2': {}
  });
  
  const [speakerTotalPoints, setSpeakerTotalPoints] = useState({
    'leader_gov': '',
    'leader_opp': '',
    'speaker_gov': '',
    'speaker_opp': ''
  });

  const handleRatingChange = (speakerRole, criterionId, value) => {
    setSpeakerRatings(prev => ({
      ...prev,
      [speakerRole]: {
        ...prev[speakerRole],
        [criterionId]: value
      }
    }));
  };

  const handleTeamRatingChange = (teamId, criterionId, value) => {
    setTeamRatings(prev => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [criterionId]: value
      }
    }));
  };

  const handleTotalPointsChange = (speakerRole, value) => {
    setSpeakerTotalPoints(prev => ({
      ...prev,
      [speakerRole]: value
    }));
  };

  const handleSubmitEvaluation = () => {
    // Check if a winner has been selected
    if (!winningTeam) {
      alert('Please select a winning team before submitting');
      return;
    }

    // Close the confirmation dialog
    setShowConfirmDialog(false);
    
    // Prepare evaluation data
    const speakerScores = {};
    
    // Process speaker ratings
    Object.keys(speakerRatings).forEach(speakerRole => {
      speakerScores[speakerRole] = {
        criteriaRatings: speakerRatings[speakerRole],
        feedback: speakerFeedback[speakerRole],
        totalPoints: speakerTotalPoints[speakerRole] || 0
      };
    });
    
    // Process team criteria ratings
    const teamScores = {
      team1: teamRatings.team1,
      team2: teamRatings.team2
    };
    
    // Prepare transcription data if any
    const transcriptionData = {};
    Object.keys(transcriptions).forEach(key => {
      if (transcriptions[key]) {
        transcriptionData[key] = transcriptions[key];
      }
    });
    
    // Call the parent's callback with complete evaluation data
    onSubmitEvaluation({
      gameId: game.id,  // Posting ID
      tournamentId: game.tournamentId, // Tournament/Debate ID
      winningTeamId: winningTeam,
      speakerScores,
      teamScores,
      transcriptions: Object.keys(transcriptionData).length > 0 ? transcriptionData : undefined,
      notes: ''  // Optional general notes
    });
    
    // Close the evaluation interface
    onClose();
  };

  // Columns for APF debate roles
  const columns = [
    { id: 'criteria', label: 'Criteria' },
    { id: 'leader_gov', label: 'Leader Gov (14 min)', align: 'center' },
    { id: 'leader_opp', label: 'Leader Opp (14 min)', align: 'center' },
    { id: 'speaker_gov', label: 'Speaker Gov (14 min)', align: 'center' },
    { id: 'speaker_opp', label: 'Speaker Opp (14 min)', align: 'center' }
  ];

  // Example criteria rows for the evaluation table
  const rows = [
    { id: 'content', criteria: 'Content & Arguments', scores: { leader_gov: '', leader_opp: '', speaker_gov: '', speaker_opp: '' } },
    { id: 'style', criteria: 'Style & Delivery', scores: { leader_gov: '', leader_opp: '', speaker_gov: '', speaker_opp: '' } },
    { id: 'strategy', criteria: 'Strategy', scores: { leader_gov: '', leader_opp: '', speaker_gov: '', speaker_opp: '' } },
    { id: 'total', criteria: 'Total Score', scores: { leader_gov: '', leader_opp: '', speaker_gov: '', speaker_opp: '' } },
  ];

  // Speaker evaluation criteria based on roles
  const leaderCriteria = [
    { id: 'clarity', label: 'Clarity of definition/framing' },
    { id: 'construction', label: 'Argument construction' },
    { id: 'responsiveness', label: 'Responsiveness to opponent' },
    { id: 'strategic', label: 'Strategic positioning' },
    { id: 'delivery', label: 'Delivery and oratory' }
  ];

  const speakerCriteria = [
    { id: 'refutation', label: 'Refutation/rebuilding' },
    { id: 'analysis', label: 'New analysis/depth' },
    { id: 'engagement', label: 'Engagement and structure' },
    { id: 'timeManagement', label: 'Time management & structure' },
    { id: 'framing', label: 'Framing and clarity' }
  ];

  // Team evaluation criteria
  const teamCriteria = [
    { id: 'argumentStrength', label: 'Argument strength' },
    { id: 'refutation', label: 'Refutation/Clash' },
    { id: 'weighting', label: 'Weighting and impact' },
    { id: 'teamCohesion', label: 'Team cohesion' },
    { id: 'structure', label: 'Structure and organization' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'visual', label: 'Visuals/body language' },
    { id: 'ruleObedience', label: 'Rule obedience' }
  ];

  // Speech component criteria
  const speechComponentCriteria = [
    { id: 'constructiveSpeech', label: 'Constructive speech' },
    { id: 'rebuttalSpeech', label: 'Rebuttal speech' },
    { id: 'crossExamination', label: 'Cross examination' },
    { id: 'useOfEvidence', label: 'Use of evidence' }
  ];

  // Mock STT transcription data (would be replaced with actual STT data)
  const [transcriptions, setTranscriptions] = useState({
    'leader_gov': '',
    'leader_opp': '',
    'speaker_gov': '',
    'speaker_opp': ''
  });

  // Update transcription when recording is active (simulated)
  React.useEffect(() => {
    if (recording) {
      // Simulating receiving STT data while recording is active
      const timer = setTimeout(() => {
        setTranscriptions(prev => ({
          ...prev,
          'leader_gov': prev.leader_gov || 'The government believes that this policy would benefit society because it addresses fundamental issues that have been overlooked for too long. Our first point is that...'
        }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [recording]);

  // Helper function to get the appropriate criteria based on role
  const getCriteriaForRole = (role) => {
    return role.includes('leader') ? leaderCriteria : speakerCriteria;
  };

  // Helper function to get speaker name based on role
  const getSpeakerName = (role) => {
    // Log the game object to debug
    console.log(`Getting speaker name for role: ${role}`);
    
    if (role === 'leader_gov') {
      // Team 1 leader
      const leader = game.team1.leader;
      if (!leader) return 'Leader Gov';
      
      // Log the leader object to debug its structure
      console.log('Leader Gov object:', leader);
      
      // If leader is a string, return it
      if (typeof leader === 'string') return leader;
      
      // If leader is an object with name property, return the name
      if (leader && typeof leader === 'object') {
        // Return the name directly if available
        if (leader.name) return leader.name;
        
        // For UI display, we prioritize showing the actual person's name
        return 'Leader Gov';
      }
      
      return 'Leader Gov';
    }
    
    if (role === 'speaker_gov') {
      // Team 1 speaker
      const speaker = game.team1.speaker;
      if (!speaker) return 'Speaker Gov';
      
      // Log the speaker object to debug its structure
      console.log('Speaker Gov object:', speaker);
      
      // If speaker is a string, return it
      if (typeof speaker === 'string') return speaker;
      
      // If speaker is an object with name property, return the name
      if (speaker && typeof speaker === 'object') {
        // Return the name directly if available
        if (speaker.name) return speaker.name;
        
        // For UI display, we prioritize showing the actual person's name
        return 'Speaker Gov';
      }
      
      return 'Speaker Gov';
    }
    
    if (role === 'leader_opp') {
      // Team 2 leader
      const leader = game.team2.leader;
      if (!leader) return 'Leader Opp';
      
      // Log the leader object to debug its structure
      console.log('Leader Opp object:', leader);
      
      // If leader is a string, return it
      if (typeof leader === 'string') return leader;
      
      // If leader is an object with name property, return the name
      if (leader && typeof leader === 'object') {
        // Return the name directly if available
        if (leader.name) return leader.name;
        
        // For UI display, we prioritize showing the actual person's name
        return 'Leader Opp';
      }
      
      return 'Leader Opp';
    }
    
    if (role === 'speaker_opp') {
      // Team 2 speaker
      const speaker = game.team2.speaker;
      if (!speaker) return 'Speaker Opp';
      
      // Log the speaker object to debug its structure
      console.log('Speaker Opp object:', speaker);
      
      // If speaker is a string, return it
      if (typeof speaker === 'string') return speaker;
      
      // If speaker is an object with name property, return the name
      if (speaker && typeof speaker === 'object') {
        // Return the name directly if available
        if (speaker.name) return speaker.name;
        
        // For UI display, we prioritize showing the actual person's name
        return 'Speaker Opp';
      }
      
      return 'Speaker Opp';
    }
    
    return 'Unknown Speaker';
  };

  // Helper function to get speaker role title
  const getSpeakerRole = (role) => {
    if (role.includes('leader')) return 'Leader';
    if (role.includes('speaker')) return 'Speaker';
    return 'Unknown Role';
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 3, position: 'relative', maxWidth: '1200px', mx: 'auto' }}>
        <IconButton 
          sx={{ position: 'absolute', top: 10, left: 10 }} 
          onClick={onClose}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h5" align="center" gutterBottom sx={{ mb: 3, pt: 2 }}>
          APF Debate Evaluation
        </Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>Teams:</strong> {game.team1.name} vs {game.team2.name}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Location:</strong> {game.location}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>Time:</strong> {new Date(game.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>Theme:</strong> {game.theme}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color={recording ? "error" : "success"}
            startIcon={<MicIcon />}
            onClick={recording ? handleStopRecording : handleStartRecording}
            sx={{ px: 4 }}
          >
            {recording ? "Stop Recording" : "Start"}
          </Button>
        </Box>
        
        {recording && (
          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mb: 2 }}>
            Recording in progress... Audio will be transcribed automatically.
          </Typography>
        )}

        <Box sx={{ width: '100%', mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            aria-label="evaluation tabs"
          >
            <Tab label="Debate Transcription" />
            <Tab label="Speaker Evaluation" />
            <Tab label={`Team Assessment (${game.team1.name} vs ${game.team2.name})`} />
          </Tabs>

          {/* Evaluation Table Tab */}
          <Box role="tabpanel" hidden={tabValue !== 0} sx={{ mt: 2 }}>
            {tabValue === 0 && (
              <>
                <Card elevation={2} sx={{ mb: 4 }}>
                  <CardHeader title="Speech Transcription" sx={{ background: 'rgba(0, 0, 0, 0.03)', p: 2 }} />
                  <CardContent>
                    <Grid container spacing={2}>
                      {Object.entries(transcriptions).map(([speaker, text]) => (
                        <Grid item xs={12} key={speaker}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {getSpeakerName(speaker)} ({getSpeakerRole(speaker)} - {speaker.includes('gov') ? game.team1.name : game.team2.name}):
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, minHeight: '60px', bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
                            <Typography variant="body2">
                              {text || 'No speech transcribed yet...'}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </>
            )}
          </Box>

          {/* Speaker Evaluation Tab */}
          <Box role="tabpanel" hidden={tabValue !== 1} sx={{ mt: 2 }}>
            {tabValue === 1 && (
              <Grid container spacing={3}>
                {Object.keys(transcriptions).map((speakerRole) => (
                  <Grid item xs={12} md={6} key={speakerRole}>
                    <Card sx={{ mb: 3 }}>
                      <CardHeader 
                        title={`${getSpeakerName(speakerRole)} - ${getSpeakerRole(speakerRole)}`}
                        subheader={`${speakerRole.includes('gov') ? `${game.team1.name} (Government)` : `${game.team2.name} (Opposition)`}`}
                        sx={{ background: speakerRole.includes('gov') ? 'rgba(63, 81, 181, 0.08)' : 'rgba(255, 82, 82, 0.08)', p: 2 }}
                      />
                      <CardContent>
                        {getCriteriaForRole(speakerRole).map((criterion) => (
                          <Box key={criterion.id} sx={{ mb: 2 }}>
                            <Grid container alignItems="center" spacing={1}>
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  {criterion.label}
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Rating 
                                  name={`${criterion.id}-${speakerRole}`}
                                  max={5}
                                  size="small"
                                  sx={{ mb: 1 }}
                                  onChange={(event, newValue) => handleRatingChange(speakerRole, criterion.id, newValue)}
                                  value={speakerRatings[speakerRole][criterion.id] || 0}
                                />
                              </Grid>
                            </Grid>
                            <Divider sx={{ mt: 1 }} />
                          </Box>
                        ))}
                        
                        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                          Overall Speaker Feedback
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          variant="outlined"
                          placeholder="Enter feedback for this speaker..."
                          value={speakerFeedback[speakerRole]}
                          onChange={(e) => setSpeckerFeedback(prev => ({
                            ...prev,
                            [speakerRole]: e.target.value
                          }))}
                          size="small"
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography variant="subtitle2">
                            Total Points:
                          </Typography>
                          <TextField
                            variant="outlined"
                            size="small"
                            type="number"
                            inputProps={{ 
                              min: 0, 
                              max: 100,
                              style: { textAlign: 'center' }
                            }}
                            sx={{ width: '80px' }}
                            value={speakerTotalPoints[speakerRole] || ''}
                            onChange={(e) => handleTotalPointsChange(speakerRole, e.target.value)}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* Team Criteria Tab */}
          <Box role="tabpanel" hidden={tabValue !== 2} sx={{ mt: 2 }}>
            {tabValue === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader 
                      title={`${game.team1.name}`}
                      subheader="Government Team" 
                      sx={{ 
                        background: 'rgba(63, 81, 181, 0.08)', 
                        p: 2,
                        '& .MuiCardHeader-title': { fontWeight: 'bold' } 
                      }}
                    />
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Team Criteria</Typography>
                      {teamCriteria.map((item) => (
                        <Box key={item.id} sx={{ mb: 2 }}>
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={8}>
                              <Typography variant="body2">
                                {item.label}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Rating 
                                name={`${item.id}-team1`}
                                max={5}
                                size="small"
                                sx={{ mb: 1 }}
                                onChange={(event, newValue) => handleTeamRatingChange('team1', item.id, newValue)}
                                value={teamRatings.team1[item.id] || 0}
                              />
                            </Grid>
                          </Grid>
                          <Divider sx={{ mt: 1 }} />
                        </Box>
                      ))}
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Speech Components</Typography>
                      {speechComponentCriteria.map((item) => (
                        <Box key={item.id} sx={{ mb: 2 }}>
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={8}>
                              <Typography variant="body2">
                                {item.label}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Rating 
                                name={`${item.id}-team1`}
                                max={5}
                                size="small"
                                sx={{ mb: 1 }}
                                onChange={(event, newValue) => handleTeamRatingChange('team1', item.id, newValue)}
                                value={teamRatings.team1[item.id] || 0}
                              />
                            </Grid>
                          </Grid>
                          <Divider sx={{ mt: 1 }} />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardHeader 
                      title={`${game.team2.name}`}
                      subheader="Opposition Team"
                      sx={{ 
                        background: 'rgba(255, 82, 82, 0.08)', 
                        p: 2,
                        '& .MuiCardHeader-title': { fontWeight: 'bold' } 
                      }}
                    />
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>Team Criteria</Typography>
                      {teamCriteria.map((item) => (
                        <Box key={item.id} sx={{ mb: 2 }}>
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={8}>
                              <Typography variant="body2">
                                {item.label}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Rating 
                                name={`${item.id}-team2`}
                                max={5}
                                size="small"
                                sx={{ mb: 1 }}
                                onChange={(event, newValue) => handleTeamRatingChange('team2', item.id, newValue)}
                                value={teamRatings.team2[item.id] || 0}
                              />
                            </Grid>
                          </Grid>
                          <Divider sx={{ mt: 1 }} />
                        </Box>
                      ))}
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Speech Components</Typography>
                      {speechComponentCriteria.map((item) => (
                        <Box key={item.id} sx={{ mb: 2 }}>
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={8}>
                              <Typography variant="body2">
                                {item.label}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Rating 
                                name={`${item.id}-team2`}
                                max={5}
                                size="small"
                                sx={{ mb: 1 }}
                                onChange={(event, newValue) => handleTeamRatingChange('team2', item.id, newValue)}
                                value={teamRatings.team2[item.id] || 0}
                              />
                            </Grid>
                          </Grid>
                          <Divider sx={{ mt: 1 }} />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Winner Selection
          </Typography>
          <Card elevation={2}>
            <CardContent>
              <RadioGroup
                value={winningTeam || ''}
                onChange={(e) => handleDeclareWinner(e.target.value)}
              >
                <FormControlLabel 
                  value={game.team1.id} 
                  control={<Radio color="primary" />} 
                  label={
                    <Box sx={{ 
                      py: 1, 
                      px: 2, 
                      bgcolor: 'rgba(63, 81, 181, 0.08)',
                      borderRadius: 1,
                      fontWeight: winningTeam === game.team1.id ? 'bold' : 'normal'
                    }}>
                      {game.team1.name} (Government)
                    </Box>
                  }
                  sx={{ mb: 1 }}
                />
                <FormControlLabel 
                  value={game.team2.id} 
                  control={<Radio color="secondary" />} 
                  label={
                    <Box sx={{ 
                      py: 1, 
                      px: 2, 
                      bgcolor: 'rgba(255, 82, 82, 0.08)',
                      borderRadius: 1,
                      fontWeight: winningTeam === game.team2.id ? 'bold' : 'normal'
                    }}>
                      {game.team2.name} (Opposition)
                    </Box>
                  }
                />
              </RadioGroup>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowConfirmDialog(true)}
            disabled={!winningTeam}
          >
            Submit Evaluation
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle>Confirm Evaluation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit this evaluation? You won't be able to modify it afterwards.
            {winningTeam && (
              <>
                <br /><br />
                Winner: <strong>{winningTeam === game.team1.id ? game.team1.name : game.team2.name}</strong>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitEvaluation} color="primary" variant="contained">
            Confirm & Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApfJudgeEvaluation;