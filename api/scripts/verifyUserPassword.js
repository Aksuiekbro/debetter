// api/scripts/verifyUserPassword.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Adjust path if .env is elsewhere
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path as necessary

const userEmail = 'aibek@turan.edu.kz';
const plainPassword = 'password123';

const verifyPassword = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable not set.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB.');

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`User ${userEmail} not found.`);
    } else {
      console.log(`User ${userEmail} found. Checking password...`);
      if (!user.password) {
          console.log(`User ${userEmail} found, but has no password field.`);
      } else {
          const isMatch = await bcrypt.compare(plainPassword, user.password);
          if (isMatch) {
            console.log(`✅ Password for ${userEmail} MATCHES the stored hash.`);
          } else {
            console.log(`❌ Password for ${userEmail} does NOT match the stored hash.`);
            console.log(`Stored hash: ${user.password}`); // Log hash for debugging
          }
      }
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
};

verifyPassword();