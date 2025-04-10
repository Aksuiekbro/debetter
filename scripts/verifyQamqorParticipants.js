// scripts/verifyQamqorParticipants.js
const mongoose = require('mongoose');
// Changed from Debate to Tournament
const Tournament = require('../api/models/Tournament'); // Adjust path if necessary
const User = require('../api/models/User'); // Adjust path if necessary
require('dotenv').config({ path: './api/.env' }); // Load .env file from the api directory relative to project root

const QAMQOR_CUP_ID = '67f0496a8f8debcc88f45174';
const MAX_USERS_TO_CHECK = 5; // Check the first 5 users

async function verifyParticipants() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Error: MONGODB_URI environment variable not set.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    // Increase connection timeout slightly, just in case, though the query timeout was the issue previously
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('MongoDB connected successfully.');

    console.log(`Fetching tournament with ID: ${QAMQOR_CUP_ID}`);
    // Query the tournaments collection instead of debates
    const tournament = await Tournament.findById(QAMQOR_CUP_ID)
                                     .select('participants.userId') // Select only the participants field
                                     .lean(); // Use lean for performance

    if (!tournament) {
      console.error(`Error: Tournament with ID ${QAMQOR_CUP_ID} not found.`);
      return;
    }

    // Check participants array directly on the tournament document
    if (!tournament.participants || tournament.participants.length === 0) {
      console.log(`Tournament ${QAMQOR_CUP_ID} found, but has no participants listed.`);
      return;
    }

    const participantUserIds = tournament.participants.map(p => p.userId).filter(id => id); // Extract non-null userIds
    console.log(`Found ${participantUserIds.length} participants in the tournament.`);

    if (participantUserIds.length === 0) {
        console.log('No valid userIds found in the participants array.');
        return;
    }

    const userIdsToCheck = participantUserIds.slice(0, MAX_USERS_TO_CHECK);
    console.log(`Checking the first ${userIdsToCheck.length} participant userIds for existence in the 'users' collection...`);

    let allFound = true;
    for (const userId of userIdsToCheck) {
      if (!userId) {
          console.log(`Encountered a null/undefined userId in participants array. Skipping.`);
          continue;
      }
      try {
        // Add a timeout for the user query as well
        const user = await User.findById(userId).select('_id').lean().maxTimeMS(5000); // 5 second timeout
        if (user) {
          console.log(`- User ID ${userId}: Found`);
        } else {
          console.log(`- User ID ${userId}: NOT FOUND`);
          allFound = false;
        }
      } catch (error) {
          if (error instanceof mongoose.Error.CastError) {
              console.error(`- User ID ${userId}: Invalid ObjectId format. Skipping.`);
              allFound = false;
          } else if (error.name === 'MongooseError' && error.message.includes('timed out')) {
              console.error(`- Timeout checking User ID ${userId}. Skipping.`);
              allFound = false; // Treat timeout as potentially not found
          }
           else {
              console.error(`- Error checking User ID ${userId}:`, error.message);
              allFound = false; // Consider other errors as 'not found' for this check
          }
      }
    }

    console.log('\nVerification Summary:');
    if (allFound && userIdsToCheck.length > 0) {
        console.log(`All checked userIds (${userIdsToCheck.length}) correspond to existing users.`);
    } else if (userIdsToCheck.length === 0) {
        // Handled earlier, but double-checking
        console.log('No user IDs were checked.');
    }
    else {
        console.log(`At least one checked userId does NOT correspond to an existing user, is invalid, or timed out.`);
    }


  } catch (error) {
     if (error.name === 'MongooseServerSelectionError') {
        console.error('Error connecting to MongoDB. Please check connection string and network access.', error.message);
     } else if (error.name === 'MongooseError' && error.message.includes('timed out')) {
         console.error('Operation timed out:', error.message);
     }
     else {
        console.error('An error occurred during the verification process:', error);
     }
  } finally {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

verifyParticipants();