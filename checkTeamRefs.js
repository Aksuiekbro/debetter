const mongoose = require('mongoose');
// Adjust the path if your Debate model is located elsewhere relative to the project root
const Debate = require('./api/models/Debate'); 

const mongoURI = 'mongodb+srv://dauren190307:nonono@mango.oafyn.mongodb.net/debate-platform?retryWrites=true&w=majority&appName=Mango';
const tournamentId = '67f0496a8f8debcc88f45174'; // Corrected Tournament ID

async function checkTeamReferences() {
  try {
    console.log('Attempting to connect to MongoDB...');
    // Connect with keepAlive options
    mongoose.connect(mongoURI, {
        keepAlive: true, 
        keepAliveInitialDelay: 300000 // Send keepAlive pings after 5 minutes (adjust if needed)
    }); 

    // Wait for the connection to be fully open
    await new Promise((resolve, reject) => {
      const db = mongoose.connection;
      const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timed out after 30 seconds'));
      }, 30000); 

      db.on('error', (err) => {
        clearTimeout(timeout);
        console.error('MongoDB connection error:', err);
        reject(err); 
      });
      db.once('open', () => {
        clearTimeout(timeout);
        console.log('MongoDB Connected and Open');
        resolve(); 
      });
    });

    console.log('Fetching tournament data...');
    // Use findOne and explicitly call exec()
    const tournament = await Debate.findOne({ _id: tournamentId }) 
                                   .select('tournamentRounds teams') 
                                   .lean()
                                   .exec(); // Explicitly execute the query

    if (!tournament) {
      console.log(`Tournament with ID ${tournamentId} not found.`);
      return;
    }

    // Defensive checks for nested properties
    if (!tournament.tournamentRounds || tournament.tournamentRounds.length === 0 ||
        !tournament.tournamentRounds[0].matches || tournament.tournamentRounds[0].matches.length === 0) {
      console.log('Tournament rounds or the first match data is missing or empty.');
      return;
    }

    const firstMatch = tournament.tournamentRounds[0].matches[0];
    const team1Id = firstMatch.team1;
    const team2Id = firstMatch.team2;

    console.log(`\n--- Data Fetched ---`);
    console.log(`Tournament ID: ${tournamentId}`);
    console.log(`First Round, First Match Details:`);
    console.log(`  team1 Raw Value: ${team1Id}`);
    console.log(`  team2 Raw Value: ${team2Id}`);
    
    // Check if the values are valid MongoDB ObjectIds
    const isTeam1ObjectId = mongoose.Types.ObjectId.isValid(team1Id);
    const isTeam2ObjectId = mongoose.Types.ObjectId.isValid(team2Id);
    console.log(`  Is team1 a valid ObjectId? ${isTeam1ObjectId}`);
    console.log(`  Is team2 a valid ObjectId? ${isTeam2ObjectId}`);

    // Proceed only if they are valid ObjectIds
    let team1IsEmbedded = false;
    let team2IsEmbedded = false;
    if (isTeam1ObjectId || isTeam2ObjectId) {
        const teams = tournament.teams || [];
        console.log(`\nComparing with embedded teams array (count: ${teams.length})...`);
        
        if (isTeam1ObjectId) {
            // Ensure team._id exists before calling toString()
            team1IsEmbedded = teams.some(team => team._id && team._id.toString() === team1Id.toString());
            console.log(`  Does team1 ID (${team1Id}) match any embedded team _id? ${team1IsEmbedded}`);
        }
        if (isTeam2ObjectId) {
            // Ensure team._id exists before calling toString()
            team2IsEmbedded = teams.some(team => team._id && team._id.toString() === team2Id.toString());
            console.log(`  Does team2 ID (${team2Id}) match any embedded team _id? ${team2IsEmbedded}`);
        }
    } else {
        console.log(`\nNeither team1 nor team2 appear to be valid ObjectIds. Cannot compare with embedded teams.`);
    }

    console.log(`\n--- Analysis Result ---`);
    if (isTeam1ObjectId && isTeam2ObjectId && team1IsEmbedded && team2IsEmbedded) {
        console.log(`Conclusion: Both team1 and team2 fields store embedded Team ObjectIds from the tournament's 'teams' array.`);
    } else if (isTeam1ObjectId && team1IsEmbedded) {
         console.log(`Conclusion: team1 stores an embedded Team ObjectId, but team2 (${team2Id}) does not appear to be or does not match an embedded team.`);
    } else if (isTeam2ObjectId && team2IsEmbedded) {
         console.log(`Conclusion: team2 stores an embedded Team ObjectId, but team1 (${team1Id}) does not appear to be or does not match an embedded team.`);
    } else if (isTeam1ObjectId || isTeam2ObjectId) {
        console.log(`Conclusion: Neither team1 nor team2 correspond to embedded Team ObjectIds in the 'teams' array.`);
        console.log(`Based on the schema (ref: 'User'), they are likely User ObjectIds, but this script did not verify against the 'users' collection.`);
    } else {
         console.log(`Conclusion: The values in team1 and team2 are not valid ObjectIds. Their type and reference are unclear.`);
    }


  } catch (error) {
    console.error('\nError during script execution:', error);
  } finally {
    // Check connection state before disconnecting
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) { // 1: connected, 2: connecting
        await mongoose.disconnect();
        console.log('\nMongoDB Disconnected');
    } else {
        console.log('\nMongoDB connection was not in a connected state to disconnect.');
    }
  }
}

checkTeamReferences();