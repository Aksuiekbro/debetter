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
  Grid,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MicIcon from '@mui/icons-material/Mic';
import CloseIcon from '@mui/icons-material/Close';

const ApfJudgeEvaluation = ({ 
  game, 
  onClose, 
  onSubmitEvaluation 
}) => {
  const [recording, setRecording] = useState(false);
  const [winningTeam, setWinningTeam] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  const handleSubmitEvaluation = () => {
    // Check if a winner has been selected
    if (!winningTeam) {
      alert('Please select a winning team before submitting');
      return;
    }

    // Close the confirmation dialog
    setShowConfirmDialog(false);
    
    // Call the parent's callback with evaluation data
    onSubmitEvaluation({
      gameId: game.id,
      winningTeamId: winningTeam,
      // In a real implementation, you'd include scores and other evaluation metrics
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

  return (
    <>
      <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
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
            color={recording ? "error" : "primary"}
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

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>
          Evaluation Table
        </Typography>
        
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell 
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.criteria}</TableCell>
                  <TableCell align="center">
                    {row.scores.leader_gov}
                  </TableCell>
                  <TableCell align="center">
                    {row.scores.leader_opp}
                  </TableCell>
                  <TableCell align="center">
                    {row.scores.speaker_gov}
                  </TableCell>
                  <TableCell align="center">
                    {row.scores.speaker_opp}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
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
                  control={<Radio />} 
                  label={`${game.team1.name} (Government)`} 
                />
                <FormControlLabel 
                  value={game.team2.id} 
                  control={<Radio />} 
                  label={`${game.team2.name} (Opposition)`} 
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