require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const debateRoutes = require('./routes/debateRoutes');
const apfRoutes = require('./routes/apfRoutes');
require('./models/Team'); // Ensure Team model is registered

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logger middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/debates', debateRoutes);
app.use('/api/apf', apfRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.url} not found` });
});

// MongoDB Atlas connection with all required options
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  ssl: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ MongoDB Atlas connection established successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  console.error('Error details:', err.message);
  // Exit process with failure
  process.exit(1);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});