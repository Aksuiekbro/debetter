const mongoose = require('mongoose');
const Debate = require('../api/models/Debate'); // Use Debate model
require('dotenv').config({ path: require('path').resolve(__dirname, '../api/.env') }); // Use absolute path for .env

const tournamentId = '67f0496a8f8debcc88f45174';

const findCreator = async () => {
  try {
    console.log('Attempting to connect with URI:', process.env.MONGODB_URI ? 'found' : 'not found'); // Check if URI is loaded
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables. Check api/.env file path and content.');
    }
    await mongoose.connect(process.env.MONGODB_URI); // Use default options
    console.log('MongoDB Connected');

    const debate = await Debate.findById(tournamentId).select('creator').lean(); // Query Debate model

    if (debate && debate.creator) {
      console.log(`Creator ObjectId for debate ${tournamentId}: ${debate.creator}`);
    } else if (debate) {
      console.log(`Debate ${tournamentId} found, but creator field is missing.`);
    } else {
      console.log(`Debate with ID ${tournamentId} not found.`);
    }

  } catch (error) {
    console.error('Error finding debate creator:', error.message); // Log only the message for clarity
  } finally {
    // Ensure disconnection happens only if connected
    if (mongoose.connection.readyState === 1) { // 1 = connected
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    } else {
        console.log('MongoDB connection was not established or already closed.');
    }
  }
}

findCreator();