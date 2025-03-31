/**
 * Script to ensure we have both test debaters and judges in the database
 * Run with: node ensure-test-users.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../../models/User');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MongoDB Atlas URI not found in environment variables');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  ssl: true,
  retryWrites: true,
  w: 'majority'
}).then(() => {
  console.log('MongoDB Atlas connected successfully');
}).catch(err => {
  console.error('MongoDB Atlas connection error:', err);
  process.exit(1);
});

// Test users to create
const testUsers = [
  // Debaters
  ...Array.from({ length: 32 }, (_, i) => ({
    username: `Debater${i + 1}`,
    email: `debater${i + 1}@test.com`,
    password: 'Debate123!',
    role: 'user',
    isTestAccount: true
  })),
  // Judges with judgeRole
  ...Array.from({ length: 8 }, (_, i) => ({
    username: `Judge${i + 1}`,
    email: `judge${i + 1}@test.com`,
    password: 'Judge123!',
    role: 'judge',
    judgeRole: i === 0 ? 'Head Judge' : 'Judge', // First judge is Head Judge
    isTestAccount: true
  }))
];

async function ensureTestUsers() {
  try {
    console.log('Checking and creating test users...');
    const createdUsers = [];
    
    for (const userData of testUsers) {
      // Check if user exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists`);
        createdUsers.push({
          ...userData,
          _id: existingUser._id,
          status: 'Existing'
        });
      } else {
        // Create new user
        const user = new User(userData);
        await user.save();
        
        console.log(`Created ${userData.role}: ${user.username}`);
        createdUsers.push({
          ...userData,
          _id: user._id,
          status: 'Created'
        });
      }
    }
    
    const debaters = createdUsers.filter(u => u.role === 'user');
    const judges = createdUsers.filter(u => u.role === 'judge');
    
    console.log('\nSummary:');
    console.log(`Debaters: ${debaters.length} (${debaters.filter(d => d.status === 'Created').length} new)`);
    console.log(`Judges: ${judges.length} (${judges.filter(j => j.status === 'Created').length} new)`);
    
  } catch (error) {
    console.error('Error ensuring test users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

ensureTestUsers();