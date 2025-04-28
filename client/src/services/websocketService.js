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

  // Initialize the service (connection logic removed)
  initialize() {
    // Connection logic previously here is now removed as components
    // should use the authenticated socket from SocketContext.
    console.warn('WebSocketService.initialize() called, but connection logic is removed. Use SocketContext instead.');
    if (this.socket) {
      // If a socket somehow still exists, disconnect it.
      this.disconnect();
    }
  }

  // Join a tournament room to receive updates for that tournament
  joinTournament(tournamentId) {
    // This method should no longer be used. Use socket from context.
    console.warn('WebSocketService.joinTournament() called. Use socket.emit("join:tournament", ...) from SocketContext instead.');
    // if (!this.socket) {
    //   this.initialize(); // Avoid re-initializing
    // }
    // this.socket.emit('join:tournament', { tournamentId }); // Removed
    // console.log(`Joined tournament room: ${tournamentId}`); // Removed
  }

  // Leave a tournament room
  leaveTournament(tournamentId) {
    // This method should no longer be used. Use socket from context.
    console.warn('WebSocketService.leaveTournament() called. Use socket.emit("leave:tournament", ...) from SocketContext instead.');
    // if (!this.socket) {
    //   return; // Removed
    // }
    // this.socket.emit('leave:tournament', { tournamentId }); // Removed
    // console.log(`Left tournament room: ${tournamentId}`); // Removed
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
