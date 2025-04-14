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

    const user = await User.findOne({ email: userEmail });

    if (!user) {
    } else {
      if (!user.password) {
      } else {
          const isMatch = await bcrypt.compare(plainPassword, user.password);
          if (isMatch) {
          } else {
          }
      }
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.disconnect();
  }
};

verifyPassword();