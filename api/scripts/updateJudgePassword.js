require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); // Adjust path if .env is elsewhere
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Assuming the User model is here

const targetEmail = 'aibek@turan.edu.kz';
const newPlainTextPassword = 'password123';
const mongoUri = process.env.MONGODB_URI; // Ensure MONGO_URI is set in your environment or .env file

if (!mongoUri) {
  console.error('Error: MONGODB_URI environment variable not set.');
  process.exit(1);
}

async function updatePassword() {
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPlainTextPassword, salt);
    console.log(`Hashing password "${newPlainTextPassword}"...`);

    // Update the user's password
    const result = await User.updateOne(
      { email: targetEmail },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      console.log(`User with email ${targetEmail} not found.`);
    } else if (result.modifiedCount === 1) {
      console.log(`Successfully updated password for ${targetEmail}.`);
    } else {
      console.log(`Password for ${targetEmail} was already up-to-date or update failed.`);
    }

  } catch (err) {
    console.error('Error updating password:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected.');
  }
}

updatePassword();