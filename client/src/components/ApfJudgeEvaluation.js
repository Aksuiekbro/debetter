import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      alert(t('apfEvaluation.selectWinnerAlert', 'Please select a winning team before submitting'));
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
    { id: 'criteria', label: t('apfEvaluation.criteriaHeader', 'Criteria') }, // Added key for table header
    { id: 'leader_gov', label: t('apfEvaluation.roleLeaderGovTime', 'Leader Gov (14 min)'), align: 'center' }, // Added key
    { id: 'leader_opp', label: t('apfEvaluation.roleLeaderOppTime', 'Leader Opp (14 min)'), align: 'center' }, // Added key
    { id: 'speaker_gov', label: t('apfEvaluation.roleSpeakerGovTime', 'Speaker Gov (14 min)'), align: 'center' }, // Added key
    { id: 'speaker_opp', label: t('apfEvaluation.roleSpeakerOppTime', 'Speaker Opp (14 min)'), align: 'center' } // Added key
  ];

  // Example criteria rows for the evaluation table
  const rows = [
    { id: 'content', criteria: t('apfEvaluation.criteriaContentArgs', 'Content & Arguments'), scores: { leader_gov: '', leader_opp: '', speaker_gov: '', speaker_opp: '' } }, // Added key
    { id: 'style', criteria: t('apfEvaluation.criteriaStyleDelivery', 'Style & Delivery'), scores: { leader_gov: '', leader_opp: '', speaker_gov: '', speaker_opp: '' } }, // Added key
    { id: 'strategy', criteria: t('apfEvaluation.criteriaStrategy', 'Strategy'), scores: { leader_gov: '', leader_opp: '', speaker_gov: '', speaker_opp: '' } }, // Added key
    { id: 'total', criteria: t('apfEvaluation.criteriaTotalScore', 'Total Score'), scores: { leader_gov: '', leader_opp: '', speaker_gov: '', speaker_opp: '' } }, // Added key
  ];

  // Speaker evaluation criteria based on roles
  const leaderCriteria = [
    { id: 'clarity', label: t('apfEvaluation.criteriaLeaderClarity', 'Clarity of definition/framing') },
    { id: 'construction', label: t('apfEvaluation.criteriaLeaderConstruction', 'Argument construction') },
    { id: 'responsiveness', label: t('apfEvaluation.criteriaLeaderResponsiveness', 'Responsiveness to opponent') },
    { id: 'strategic', label: t('apfEvaluation.criteriaLeaderStrategic', 'Strategic positioning') },
    { id: 'delivery', label: t('apfEvaluation.criteriaLeaderDelivery', 'Delivery and oratory') }
  ];

  const speakerCriteria = [
    { id: 'refutation', label: t('apfEvaluation.criteriaSpeakerRefutation', 'Refutation/rebuilding') },
    { id: 'analysis', label: t('apfEvaluation.criteriaSpeakerAnalysis', 'New analysis/depth') },
    { id: 'engagement', label: t('apfEvaluation.criteriaSpeakerEngagement', 'Engagement and structure') },
    { id: 'timeManagement', label: t('apfEvaluation.criteriaSpeakerTimeMgmt', 'Time management & structure') },
    { id: 'framing', label: t('apfEvaluation.criteriaSpeakerFraming', 'Framing and clarity') }
  ];

  // Team evaluation criteria
  const teamCriteria = [
    { id: 'argumentStrength', label: t('apfEvaluation.criteriaTeamArgStrength', 'Argument strength') },
    { id: 'refutation', label: t('apfEvaluation.criteriaTeamRefutation', 'Refutation/Clash') },
    { id: 'weighting', label: t('apfEvaluation.criteriaTeamWeighting', 'Weighting and impact') },
    { id: 'teamCohesion', label: t('apfEvaluation.criteriaTeamCohesion', 'Team cohesion') },
    { id: 'structure', label: t('apfEvaluation.criteriaTeamStructure', 'Structure and organization') },
    { id: 'delivery', label: t('apfEvaluation.criteriaTeamDelivery', 'Delivery') },
    { id: 'visual', label: t('apfEvaluation.criteriaTeamVisuals', 'Visuals/body language') },
    { id: 'ruleObedience', label: t('apfEvaluation.criteriaTeamRules', 'Rule obedience') }
  ];

  // Speech component criteria
  const speechComponentCriteria = [
    { id: 'constructiveSpeech', label: t('apfEvaluation.criteriaSpeechConstructive', 'Constructive speech') },
    { id: 'rebuttalSpeech', label: t('apfEvaluation.criteriaSpeechRebuttal', 'Rebuttal speech') },
    { id: 'crossExamination', label: t('apfEvaluation.criteriaSpeechCrossExam', 'Cross examination') },
    { id: 'useOfEvidence', label: t('apfEvaluation.criteriaSpeechEvidence', 'Use of evidence') }
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
      if (!leader) return t('apfEvaluation.roleLeaderGov', 'Leader Gov');
      
      // Log the leader object to debug its structure
      console.log('Leader Gov object:', leader);
      
      // If leader is a string, return it
      if (typeof leader === 'string') return leader;
      
      // If leader is an object with name property, return the name
      if (leader && typeof leader === 'object') {
        // Return the name directly if available
        if (leader.name) return leader.name;
        
        // For UI display, we prioritize showing the actual person's name
        return t('apfEvaluation.roleLeaderGov', 'Leader Gov');
      }
      
      return t('apfEvaluation.roleLeaderGov', 'Leader Gov');
    }
    
    if (role === 'speaker_gov') {
      // Team 1 speaker
      const speaker = game.team1.speaker;
      if (!speaker) return t('apfEvaluation.roleSpeakerGov', 'Speaker Gov');
      
      // Log the speaker object to debug its structure
      console.log('Speaker Gov object:', speaker);
      
      // If speaker is a string, return it
      if (typeof speaker === 'string') return speaker;
      
      // If speaker is an object with name property, return the name
      if (speaker && typeof speaker === 'object') {
        // Return the name directly if available
        if (speaker.name) return speaker.name;
        
        // For UI display, we prioritize showing the actual person's name
        return t('apfEvaluation.roleSpeakerGov', 'Speaker Gov');
      }
      
      return t('apfEvaluation.roleSpeakerGov', 'Speaker Gov');
    }
    
    if (role === 'leader_opp') {
      // Team 2 leader
      const leader = game.team2.leader;
      if (!leader) return t('apfEvaluation.roleLeaderOpp', 'Leader Opp');
      
      // Log the leader object to debug its structure
      console.log('Leader Opp object:', leader);
      
      // If leader is a string, return it
      if (typeof leader === 'string') return leader;
      
      // If leader is an object with name property, return the name
      if (leader && typeof leader === 'object') {
        // Return the name directly if available
        if (leader.name) return leader.name;
        
        // For UI display, we prioritize showing the actual person's name
        return t('apfEvaluation.roleLeaderOpp', 'Leader Opp');
      }
      
      return t('apfEvaluation.roleLeaderOpp', 'Leader Opp');
    }
    
    if (role === 'speaker_opp') {
      // Team 2 speaker
      const speaker = game.team2.speaker;
      if (!speaker) return t('apfEvaluation.roleSpeakerOpp', 'Speaker Opp');
      
      // Log the speaker object to debug its structure
      console.log('Speaker Opp object:', speaker);
      
      // If speaker is a string, return it
      if (typeof speaker === 'string') return speaker;
      
      // If speaker is an object with name property, return the name
      if (speaker && typeof speaker === 'object') {
        // Return the name directly if available
        if (speaker.name) return speaker.name;
        
        // For UI display, we prioritize showing the actual person's name
        return t('apfEvaluation.roleSpeakerOpp', 'Speaker Opp');
      }
      
      return t('apfEvaluation.roleSpeakerOpp', 'Speaker Opp');
    }
    
    return t('apfEvaluation.roleUnknownSpeaker', 'Unknown Speaker');
  };

  // Helper function to get speaker role title
  const getSpeakerRole = (role) => {
    if (role.includes('leader')) return t('apfEvaluation.roleLeader', 'Leader');
    if (role.includes('speaker')) return t('apfEvaluation.roleSpeaker', 'Speaker');
    return t('apfEvaluation.roleUnknownRole', 'Unknown Role');
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
          {t('apfEvaluation.title', 'APF Debate Evaluation')}
        </Typography>
        
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>{t('apfEvaluation.teamsLabel', 'Teams:')}</strong> {game.team1.name} vs {game.team2.name}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>{t('apfEvaluation.locationLabel', 'Location:')}</strong> {game.location}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>{t('apfEvaluation.timeLabel', 'Time:')}</strong> {new Date(game.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Typography variant="subtitle1">
                  <strong>{t('apfEvaluation.themeLabel', 'Theme:')}</strong> {game.theme}
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
            {recording ? t('apfEvaluation.stopRecordingButton', 'Stop Recording') : t('apfEvaluation.startRecordingButton', 'Start')}
          </Button>
        </Box>
        
        {recording && (
          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mb: 2 }}>
            {t('apfEvaluation.recordingInProgress', 'Recording in progress... Audio will be transcribed automatically.')}
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
            <Tab label={t('apfEvaluation.tabTranscription', 'Debate Transcription')} />
            <Tab label={t('apfEvaluation.tabSpeakerEval', 'Speaker Evaluation')} />
            <Tab label={t('apfEvaluation.tabTeamAssessment', 'Team Assessment ({{team1}} vs {{team2}})', { team1: game.team1.name, team2: game.team2.name })} />
          </Tabs>

          {/* Evaluation Table Tab */}
          <Box role="tabpanel" hidden={tabValue !== 0} sx={{ mt: 2 }}>
            {tabValue === 0 && (
              <>
                <Card elevation={2} sx={{ mb: 4 }}>
                  <CardHeader title={t('apfEvaluation.transcriptionTitle', 'Speech Transcription')} sx={{ background: 'rgba(0, 0, 0, 0.03)', p: 2 }} />
                  <CardContent>
                    <Grid container spacing={2}>
                      {Object.entries(transcriptions).map(([speaker, text]) => (
                        <Grid item xs={12} key={speaker}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {getSpeakerName(speaker)} ({getSpeakerRole(speaker)} - {speaker.includes('gov') ? `${game.team1.name} ${t('apfEvaluation.teamGov', '(Government)')}` : `${game.team2.name} ${t('apfEvaluation.teamOpp', '(Opposition)')}`}):
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, minHeight: '60px', bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
                            <Typography variant="body2">
                              {text || t('apfEvaluation.noTranscription', 'No speech transcribed yet...')}
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
                        subheader={`${speakerRole.includes('gov') ? `${game.team1.name} ${t('apfEvaluation.teamGov', '(Government)')}` : `${game.team2.name} ${t('apfEvaluation.teamOpp', '(Opposition)')}`}`}
                        sx={{ background: speakerRole.includes('gov') ? 'rgba(63, 81, 181, 0.08)' : 'rgba(255, 82, 82, 0.08)', p: 2 }}
                      />
                      <CardContent>
                        {getCriteriaForRole(speakerRole).map((criterion) => (
                          <Box key={criterion.id} sx={{ mb: 2 }}>
                            <Grid container alignItems="center" spacing={1}>
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  {t(criterion.label, criterion.label)} {/* Use label as key and default */}
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
                          {t('apfEvaluation.speakerFeedbackLabel', 'Overall Speaker Feedback')}
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          variant="outlined"
                          placeholder={t('apfEvaluation.speakerFeedbackPlaceholder', 'Enter feedback for this speaker...')}
                          value={speakerFeedback[speakerRole]}
                          onChange={(e) => setSpeckerFeedback(prev => ({
                            ...prev,
                            [speakerRole]: e.target.value
                          }))}
                          size="small"
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography variant="subtitle2">
                            {t('apfEvaluation.totalPointsLabel', 'Total Points:')}
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
                      subheader={t('apfEvaluation.govTeamSubheader', 'Government Team')}
                      sx={{ 
                        background: 'rgba(63, 81, 181, 0.08)', 
                        p: 2,
                        '& .MuiCardHeader-title': { fontWeight: 'bold' } 
                      }}
                    />
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>{t('apfEvaluation.teamCriteriaTitle', 'Team Criteria')}</Typography>
                      {teamCriteria.map((item) => (
                        <Box key={item.id} sx={{ mb: 2 }}>
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={8}>
                              <Typography variant="body2">
                                {t(item.label, item.label)} {/* Use label as key and default */}
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
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>{t('apfEvaluation.speechComponentsTitle', 'Speech Components')}</Typography>
                      {speechComponentCriteria.map((item) => (
                        <Box key={item.id} sx={{ mb: 2 }}>
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={8}>
                              <Typography variant="body2">
                                {t(item.label, item.label)} {/* Use label as key and default */}
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
                      subheader={t('apfEvaluation.oppTeamSubheader', 'Opposition Team')}
                      sx={{ 
                        background: 'rgba(255, 82, 82, 0.08)', 
                        p: 2,
                        '& .MuiCardHeader-title': { fontWeight: 'bold' } 
                      }}
                    />
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>{t('apfEvaluation.teamCriteriaTitle', 'Team Criteria')}</Typography>
                      {teamCriteria.map((item) => (
                        <Box key={item.id} sx={{ mb: 2 }}>
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={8}>
                              <Typography variant="body2">
                                {t(item.label, item.label)} {/* Use label as key and default */}
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
                      
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>{t('apfEvaluation.speechComponentsTitle', 'Speech Components')}</Typography>
                      {speechComponentCriteria.map((item) => (
                        <Box key={item.id} sx={{ mb: 2 }}>
                          <Grid container alignItems="center" spacing={1}>
                            <Grid item xs={8}>
                              <Typography variant="body2">
                                {t(item.label, item.label)} {/* Use label as key and default */}
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
            {t('apfEvaluation.winnerSelectionTitle', 'Winner Selection')}
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
                      {`${game.team1.name} ${t('apfEvaluation.teamGov', '(Government)')}`}
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
                      {`${game.team2.name} ${t('apfEvaluation.teamOpp', '(Opposition)')}`}
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
            {t('apfEvaluation.cancelButton', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowConfirmDialog(true)}
            disabled={!winningTeam}
          >
            {t('apfEvaluation.submitButton', 'Submit Evaluation')}
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle>{t('apfEvaluation.confirmDialogTitle', 'Confirm Evaluation')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('apfEvaluation.confirmDialogText', "Are you sure you want to submit this evaluation? You won't be able to modify it afterwards.")}
            {winningTeam && (
              <>
                <br /><br />
                {t('apfEvaluation.confirmDialogWinnerLabel', 'Winner:')} <strong>{winningTeam === game.team1.id ? game.team1.name : game.team2.name}</strong>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>{t('apfEvaluation.confirmDialogCancelButton', 'Cancel')}</Button>
          <Button onClick={handleSubmitEvaluation} color="primary" variant="contained">
            {t('apfEvaluation.confirmDialogSubmitButton', 'Confirm & Submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApfJudgeEvaluation;