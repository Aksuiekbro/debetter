import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, CircularProgress, Alert, Paper, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardMedia, CardActions
} from '@mui/material';
// Removed unused icons: AddIcon, EditIcon, DeleteIcon
// Removed unused components: List, ListItem, ListItemText, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField
import UploadIcon from '@mui/icons-material/Upload'; // Added UploadIcon
import { api } from '../../config/api';

// Assuming currentUser and tournamentCreatorId are used for authorization checks
// Assuming tournament prop contains tournament details including scheduleImageUrl
const ScheduleView = ({ currentUser, tournamentCreatorId, tournament }) => {
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();

  const [pairings, setPairings] = useState([]);
  const [loadingPairings, setLoadingPairings] = useState(true); // Renamed loading state
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [scheduleImageUrl, setScheduleImageUrl] = useState(tournament?.scheduleImageUrl || null); // Initialize from prop

  // Determine if the current user is an organizer or admin for this tournament
  // TODO: Implement proper check based on currentUser roles and tournamentCreatorId
  const isOrganizerOrAdmin = currentUser && (currentUser.role === 'admin' || currentUser._id === tournamentCreatorId);

  console.log('ScheduleView props:', { currentUser, tournamentCreatorId, tournament });

  // Fetch only pairings now
  const fetchPairings = useCallback(async () => {
    setLoadingPairings(true);
    setError(null);
    if (!tournamentId) {
      setError(t('scheduleView.missingIdError'));
      setLoadingPairings(false);
      return;
    }
    try {
      // Fetch published pairings
      const pairingsResponse = await api.client.get(`/api/debates/${tournamentId}/pairings`, {
        params: { published: 'true' }
      });
      setPairings(pairingsResponse.data.data.pairings || []);
    } catch (err) {
      console.error("Error fetching pairings:", err);
      setError(t('scheduleView.fetchPairingsError', 'Failed to fetch pairings.')); // More specific error message
    } finally {
      setLoadingPairings(false);
    }
  }, [tournamentId, t]);

  useEffect(() => {
    fetchPairings();
  }, [fetchPairings]);

  // Update image URL if tournament prop changes
  useEffect(() => {
    setScheduleImageUrl(tournament?.scheduleImageUrl || null);
  }, [tournament?.scheduleImageUrl]);


  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError(t('scheduleView.noFileSelectedError', 'Please select an image file to upload.'));
      return;
    }
    if (!tournamentId) {
        setUploadError(t('scheduleView.missingIdError', 'Tournament ID is missing. Cannot upload schedule.'));
        return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('scheduleImage', selectedFile); // Key must match backend expected key

    try {
      // TODO: Replace with the correct backend endpoint when created
      const response = await api.client.post(`/api/debates/${tournamentId}/schedule-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setScheduleImageUrl(response.data.scheduleImageUrl); // Assume backend returns the new URL
      setUploadSuccess(t('scheduleView.uploadSuccess', 'Schedule image uploaded successfully.'));
      setSelectedFile(null); // Clear selection after successful upload
    } catch (err) {
      console.error("Error uploading schedule image:", err);
      setUploadError(err.response?.data?.message || t('scheduleView.uploadError', 'Failed to upload schedule image.'));
    } finally {
      setUploading(false);
    }
  };


  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t('scheduleView.title', 'Schedule')}</Typography>

      {/* Schedule Image Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>{t('scheduleView.scheduleImageTitle', 'Schedule Image')}</Typography>
        {scheduleImageUrl ? (
          <Card sx={{ maxWidth: '100%', mb: 2 }}>
            <CardMedia
              component="img"
              image={scheduleImageUrl}
              alt={t('scheduleView.scheduleImageAlt', 'Tournament Schedule')}
              sx={{ maxHeight: 600, objectFit: 'contain' }} // Adjust styling as needed
            />
          </Card>
        ) : (
          <Typography sx={{ mb: 2 }}>{t('scheduleView.noScheduleImage', 'No schedule image uploaded yet.')}</Typography>
        )}

        {isOrganizerOrAdmin && (
          <Box>
            <Button
              variant="contained"
              component="label" // Makes the button act like a label for the hidden input
              startIcon={<UploadIcon />}
              disabled={uploading}
              sx={{ mr: 2 }}
            >
              {t('scheduleView.selectImageButton', 'Select Image')}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
            {selectedFile && (
              <Typography component="span" sx={{ mr: 2 }}>
                {selectedFile.name}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? <CircularProgress size={24} /> : t('scheduleView.uploadButton', 'Upload Schedule')}
            </Button>
            {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
            {uploadSuccess && <Alert severity="success" sx={{ mt: 2 }}>{uploadSuccess}</Alert>}
          </Box>
        )}
      </Paper>


      {/* Display published pairings */}
      {loadingPairings && <CircularProgress />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loadingPairings && !error && pairings.length === 0 && (
         <Typography>{t('scheduleView.noPairings', 'No pairings published yet.')}</Typography>
      )}

      {!loadingPairings && !error && pairings.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('scheduleView.pairingsTitle', 'Tournament Pairings')}
          </Typography>

          {/* Group pairings by round and roundType */}
          {Object.entries(pairings.reduce((acc, pairing) => {
            const key = `${pairing.roundType}-${pairing.round}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(pairing);
            return acc;
          }, {})).map(([key, roundPairings]) => {
            const [roundType, round] = key.split('-');
            const roundName = roundType === 'preliminary'
              ? `${t('scheduleView.preliminaryRound', { defaultValue: 'Preliminary Round' })} ${round}`
              : (round === '1' ? t('scheduleView.eighthFinals', { defaultValue: '1/8 Finals' }) :
                 round === '2' ? t('scheduleView.quarterFinals', { defaultValue: 'Quarter Finals' }) :
                 round === '3' ? t('scheduleView.semiFinals', { defaultValue: 'Semi Finals' }) :
                 round === '4' ? t('scheduleView.finals', { defaultValue: 'Finals' }) :
                 `${t('scheduleView.playoffRound', { defaultValue: 'Playoff Round' })} ${round}`);

            return (
              <Paper key={key} sx={{ mb: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {roundName}
                  </Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('scheduleView.team1', { defaultValue: 'Team 1' })}</TableCell>
                        <TableCell>{t('scheduleView.team2', { defaultValue: 'Team 2' })}</TableCell>
                        <TableCell>{t('scheduleView.judge', { defaultValue: 'Judge' })}</TableCell>
                        <TableCell>{t('scheduleView.room', { defaultValue: 'Room' })}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roundPairings.map(pairing => (
                        <TableRow key={pairing._id}>
                          <TableCell>{pairing.team1?.name || t('scheduleView.unknown', { defaultValue: 'Unknown' })}</TableCell>
                          <TableCell>
                            {pairing.isBye
                              ? t('scheduleView.bye', { defaultValue: 'BYE' })
                              : pairing.team2?.name || t('scheduleView.unknown', { defaultValue: 'Unknown' })}
                          </TableCell>
                          <TableCell>
                            {pairing.judges?.length > 0
                              ? pairing.judges[0]?.username || pairing.judges[0]?.name || t('scheduleView.unknown', { defaultValue: 'Unknown' })
                              : t('scheduleView.noJudge', { defaultValue: 'No Judge' })}
                          </TableCell>
                          <TableCell>{pairing.location || t('scheduleView.noRoom', { defaultValue: 'No Room' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Removed manual schedule item list */}

      {/* Removed Create/Edit Dialog */}

    </Box>
  );
};

export default ScheduleView;
