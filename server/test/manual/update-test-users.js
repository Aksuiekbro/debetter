/**
 * Script to update existing test users with isTestAccount flag
 * Run with: node update-test-users.js
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

async function updateTestUsers() {
  try {
    console.log('Updating test users...');
    
    // Update all users with @test.com email to have isTestAccount flag
    const result = await User.updateMany(
      { email: /@test.com/ },
      { $set: { isTestAccount: true } }
    );
    
    console.log(`Updated ${result.modifiedCount} test users`);
    
    // Verify the updates
    const testUsers = await User.find({ email: /@test.com/ });
    console.log('\nTest users found:', testUsers.length);
    console.log('Test users with isTestAccount flag:', testUsers.filter(u => u.isTestAccount).length);
    
  } catch (error) {
    console.error('Error updating test users:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateTestUsers(); 