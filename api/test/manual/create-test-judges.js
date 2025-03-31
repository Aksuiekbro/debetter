/**
 * Script to create test judge accounts for manual testing
 * 
 * Run with: node create-test-judges.js
 * This will create test judge accounts and save credentials to a file
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

// Test judges to create
const testJudges = [
  {
    username: 'HeadJudge1',
    email: 'headjudge1@test.com',
    password: 'Judge123!',
    role: 'judge',
    judgeRole: 'Head Judge'
  },
  {
    username: 'Judge2',
    email: 'judge2@test.com',
    password: 'Judge123!',
    role: 'judge',
    judgeRole: 'Judge'
  },
  {
    username: 'Judge3',
    email: 'judge3@test.com',
    password: 'Judge123!',
    role: 'judge',
    judgeRole: 'Judge'
  },
  {
    username: 'AssistantJudge4',
    email: 'assistantjudge4@test.com',
    password: 'Judge123!',
    role: 'judge',
    judgeRole: 'Assistant Judge'
  },
  {
    username: 'AssistantJudge5',
    email: 'assistantjudge5@test.com',
    password: 'Judge123!',
    role: 'judge',
    judgeRole: 'Assistant Judge'
  }
];

// Create the judges and save credentials to a file
async function createTestJudges() {
  try {
    const createdJudges = [];
    
    for (const judgeData of testJudges) {
      // Check if the judge already exists
      const existingJudge = await User.findOne({ email: judgeData.email });
      
      if (existingJudge) {
        console.log(`Judge with email ${judgeData.email} already exists. Skipping...`);
        createdJudges.push({
          ...judgeData,
          _id: existingJudge._id,
          status: 'Already exists'
        });
        continue;
      }
      
      // Create new judge
      const judge = new User(judgeData);
      await judge.save();
      
      console.log(`Created judge: ${judge.username} (${judge.judgeRole})`);
      createdJudges.push({
        ...judgeData,
        _id: judge._id,
        status: 'Created'
      });
    }
    
    // Save credentials to a file
    const credentialsFile = path.join(__dirname, 'judge-credentials.json');
    fs.writeFileSync(credentialsFile, JSON.stringify(createdJudges, null, 2));
    
    console.log(`\nCreated ${createdJudges.length} test judges.`);
    console.log(`Credentials saved to: ${credentialsFile}`);
    
  } catch (error) {
    console.error('Error creating test judges:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.disconnect();
  }
}

createTestJudges();