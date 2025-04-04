const { MongoClient, ObjectId } = require('mongodb');

const mongoURI = 'mongodb+srv://dauren190307:nonono@mango.oafyn.mongodb.net/debate-platform?retryWrites=true&w=majority&appName=Mango';
const dbName = 'debate-platform'; // Extract DB name from URI or set explicitly
const collectionName = 'debates'; // Assuming the collection name is 'debates'
const tournamentIdString = '67f0496a8f8debcc88f45174'; // Corrected Tournament ID

async function checkTeamReferencesNative() {
  const client = new MongoClient(mongoURI, {
    // Add connection options if needed, e.g., timeouts
    // connectTimeoutMS: 30000,
    // socketTimeoutMS: 30000, 
  });

  try {
    console.log('Attempting to connect to MongoDB using native driver...');
    await client.connect();
    console.log('MongoDB Connected');

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    console.log(`Fetching tournament data for ID: ${tournamentIdString}...`);
    
    let tournamentObjectId;
    try {
        tournamentObjectId = new ObjectId(tournamentIdString);
    } catch (e) {
        console.error(`Invalid Tournament ID format: ${tournamentIdString}`);
        return;
    }

    // Fetch the specific document
    const tournament = await collection.findOne(
        { _id: tournamentObjectId },
        { projection: { tournamentRounds: 1, teams: 1 } } // Project only necessary fields
    );

    if (!tournament) {
      console.log(`Tournament with ID ${tournamentIdString} not found.`);
      return;
    }
    console.log('Tournament data fetched successfully.');

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
    console.log(`Tournament ID: ${tournamentIdString}`);
    console.log(`First Round, First Match Details:`);
    console.log(`  team1 Raw Value: ${team1Id}`);
    console.log(`  team2 Raw Value: ${team2Id}`);
    console.log(`  Type of team1: ${typeof team1Id} ${team1Id instanceof ObjectId ? '(ObjectId)' : ''}`);
    console.log(`  Type of team2: ${typeof team2Id} ${team2Id instanceof ObjectId ? '(ObjectId)' : ''}`);

    // Check if the values are valid MongoDB ObjectIds (the driver often returns them as ObjectId instances)
    const isTeam1ObjectId = team1Id instanceof ObjectId;
    const isTeam2ObjectId = team2Id instanceof ObjectId;
    console.log(`  Is team1 an ObjectId instance? ${isTeam1ObjectId}`);
    console.log(`  Is team2 an ObjectId instance? ${isTeam2ObjectId}`);

    // Proceed only if they are ObjectIds
    let team1IsEmbedded = false;
    let team2IsEmbedded = false;
    if (isTeam1ObjectId || isTeam2ObjectId) {
        const teams = tournament.teams || [];
        console.log(`\nComparing with embedded teams array (count: ${teams.length})...`);
        
        if (isTeam1ObjectId) {
            // Native driver uses .equals() for ObjectId comparison
            team1IsEmbedded = teams.some(team => team._id && team._id.equals(team1Id));
            console.log(`  Does team1 ID (${team1Id}) match any embedded team _id? ${team1IsEmbedded}`);
        }
        if (isTeam2ObjectId) {
            // Native driver uses .equals() for ObjectId comparison
            team2IsEmbedded = teams.some(team => team._id && team._id.equals(team2Id));
            console.log(`  Does team2 ID (${team2Id}) match any embedded team _id? ${team2IsEmbedded}`);
        }
    } else {
        console.log(`\nNeither team1 nor team2 appear to be ObjectId instances. Cannot compare with embedded teams.`);
    }

    console.log(`\n--- Analysis Result ---`);
    if (isTeam1ObjectId && isTeam2ObjectId && team1IsEmbedded && team2IsEmbedded) {
        console.log(`Conclusion: Both team1 and team2 fields store embedded Team ObjectIds from the tournament's 'teams' array.`);
    } else if (isTeam1ObjectId && team1IsEmbedded) {
         console.log(`Conclusion: team1 stores an embedded Team ObjectId, but team2 (${team2Id}) does not appear to be or does not match an embedded team.`);
    } else if (isTeam2ObjectId && team2IsEmbedded) {
         console.log(`Conclusion: team2 stores an embedded Team ObjectId, but team1 (${team1Id}) does not appear to be or does not match an embedded team.`);
    } else if (isTeam1ObjectId || isTeam2ObjectId) {
        // If they are ObjectIds but don't match embedded teams
        console.log(`Conclusion: team1 and/or team2 are ObjectIds but do not correspond to embedded Team ObjectIds in the 'teams' array.`);
        console.log(`Based on the schema (ref: 'User'), they are likely User ObjectIds, but this script did not verify against the 'users' collection.`);
    } else {
         console.log(`Conclusion: The values in team1 (${team1Id}) and team2 (${team2Id}) are not ObjectId instances. Their type and reference are unclear.`);
    }


  } catch (error) {
    console.error('\nError during script execution:', error);
  } finally {
    await client.close();
    console.log('\nMongoDB Disconnected');
  }
}

checkTeamReferencesNative();