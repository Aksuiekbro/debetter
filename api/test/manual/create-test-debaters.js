/**
 * Script to create test debater accounts for manual testing
 * 
 * Run with: node create-test-debaters.js
 * This will create test debater accounts and save credentials to a file
 */

require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/debate-platform';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Test debaters to create
const testDebaters = Array.from({ length: 32 }, (_, i) => ({
  username: `Debater${i + 1}`,
  email: `debater${i + 1}@test.com`,
  password: 'Debate123!',
  role: 'user'
}));

// Create the debaters and save credentials to a file
async function createTestDebaters() {
  try {
    const createdDebaters = [];
    
    for (const debaterData of testDebaters) {
      // Check if the debater already exists
      const existingDebater = await User.findOne({ email: debaterData.email });
      
      if (existingDebater) {
        console.log(`Debater with email ${debaterData.email} already exists. Skipping...`);
        createdDebaters.push({
          ...debaterData,
          _id: existingDebater._id,
          status: 'Already exists'
        });
        continue;
      }
      
      // Create new debater
      const debater = new User(debaterData);
      await debater.save();
      
      console.log(`Created debater: ${debater.username}`);
      createdDebaters.push({
        ...debaterData,
        _id: debater._id,
        status: 'Created'
      });
    }
    
    // Save credentials to a file
    const credentialsFile = path.join(__dirname, 'debater-credentials.json');
    fs.writeFileSync(credentialsFile, JSON.stringify(createdDebaters, null, 2));
    
    console.log(`\nCreated ${createdDebaters.length} test debaters.`);
    console.log(`Credentials saved to: ${credentialsFile}`);
    
  } catch (error) {
    console.error('Error creating test debaters:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.disconnect();
  }
}

createTestDebaters();