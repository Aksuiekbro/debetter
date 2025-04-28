require('dotenv').config({ path: __dirname + '/.env' }); // Load .env from the api directory
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken'); // <-- Add jsonwebtoken for socket auth
const { setIoInstance, addUserSocket, removeUserSocket } = require('./services/notificationService'); // <-- Import notification service functions
const socketService = require('./services/socketService'); // <-- Import socket service for announcements

const userRoutes = require('./routes/userRoutes');
const debateRoutes = require('./routes/debateRoutes');
const apfRoutes = require('./routes/apfRoutes');
const statsRoutes = require('./routes/statsRoutes');
const tournamentRoutes = require('./routes/tournaments');
const notificationRoutes = require('./routes/notificationRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
require('./models/Team'); // Ensure Team model is registered
require('./models/Tournament'); // Ensure Tournament model is registered

const app = express();
const httpServer = http.createServer(app); // <-- Create HTTP server

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow requests from your frontend
    methods: ["GET", "POST"]
  }
});

// Pass the io instance to the notification service
setIoInstance(io);

// Initialize the socket service with the existing Socket.IO instance
socketService.initialize(io);

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error('Socket Auth Error: No token provided');
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id; // Attach userId to the socket object for later use
    next();
  } catch (err) {
    console.error('Socket Auth Error: Invalid token', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});


// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id}, User ID: ${socket.userId}`);

  // Associate socket with user
  if (socket.userId) {
    addUserSocket(socket.userId, socket.id);
  } else {
    console.error(`Socket ${socket.id} connected without a userId after auth middleware.`);
    // Optionally disconnect the socket if userId is mandatory
    // socket.disconnect(true);
  }

  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id}, User ID: ${socket.userId}, Reason: ${reason}`);
    // Disassociate socket from user
    if (socket.userId) {
      removeUserSocket(socket.userId, socket.id);
    }
  });

  // Example: Listen for other custom events from this client
  // socket.on('custom_event', (data) => {
  //   console.log(`Received custom_event from ${socket.id}:`, data);
  // });
});

// Middleware
app.use(cors());
app.use(express.json());

// Logger middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
    // Health check endpoint
    app.get("/api/ping", (req, res) => {
      res.status(200).send("pong");
    });


app.use('/api/users', userRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api/apf', apfRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/tournaments/:tournamentId/announcements', announcementRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.url} not found` });
});

// Function to connect to DB and start server
const startServer = async () => {
  try {
    // Ensure MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set.');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      // Specify the database name directly
      dbName: 'debate-platform',
      // Keep other valid options
      serverSelectionTimeoutMS: 5000,
      ssl: true,
      retryWrites: true,
      w: 'majority'
      // useNewUrlParser and useUnifiedTopology are deprecated and default in Mongoose 7+
    });
    console.log('✅ MongoDB Atlas connection established successfully');

    const PORT = process.env.PORT || 5001;
    // Start the HTTP server instead of the Express app directly
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server (with Socket.IO) is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error during startup:', err);
    console.error('Error details:', err.message);
    // Exit process if DB connection fails on direct start
    process.exit(1);
  }
};

// Only start the server if this script is run directly
if (require.main === module) {
  startServer();
}

// Export the httpServer for testing purposes (supertest needs the server instance)
module.exports = httpServer;