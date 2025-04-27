import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../config/api'; // Use named export for api config
import axios from 'axios'; // Need axios to fetch initial notifications

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchInitialNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${api.baseUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching initial notifications:', error);
      // Handle error appropriately
    }
  }, [token]);

  useEffect(() => {
    let newSocket = null;

    // Only attempt connection if we have a token AND user is marked as authenticated
    if (isAuthenticated && token) {
        console.log('SocketContext: Attempting connection with token.'); // Add log
        newSocket = io(api.baseUrl, { // Use api.baseUrl from config
            auth: { token },
            transports: ['websocket', 'polling'] // Explicitly define transports
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);
            setSocket(newSocket); // Set socket state *after* successful connection
            fetchInitialNotifications(); // Fetch notifications on connect
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            setSocket(null); // Clear socket state on disconnect
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
            // Optionally attempt to reconnect or notify the user
        });

        newSocket.on('new_notification', (notification) => {
            console.log('New notification received:', notification);
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        // No need to set socket here, it's done in 'connect' handler

    } else {
         console.log('SocketContext: Conditions not met for connection (isAuthenticated:', isAuthenticated, 'token exists:', !!token, ')'); // Add log
        // Ensure disconnection if conditions are not met and an old socket exists
        if (socket) {
             console.log('SocketContext: Disconnecting existing socket.'); // Add log
            socket.disconnect();
            setIsConnected(false); // Ensure connection state is false
            setSocket(null); // Clear socket state
            setNotifications([]); // Clear notifications on logout/disconnect
            setUnreadCount(0); // Reset unread count
        }
    }

    // Cleanup function
    return () => {
        // Use the 'newSocket' variable captured in the effect's scope for cleanup
        if (newSocket) {
            console.log('SocketContext: Cleaning up new socket connection.'); // Add log
            newSocket.off('connect');
            newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.off('new_notification');
        newSocket.disconnect();
        }
        // No need for the 'else if (socket)' fallback here,
        // as the disconnection logic in the main 'else' block handles the case
        // where conditions are not met and an 'old' socket exists.
        // The cleanup should primarily focus on the 'newSocket' created within this effect instance.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, fetchInitialNotifications]); // Keep dependencies

  // Function to mark notifications as read (example)
  const markAsRead = useCallback(async (notificationIds) => {
    if (!socket || !token) return;
    try {
      // Example API call - adjust endpoint and payload as needed
      await axios.post(`${api.baseUrl}/api/notifications/mark-read`, { ids: notificationIds }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state optimistically or after confirmation
      setNotifications(prev =>
        prev.map(n => notificationIds.includes(n._id) ? { ...n, read: true } : n)
      );
      // Recalculate unread count based on the updated notifications array
      setUnreadCount(prev => prev - notificationIds.length); // Adjust count based on how many were marked read

    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [socket, token]);

  const contextValue = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead, // Expose markAsRead function
    fetchInitialNotifications // Expose fetch function if needed elsewhere
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};