import { useState, useCallback } from 'react';

export const useTournamentUIManager = (initialTab = 0) => {
  const [tabValue, setTabValue] = useState(initialTab);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success', 'error', 'warning', 'info'
  });

  const handleTabChange = useCallback((event, newValue) => {
    setTabValue(newValue);
  }, []);

  const showNotification = useCallback((message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  }, []);

  const closeNotification = useCallback((event, reason) => {
    // Prevent closing on click away if needed
    // if (reason === 'clickaway') {
    //   return;
    // }
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  return {
    tabValue,
    handleTabChange,
    notification,
    showNotification,
    closeNotification,
  };
};