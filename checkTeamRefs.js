const mongoose = require('mongoose');
// Adjust the path if your Debate model is located elsewhere relative to the project root
const Debate = require('./api/models/Debate'); 

const mongoURI = 'mongodb+srv://dauren190307:nonono@mango.oafyn.mongodb.net/debate-platform?retryWrites=true&w=majority&appName=Mango';
const tournamentId = '67f0496a8f8debcc88f45174'; // Corrected Tournament ID

async function checkTeamReferences() {
  try {
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
        reject(err); 
      });
      db.once('open', () => {
        clearTimeout(timeout);
        resolve(); 
      });
    });

    // Use findOne and explicitly call exec()
    const tournament = await Debate.findOne({ _id: tournamentId }) 
                                   .select('tournamentRounds teams') 
                                   .lean()
                                   .exec(); // Explicitly execute the query

    if (!tournament) {
      return;
    }

    // Defensive checks for nested properties
    if (!tournament.tournamentRounds || tournament.tournamentRounds.length === 0 ||
        !tournament.tournamentRounds[0].matches || tournament.tournamentRounds[0].matches.length === 0) {
      return;
    }

    const firstMatch = tournament.tournamentRounds[0].matches[0];
    const team1Id = firstMatch.team1;
    const team2Id = firstMatch.team2;

    
    // Check if the values are valid MongoDB ObjectIds
    const isTeam1ObjectId = mongoose.Types.ObjectId.isValid(team1Id);
    const isTeam2ObjectId = mongoose.Types.ObjectId.isValid(team2Id);

    // Proceed only if they are valid ObjectIds
    let team1IsEmbedded = false;
    let team2IsEmbedded = false;
    if (isTeam1ObjectId || isTeam2ObjectId) {
        const teams = tournament.teams || [];
        
        if (isTeam1ObjectId) {
            // Ensure team._id exists before calling toString()
            team1IsEmbedded = teams.some(team => team._id && team._id.toString() === team1Id.toString());
        }
        if (isTeam2ObjectId) {
            // Ensure team._id exists before calling toString()
            team2IsEmbedded = teams.some(team => team._id && team._id.toString() === team2Id.toString());
        }
    } else {
    }

    if (isTeam1ObjectId && isTeam2ObjectId && team1IsEmbedded && team2IsEmbedded) {
    } else if (isTeam1ObjectId && team1IsEmbedded) {
    } else if (isTeam2ObjectId && team2IsEmbedded) {
    } else if (isTeam1ObjectId || isTeam2ObjectId) {
    } else {
    }


  } catch (error) {
    // Keep error logging for script execution failure
    console.error('\nError during script execution:', error);
  } finally {
    // Check connection state before disconnecting
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) { // 1: connected, 2: connecting
        await mongoose.disconnect();
    } else {
    }
  }
}

checkTeamReferences();