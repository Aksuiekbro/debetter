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

    // Find the tournament by title (case-insensitive) and format
    const filter = {
      title: { $regex: `^${tournamentName}$`, $options: 'i' }, // Case-insensitive match for 'title'
      format: 'tournament' // Ensure it's a tournament
    };
    console.log('Executing query with filter:', JSON.stringify(filter, null, 2)); // Log the filter
    const tournament = await collection.findOne(filter);

    if (tournament) {
      console.log(`Found tournament "${tournament.title}" with ID: ${tournament._id}`); // Use tournament.title
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