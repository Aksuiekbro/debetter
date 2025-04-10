// api/scripts/verifyUser.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Ensure .env is loaded from api directory
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path as necessary

const userEmailToCheck = 'aibek@turan.edu.kz';
const plainPasswordToCheck = 'password123';

async function verifyUser() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable not set.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Optional: Adjust timeout
    });
    console.log('✅ MongoDB connection established.');

    console.log(`Searching for user with email: ${userEmailToCheck}...`);
    const user = await User.findOne({ email: userEmailToCheck }).select('+password').lean(); // Use lean() for plain object, select password explicitly

    if (!user) {
      console.log(`❌ User with email ${userEmailToCheck} not found.`);
    } else {
      console.log(`✅ User found: ${user.username} (ID: ${user._id})`);
      console.log('Verifying password...');

      if (!user.password) {
         console.error(`❌ User ${user.username} found, but has no password hash stored.`);
      } else {
        const isMatch = await bcrypt.compare(plainPasswordToCheck, user.password);

        if (isMatch) {
          console.log(`✅ Password verification successful: The password '${plainPasswordToCheck}' matches the stored hash for user ${userEmailToCheck}.`);
        } else {
          console.log(`❌ Password verification failed: The password '${plainPasswordToCheck}' does NOT match the stored hash for user ${userEmailToCheck}.`);
        }
      }
    }
  } catch (error) {
    console.error('❌ An error occurred:', error);
  } finally {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

verifyUser();