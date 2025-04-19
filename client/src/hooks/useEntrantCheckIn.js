import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing entrant check-in/check-out functionality
 * @param {Function} refreshData - Function to refresh tournament data
 * @param {Function} showNotification - Function to show notifications
 * @returns {Object} - Functions for checking in/out entrants
 */
export const useEntrantCheckIn = (refreshData, showNotification) => {
  const { tournamentId } = useParams();
  const { user } = useAuth();

  /**
   * Check in an entrant
   * @param {string} entrantId - The ID of the entrant to check in
   */
  const checkInEntrant = useCallback(async (entrantId) => {
    if (!user?.token || !tournamentId) {
      showNotification('Authentication error or missing tournament ID.', 'error');
      return;
    }

    try {
      await api.client.post(
        `/api/debates/${tournamentId}/entrants/${entrantId}/check-in`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      showNotification('Entrant checked in successfully', 'success');
      refreshData(); // Refresh the tournament data to show the updated status
    } catch (error) {
      console.error('Error checking in entrant:', error);
      const errorMsg = error.response?.data?.message || 'Failed to check in entrant';
      showNotification(errorMsg, 'error');
    }
  }, [tournamentId, user?.token, showNotification, refreshData]);

  /**
   * Check out an entrant
   * @param {string} entrantId - The ID of the entrant to check out
   */
  const checkOutEntrant = useCallback(async (entrantId) => {
    if (!user?.token || !tournamentId) {
      showNotification('Authentication error or missing tournament ID.', 'error');
      return;
    }

    try {
      await api.client.post(
        `/api/debates/${tournamentId}/entrants/${entrantId}/check-out`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      showNotification('Entrant checked out successfully', 'success');
      refreshData(); // Refresh the tournament data to show the updated status
    } catch (error) {
      console.error('Error checking out entrant:', error);
      const errorMsg = error.response?.data?.message || 'Failed to check out entrant';
      showNotification(errorMsg, 'error');
    }
  }, [tournamentId, user?.token, showNotification, refreshData]);

  return {
    checkInEntrant,
    checkOutEntrant
  };
};
