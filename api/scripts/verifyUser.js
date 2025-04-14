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
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Optional: Adjust timeout
    });

    const user = await User.findOne({ email: userEmailToCheck }).select('+password').lean(); // Use lean() for plain object, select password explicitly

    if (!user) {
    } else {

      if (!user.password) {
         console.error(`❌ User ${user.username} found, but has no password hash stored.`);
      } else {
        const isMatch = await bcrypt.compare(plainPasswordToCheck, user.password);

        if (isMatch) {
        } else {
        }
      }
    }
  } catch (error) {
    console.error('❌ An error occurred:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyUser();