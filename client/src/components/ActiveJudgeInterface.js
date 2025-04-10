import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, CircularProgress, Alert, Paper, Grid, TextField
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { api } from '../config/api'; // Assuming api client is here
import { getAuthHeaders } from '../utils/auth'; // Assuming auth utils are here

const ActiveJudgeInterface = () => {
  const { t } = useTranslation();
  const { debateId, postingId } = useParams();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // State variables
  const [postingDetails, setPostingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioUploadSuccess, setAudioUploadSuccess] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState(null);
  const [notes, setNotes] = useState(''); // Optional notes field

  // Fetch posting details
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();
        const response = await api.get(`/api/debates/${debateId}/postings/${postingId}`, { headers });
        setPostingDetails(response.data);
      } catch (err) {
        console.error("Error fetching posting details:", err);
        setError(t('activeJudgeInterface.errorFetchingDetails', 'Failed to load debate details. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [debateId, postingId, t]);

  // --- Audio Recording Handlers ---
  const handleStartRecording = async () => {
    setAudioBlob(null);
    setAudioUploadSuccess(false);
    setAudioUploadError(null);
    audioChunksRef.current = []; // Reset chunks

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Adjust mime type if needed
        setAudioBlob(blob);
        // Stop tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setAudioUploadError(t('activeJudgeInterface.micError', 'Could not access microphone. Please check permissions.'));
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUploadAudio = async () => {
    if (!audioBlob) return;
    setUploadingAudio(true);
    setAudioUploadSuccess(false);
    setAudioUploadError(null);

    const formData = new FormData();
    formData.append('audio', audioBlob, `debate_${debateId}_posting_${postingId}_recording.webm`); // Example filename

    try {
      const headers = getAuthHeaders();
      await api.post(`/api/debates/${debateId}/postings/${postingId}/audio`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      setAudioUploadSuccess(true);
      setAudioBlob(null); // Clear blob after successful upload
    } catch (err) {
      console.error("Error uploading audio:", err);
      setAudioUploadError(t('activeJudgeInterface.audioUploadError', 'Failed to upload audio. Please try again.'));
    } finally {
      setUploadingAudio(false);
    }
  };

  // --- Photo Upload Handlers ---
  const handlePhotoSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      setPhotoUploadSuccess(false);
      setPhotoUploadError(null);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto) return;
    setUploadingPhoto(true);
    setPhotoUploadSuccess(false);
    setPhotoUploadError(null);

    const formData = new FormData();
    formData.append('ballot', selectedPhoto, `debate_${debateId}_posting_${postingId}_ballot.${selectedPhoto.name.split('.').pop()}`);

    try {
      const headers = getAuthHeaders();
      await api.post(`/api/debates/${debateId}/postings/${postingId}/ballot`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      setPhotoUploadSuccess(true);
      setSelectedPhoto(null); // Clear selected photo after successful upload
    } catch (err) {
      console.error("Error uploading ballot photo:", err);
      setPhotoUploadError(t('activeJudgeInterface.photoUploadError', 'Failed to upload ballot photo. Please try again.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // --- Render Logic ---
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (!postingDetails) {
    return <Alert severity="warning" sx={{ mt: 2 }}>{t('activeJudgeInterface.noDetails', 'Debate details not found.')}</Alert>;
  }

  // Safely access nested properties
  const govTeamName = postingDetails.debate?.govTeam?.name || t('common.tbd', 'TBD');
  const oppTeamName = postingDetails.debate?.oppTeam?.name || t('common.tbd', 'TBD');
  const theme = postingDetails.debate?.theme?.theme || t('common.notSet', 'Not Set');
  const time = postingDetails.debate?.time ? new Date(postingDetails.debate.time).toLocaleString() : t('common.notSet', 'Not Set');
  const location = postingDetails.debate?.location || t('common.notSet', 'Not Set');

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        {t('activeJudgeInterface.title', 'Active Judging Interface')}
      </Typography>

      <Grid container spacing={3}>
        {/* Debate Details Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>{t('activeJudgeInterface.debateDetails', 'Debate Details')}</Typography>
          <Typography><strong>{t('common.theme', 'Theme/Topic')}:</strong> {theme}</Typography>
          <Typography><strong>{t('common.govTeam', 'Government Team')}:</strong> {govTeamName}</Typography>
          <Typography><strong>{t('common.oppTeam', 'Opposition Team')}:</strong> {oppTeamName}</Typography>
          <Typography><strong>{t('common.time', 'Time')}:</strong> {time}</Typography>
          <Typography><strong>{t('common.location', 'Location')}:</strong> {location}</Typography>
        </Grid>

        {/* Audio Recorder Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>{t('activeJudgeInterface.audioRecording', 'Audio Recording')}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {!isRecording ? (
              <Button
                variant="contained"
                startIcon={<MicIcon />}
                onClick={handleStartRecording}
                disabled={uploadingAudio}
              >
                {t('activeJudgeInterface.startRecording', 'Start Recording')}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<StopIcon />}
                onClick={handleStopRecording}
              >
                {t('activeJudgeInterface.stopRecording', 'Stop Recording')}
              </Button>
            )}
            {isRecording && <CircularProgress size={24} color="secondary" />}
          </Box>
          {audioBlob && !uploadingAudio && !audioUploadSuccess && (
            <Button
              variant="outlined"
              onClick={handleUploadAudio}
              sx={{ mt: 1 }}
            >
              {t('activeJudgeInterface.uploadAudio', 'Upload Recorded Audio')}
            </Button>
          )}
          {uploadingAudio && <CircularProgress size={24} sx={{ mt: 1 }} />}
          {audioUploadSuccess && <Alert severity="success" sx={{ mt: 1 }}>{t('activeJudgeInterface.audioUploadSuccess', 'Audio uploaded successfully!')}</Alert>}
          {audioUploadError && <Alert severity="error" sx={{ mt: 1 }}>{audioUploadError}</Alert>}
        </Grid>

        {/* Ballot Photo Upload Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>{t('activeJudgeInterface.ballotPhoto', 'Ballot Photo')}</Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<PhotoCameraIcon />}
            disabled={uploadingPhoto}
            sx={{ mb: 1 }}
          >
            {t('activeJudgeInterface.selectPhotoButton', 'Select Ballot Photo')}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handlePhotoSelect}
            />
          </Button>
          {selectedPhoto && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('activeJudgeInterface.selectedFile', 'Selected')}: {selectedPhoto.name}
            </Typography>
          )}
          {selectedPhoto && !uploadingPhoto && !photoUploadSuccess && (
            <Button
              variant="outlined"
              onClick={handleUploadPhoto}
              sx={{ mt: 1 }}
            >
              {t('activeJudgeInterface.uploadPhotoButton', 'Upload Photo')}
            </Button>
          )}
          {uploadingPhoto && <CircularProgress size={24} sx={{ mt: 1 }} />}
          {photoUploadSuccess && <Alert severity="success" sx={{ mt: 1 }}>{t('activeJudgeInterface.photoUploadSuccess', 'Ballot photo uploaded successfully!')}</Alert>}
          {photoUploadError && <Alert severity="error" sx={{ mt: 1 }}>{photoUploadError}</Alert>}
        </Grid>

        {/* Optional Notes Section */}
        <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>{t('activeJudgeInterface.notes', 'Notes (Optional)')}</Typography>
            <TextField
                label={t('activeJudgeInterface.notesPlaceholder', 'Enter your notes here...')}
                multiline
                rows={4}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                variant="outlined"
            />
            {/* Add save/autosave logic if needed */}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ActiveJudgeInterface;