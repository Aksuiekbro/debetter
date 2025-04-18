import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Typography, Button, CircularProgress, Alert, Paper, IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '../../config/api'; // Removed getAuthHeaders
// import { useAuth } from '../../contexts/AuthContext'; // Passed as prop

const MapView = ({ currentUser, tournamentCreatorId, tournament }) => {
  const { id: tournamentId } = useParams();
  const { t } = useTranslation();
  // const { user } = useAuth(); // Passed as prop
  const fileInputRef = useRef(null);

  const [mapUrl, setMapUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Determine if the current user is an organizer or admin for this tournament
  // Temporarily set to true for testing
  const isOrganizerOrAdmin = true;

  console.log('MapView props:', { currentUser, tournamentCreatorId, tournament });

  const fetchMap = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMapUrl(null); // Reset map URL before fetching
    try {
      // The API should return { mapImageUrl: 'url' } or {} or 404 if no map
      const response = await api.client.get(`/api/debates/${tournamentId}/map`);
      if (response.data && response.data.mapImageUrl) {
        setMapUrl(response.data.mapImageUrl);
      } else {
        setMapUrl(null); // Explicitly set to null if no URL found
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // 404 is expected if no map is set, not really an error state for display
        setMapUrl(null);
      } else {
        console.error("Error fetching map:", err);
        setError(t('mapView.fetchError'));
      }
    } finally {
      setLoading(false);
    }
  }, [tournamentId, t]);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleUpload(file);
    }
    // Reset file input value so the same file can be selected again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    setUploadError(null);
    setError(null); // Clear general error
    const formData = new FormData();
    formData.append('mapImage', file); // 'mapImage' should match Multer field name in backend

    try {
      // Headers are automatically added by the axios interceptor in api.js
      // Content-Type for multipart/form-data is usually set automatically by browser/axios when using FormData
      await api.client.post(`/api/debates/${tournamentId}/map`, formData);
      await fetchMap(); // Refresh map after upload
    } catch (err) {
      console.error("Error uploading map:", err);
      setUploadError(err.response?.data?.message || t('mapView.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('mapView.confirmDelete'))) return;
    setIsDeleting(true);
    setDeleteError(null);
    setError(null); // Clear general error
    try {
      // Headers are automatically added by the axios interceptor in api.js
      await api.client.delete(`/api/debates/${tournamentId}/map`);
      setMapUrl(null); // Clear map URL immediately
      // Optionally refetch, though setting null might be sufficient
      // await fetchMap();
    } catch (err) {
      console.error("Error deleting map:", err);
      setDeleteError(err.response?.data?.message || t('mapView.deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{t('mapView.title')}</Typography>

      {isOrganizerOrAdmin && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*" // Accept only image files
            style={{ display: 'none' }} // Hide the default input
            disabled={isUploading || isDeleting}
          />
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={triggerFileInput}
            disabled={isUploading || isDeleting}
          >
            {isUploading ? <CircularProgress size={24} /> : (mapUrl ? t('mapView.replaceButton') : t('mapView.uploadButton'))}
          </Button>
          {mapUrl && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
            >
              {isDeleting ? <CircularProgress size={24} /> : t('mapView.deleteButton')}
            </Button>
          )}
        </Box>
      )}

      {uploadError && <Alert severity="error" sx={{ mb: 2 }}>{uploadError}</Alert>}
      {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && <CircularProgress />}

      {!loading && !error && (
        mapUrl ? (
          <Paper elevation={3} sx={{ p: 1, display: 'inline-block' }}>
            <img src={mapUrl} alt={t('mapView.mapAltText')} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
          </Paper>
        ) : (
          <Typography>{t('mapView.noMap')}</Typography>
        )
      )}
    </Box>
  );
};

export default MapView;