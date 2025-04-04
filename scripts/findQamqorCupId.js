// scripts/findQamqorCupId.js
require('dotenv').config(); // Load .env from the current directory (project root)
const { MongoClient } = require('mongodb');

async function findTournamentId() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not found in .env file');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  const tournamentName = "Qamqor Cup"; // The name we are looking for

  try {
    await client.connect();
    console.log('Connected to MongoDB...');

    const database = client.db(); // Use the default database from the connection string
    // Assuming tournaments are stored in the 'debates' collection based on the Debate model structure
    const collection = database.collection('debates');

    // Find the tournament by name (case-insensitive) and format
    const tournament = await collection.findOne({
      name: { $regex: `^${tournamentName}$`, $options: 'i' }, // Case-insensitive match
      format: 'tournament' // Ensure it's a tournament
    });

    if (tournament) {
      console.log(`Found tournament "${tournament.name}" with ID: ${tournament._id}`);
      // Output only the ID on a new line for easier capture if needed
      console.log('\nTournament ID:');
      console.log(tournament._id.toString());
    } else {
      console.log(`Tournament named "${tournamentName}" not found.`);
    }

  } catch (err) {
    console.error('Error connecting to or querying MongoDB:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

findTournamentId();