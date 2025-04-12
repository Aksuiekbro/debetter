// scripts/checkQamqorBracket.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../api/.env') }); // Load .env from api directory
const { MongoClient, ObjectId } = require('mongodb');

const tournamentId = '67f895cd0d84abb3011f1140'; // Qamqor Cup ID

async function checkBracket() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not found in .env file');
    process.exit(1);
  }

  const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 60000, // 60 seconds
      socketTimeoutMS: 60000 // 60 seconds
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB...');

    const database = client.db();
    const debatesCollection = database.collection('debates');

    // Fetch relevant fields
    const tournament = await debatesCollection.findOne(
      { _id: new ObjectId(tournamentId) },
      { projection: { title: 1, participants: 1, tournamentRounds: 1, format: 1 } }
    );

    if (!tournament) {
      console.log(`Tournament with ID ${tournamentId} not found.`);
      process.exit(1);
    }

    console.log(`\n--- Tournament: ${tournament.title} (${tournament._id}) ---`);
    console.log(`Format: ${tournament.format}`);
    console.log(`Participants Count: ${tournament.participants?.length || 0}`);
    // console.log(`Participants:`, JSON.stringify(tournament.participants, null, 2)); // Optional: Log participants if needed

    if (!tournament.tournamentRounds || tournament.tournamentRounds.length === 0) {
      console.log(`\nBracket Status: NOT INITIALIZED (tournamentRounds array is missing or empty).`);
    } else {
      console.log(`\nBracket Status: INITIALIZED (${tournament.tournamentRounds.length} rounds found).`);
      const round1 = tournament.tournamentRounds[0];
      if (round1 && round1.matches && round1.matches.length > 0) {
        console.log(`Round 1 Status: ${round1.matches.length} matches found.`);
        // Check if first match has teams assigned
        const firstMatch = round1.matches[0];
        if (firstMatch.team1 === null && firstMatch.team2 === null) {
          console.log(`Round 1 Matches: Appear to be unpopulated (teams are null).`);
        } else {
          console.log(`Round 1 Matches: Appear to be populated.`);
          console.log(`  Example Match 1: Team1=${firstMatch.team1}, Team2=${firstMatch.team2}`);
        }
        // console.log(`Round 1 Data:`, JSON.stringify(round1, null, 2)); // Optional: Log full round 1 data
      } else {
        console.log(`Round 1 Status: No matches found in Round 1 data.`);
      }
    }

  } catch (err) {
    console.error('Error connecting to or querying MongoDB:', err);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed.');
  }
}

checkBracket();