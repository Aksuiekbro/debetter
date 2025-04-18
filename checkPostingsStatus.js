require('dotenv').config({ path: './api/.env' }); // Explicitly point to .env in api directory
const mongoose = require('mongoose');
const Debate = require('./api/models/Debate'); // Adjust path as needed

const tournamentId = '67f0496a8f8debcc88f45174'; // Qamqor Cup ID

const checkStatus = async () => {
  try {
    // Increase connection timeout to 30 seconds
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });

    const tournament = await Debate.findById(tournamentId).select('postings');

    if (!tournament) {
      console.error(`Tournament with ID ${tournamentId} not found.`);
      process.exit(1);
    }

    if (!tournament.postings || tournament.postings.length === 0) {
      process.exit(0);
    }


    let allScheduled = true;
    for (let i = 0; i < Math.min(3, tournament.postings.length); i++) {
      const posting = tournament.postings[i];
      if (posting.status !== 'scheduled') {
        allScheduled = false;
      }
    }

    if (allScheduled) {
      console.log('\nVerification successful: All checked postings have status "scheduled".');
    } else {
      console.log('\nVerification failed: Some checked postings do not have status "scheduled".');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  } finally {
    // Ensure disconnection even if errors occur before process.exit()
    await mongoose.disconnect();
  }
};

checkStatus();