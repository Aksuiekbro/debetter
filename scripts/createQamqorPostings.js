// scripts/createQamqorPostings.js
require('dotenv').config(); // Load .env from the current directory
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

const tournamentId = '67e9100f4510e481c2667079'; // Qamqor Cup ID
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZWNlNmQ2NzZmNTk5NmVlNWYxYTM5OCIsImlhdCI6MTc0MzU3ODg3MSwiZXhwIjoxNzQ2MTcwODcxfQ.00k7rplm70lEqrgPWAyFucWcsyFeadvyLJydw9Xt1PY'; // Provided Admin Token
const apiBaseUrl = 'http://localhost:5001'; // Assuming backend runs on 5001

// Helper function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper function to select random judges
function selectRandomJudges(judgeList, count = 1) {
  if (!judgeList || judgeList.length === 0) return [];
  const shuffledJudges = shuffleArray([...judgeList]);
  return shuffledJudges.slice(0, Math.min(count, shuffledJudges.length));
}


async function createPostings() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not found in .env file');
    process.exit(1);
  }
  if (!adminToken) {
    console.error('Error: Admin token is missing.');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  let tournament;

  // 1. Fetch Tournament Data
  try {
    await client.connect();
    console.log('Connected to MongoDB...');
    const database = client.db();
    const debatesCollection = database.collection('debates');

    // Fetch title, teams, and participants (specifically judge IDs)
    tournament = await debatesCollection.findOne(
      { _id: new ObjectId(tournamentId) },
      { projection: { title: 1, teams: 1, participants: 1 } } // Request 'title' instead of 'name'
    );

    if (!tournament) {
      console.error(`Tournament with ID ${tournamentId} not found.`);
      process.exit(1);
    }
    console.log(`Found tournament: ${tournament.title}`); // Use title

  } catch (err) {
    console.error('Error fetching tournament data:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }

  // 2. Prepare Postings
  const teams = tournament.teams || [];
  // Extract judge IDs from the participants array
  const judges = tournament.participants?.filter(p => p.role === 'judge').map(j => j._id) || [];

  if (teams.length < 2) {
    console.error('Not enough teams in the tournament to create pairings.');
    process.exit(1);
  }
  if (judges.length < 1) {
    console.warn('Warning: No judges found in the tournament. Postings will be created without judges.');
  }

  console.log(`Found ${teams.length} teams and ${judges.length} judges.`);

  const shuffledTeams = shuffleArray([...teams]);
  const batchGames = [];
  const numGames = Math.floor(shuffledTeams.length / 2);

  console.log(`Creating ${numGames} games for Round 1...`);

  for (let i = 0; i < numGames; i++) {
    const team1 = shuffledTeams[i * 2];
    const team2 = shuffledTeams[i * 2 + 1];
    const selectedJudgeIds = selectRandomJudges(judges, 1).map(id => id.toString()); // Assign 1 random judge

    // Match the structure expected by createBatchPostings service method
    const gameData = {
      round: 1, // Add round number
      matchNumber: i + 1, // Add match number (1-based index)
      team1: team1._id.toString(), // Use team1 key with string ID
      team2: team2._id.toString(), // Use team2 key with string ID
      judges: selectedJudgeIds,    // Use judges key
      theme: 'General Knowledge',
      location: 'TBD',
      // scheduledTime: null // Optional: Add time if needed
    };
    batchGames.push(gameData);
    console.log(`  Prepared Game ${i + 1}: Team ${team1.name} vs Team ${team2.name}, Judges: ${selectedJudgeIds.join(', ') || 'None'}`);
  }

  const batchPayload = {
    batchName: `${tournament.title || 'Qamqor Cup'} - Round 1`, // Use title, fallback if needed
    batchGames: batchGames
  };

  // 3. Call Batch Posting API
  const url = `${apiBaseUrl}/api/debates/${tournamentId}/batch-postings`;
  console.log(`\nSending batch request to: ${url}`);

  try {
    const response = await axios.post(url, batchPayload, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('\nAPI Response:');
    console.log(`Status: ${response.status}`);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    if (response.data.errors && response.data.errors.length > 0) {
      console.error('\nErrors occurred during batch creation:');
      response.data.errors.forEach(err => console.error(`- Game ${err.gameIndex + 1}: ${err.error}`));
    } else {
      console.log('\nBatch postings created successfully!');
    }

  } catch (error) {
    console.error('\nError calling batch posting API:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    process.exit(1);
  }
}

createPostings();