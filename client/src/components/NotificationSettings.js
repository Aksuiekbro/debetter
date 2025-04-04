import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    FormGroup,
    FormControlLabel,
    Switch,
    Button,
    CircularProgress,
    Alert,
    Paper,
    Snackbar
} from '@mui/material';
import { api } from '../config/api'; // Assuming api client is configured here
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const NotificationSettings = () => {
    const { t } = useTranslation();
    const { getAuthHeaders } = useAuth(); // Assuming getAuthHeaders provides { Authorization: `Bearer ${token}` }

    // Define the structure based on the User model
    const initialSettingsState = {
        friend_request_sent: true,
        friend_request_accepted: true,
        game_assignment: true,
        evaluation_submitted: true,
        system_alert: true,
        new_message: true,
    };

    const [settings, setSettings] = useState(initialSettingsState);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.client.get('/api/users/me/notification-settings', { headers: getAuthHeaders() });
            // Ensure all keys from initial state are present, even if not returned by API
            const fetchedSettings = { ...initialSettingsState, ...response.data };
            setSettings(fetchedSettings);
        } catch (err) {
            console.error("Error fetching notification settings:", err);
            setError(t('notificationSettings.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders, t]); // Added t to dependencies

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleChange = (event) => {
        setSettings({
            ...settings,
            [event.target.name]: event.target.checked,
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await api.client.put('/api/users/me/notification-settings', settings, { headers: getAuthHeaders() });
            setSuccessMessage(t('notificationSettings.saveSuccess'));
            setSnackbarOpen(true);
        } catch (err) {
            console.error("Error saving notification settings:", err);
            setError(t('notificationSettings.saveError'));
            setSnackbarOpen(true);
             // Optionally revert settings on error, or allow user to retry
            // fetchSettings(); // Re-fetch to revert changes
        } finally {
            setSaving(false);
        }
    };

     const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    // Get the keys from the initial state to dynamically render switches
    const settingKeys = Object.keys(initialSettingsState);

    return (
        <Paper elevation={3} sx={{ p: 3, maxWidth: 600, margin: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom component="div">
                {t('notificationSettings.title')}
            </Typography>

            {loading ? (
                <Box display="flex" justifyContent="center" my={3}>
                    <CircularProgress />
                </Box>
            ) : (
                <FormGroup>
                    {settingKeys.map((key) => (
                         <FormControlLabel
                            key={key}
                            control={
                                <Switch
                                    checked={settings[key]}
                                    onChange={handleChange}
                                    name={key}
                                    disabled={saving} // Disable while saving
                                />
                            }
                            label={t(`notificationSettings.${key}`)} // Use keys for translation
                        />
                    ))}
                </FormGroup>
            )}

            <Box mt={3} display="flex" justifyContent="flex-end" alignItems="center">
                 {saving && <CircularProgress size={24} sx={{ mr: 2 }} />}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={loading || saving} // Disable if loading or saving
                >
                    {t('notificationSettings.saveButton')}
                </Button>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"} sx={{ width: '100%' }}>
                    {error || successMessage}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default NotificationSettings;