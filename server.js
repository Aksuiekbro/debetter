const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { protect } = require('./server/middleware/authMiddleware');

const app = express();

// Middleware - Configure CORS with more permissive settings
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
.then(() => {
  console.log('✅ MongoDB Atlas connection established successfully');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1); // Exit if unable to connect to database
});

// Connection error handling
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

/**
 * IMPORTANT: API ROUTE CONFIGURATION
 * 
 * User routes are mounted at /api/users
 * - Registration endpoint: /api/users/register
 * - Login endpoint: /api/users/login
 *
 * The client-side code in src/components/auth/Register.js and Login.js
 * must use these exact endpoints.
 * 
 * DO NOT change these paths without updating the corresponding client code.
 */
// Import routes
const userRoutes = require('./server/routes/userRoutes');
const { 
  getDebates, 
  createDebate, 
  joinDebate, 
  getDebate 
} = require('./server/controllers/debateController');

// Mount routes - DO NOT CHANGE THIS PATH without updating client code
app.use('/api/users', userRoutes);

/**
 * Debate routes are defined directly in this file
 * If moving them to a separate router, make sure to update
 * any client code that references these endpoints.
 */
// Public debate routes
app.get('/api/debates', getDebates);
app.get('/api/debates/:id', getDebate);

// Protected debate routes
app.post('/api/debates', protect, createDebate);
app.post('/api/debates/:id/join', protect, joinDebate);

// Base route
app.get('/', (req, res) => {
  res.send('Debate Platform API');
});

// Port configuration - Changed to match client API_BASE_URL
const port = process.env.PORT || 5001;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${port}`);
});
