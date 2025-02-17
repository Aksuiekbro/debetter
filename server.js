const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { protect } = require('./server/middleware/authMiddleware');

const app = express();

// Middleware
app.use(cors());
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

// Import controllers
const { register, login } = require('./server/controllers/authController');
const { 
  getDebates, 
  createDebate, 
  joinDebate, 
  getDebate 
} = require('./server/controllers/debateController');

// Auth routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

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

// Port configuration
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${port}`);
});
