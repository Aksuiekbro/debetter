// Socket.io service for real-time updates
const socketIO = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.initialized = false;
  }

  // Initialize the socket service with an existing Socket.IO instance
  initialize(io) {
    if (this.initialized) {
      return this.io;
    }

    this.io = io;

    // Set up connection event handler
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Handle joining tournament room
      socket.on('join:tournament', ({ tournamentId }) => {
        if (!tournamentId) return;

        const roomName = `tournament:${tournamentId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
      });

      // Handle leaving tournament room
      socket.on('leave:tournament', ({ tournamentId }) => {
        if (!tournamentId) return;

        const roomName = `tournament:${tournamentId}`;
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room: ${roomName}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    this.initialized = true;
    return this.io;
  }

  // Emit an event to all clients in a tournament room
  emitToTournament(tournamentId, event, data) {
    if (!this.io || !tournamentId) {
      return;
    }

    const roomName = `tournament:${tournamentId}`;
    this.io.to(roomName).emit(event, data);
    console.log(`Emitted ${event} to room ${roomName}`);
  }

  // Emit an announcement created event
  emitAnnouncementCreated(tournamentId, announcement) {
    this.emitToTournament(tournamentId, 'announcement:created', { announcement });
  }

  // Emit an announcement updated event
  emitAnnouncementUpdated(tournamentId, announcement) {
    this.emitToTournament(tournamentId, 'announcement:updated', { announcement });
  }

  // Emit an announcement deleted event
  emitAnnouncementDeleted(tournamentId, announcementId) {
    this.emitToTournament(tournamentId, 'announcement:deleted', { announcementId });
  }

  // Emit a comment created event
  emitCommentCreated(tournamentId, announcementId, comment) {
    this.emitToTournament(tournamentId, 'comment:created', { announcementId, comment });
  }

  // Emit a comment deleted event
  emitCommentDeleted(tournamentId, announcementId, commentId) {
    this.emitToTournament(tournamentId, 'comment:deleted', { announcementId, commentId });
  }
}

// Create a singleton instance
const socketService = new SocketService();

module.exports = socketService;
