import { io } from 'socket.io-client';
import { api } from '../config/api';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = {
      'announcement:created': [],
      'announcement:updated': [],
      'announcement:deleted': [],
      'comment:created': [],
      'comment:deleted': []
    };
  }

  // Initialize the socket connection
  initialize() {
    if (this.socket) {
      return;
    }

    // Get the base URL from the API config
    const baseURL = api.baseUrl || 'http://localhost:5001';

    // Create socket connection
    this.socket = io(baseURL, {
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: true
    });

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Set up event listeners for announcements
    this.socket.on('announcement:created', (data) => {
      this.notifyListeners('announcement:created', data);
    });

    this.socket.on('announcement:updated', (data) => {
      this.notifyListeners('announcement:updated', data);
    });

    this.socket.on('announcement:deleted', (data) => {
      this.notifyListeners('announcement:deleted', data);
    });

    // Set up event listeners for comments
    this.socket.on('comment:created', (data) => {
      this.notifyListeners('comment:created', data);
    });

    this.socket.on('comment:deleted', (data) => {
      this.notifyListeners('comment:deleted', data);
    });
  }

  // Join a tournament room to receive updates for that tournament
  joinTournament(tournamentId) {
    if (!this.socket) {
      this.initialize();
    }

    this.socket.emit('join:tournament', { tournamentId });
    console.log(`Joined tournament room: ${tournamentId}`);
  }

  // Leave a tournament room
  leaveTournament(tournamentId) {
    if (!this.socket) {
      return;
    }

    this.socket.emit('leave:tournament', { tournamentId });
    console.log(`Left tournament room: ${tournamentId}`);
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
    return () => this.removeEventListener(event, callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (!this.listeners[event]) {
      return;
    }

    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    if (!this.listeners[event]) {
      return;
    }

    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Disconnect the socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService;
