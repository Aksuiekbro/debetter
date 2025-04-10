// findSpecificPosting.js
require('dotenv').config(); // Load .env from the project root
const { MongoClient, ObjectId } = require('mongodb');

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI;
// const DB_NAME = 'mern-project-db'; // Use DB from connection string
const TOURNAMENT_ID = '67f0496a8f8debcc88f45174';
const TEAM1_NAME = 'Team 7';
const TEAM2_NAME = 'Team 12';
// --- End Configuration ---

async function findPosting() {
    if (!MONGODB_URI) {
        console.error('Error: MONGODB_URI not found in environment variables. Make sure it is set in your .env file.');
        process.exit(1);
    }
    const client = new MongoClient(MONGODB_URI);
    let team1Id = null;
    let team2Id = null;
    let foundPosting = null;

    try {
        await client.connect();
        console.log('Connected to MongoDB...'); // Match message style
        const db = client.db(); // Use the default DB from the connection string
        const debatesCollection = db.collection('debates'); // Revert to 'debates' based on findQamqorCupId.js

        const tournamentObjectId = new ObjectId(TOURNAMENT_ID);

        // 1. Find Tournament and Team IDs
        console.log(`Searching for tournament with ID: ${TOURNAMENT_ID} in collection 'debates'`);
        const tournament = await debatesCollection.findOne(
            { _id: tournamentObjectId },
            { projection: { teams: 1, postings: 1 } } // Project only necessary fields
        );

        if (!tournament) {
            console.error(`Error: Tournament with ID ${TOURNAMENT_ID} not found.`);
            return;
        }
        console.log('Tournament found.');

        if (!tournament.teams || tournament.teams.length === 0) {
             console.error(`Error: No teams found in tournament ${TOURNAMENT_ID}.`);
             return;
        }

        // Find Team IDs
        for (const team of tournament.teams) {
            if (team.name === TEAM1_NAME) {
                team1Id = team._id;
                console.log(`Found ${TEAM1_NAME} ID: ${team1Id}`);
            }
            if (team.name === TEAM2_NAME) {
                team2Id = team._id;
                 console.log(`Found ${TEAM2_NAME} ID: ${team2Id}`);
            }
            if (team1Id && team2Id) break; // Stop searching once both are found
        }

        if (!team1Id) {
            console.error(`Error: Team "${TEAM1_NAME}" not found in tournament ${TOURNAMENT_ID}.`);
            // Don't return yet, maybe Team 2 wasn't found either
        }
        if (!team2Id) {
            console.error(`Error: Team "${TEAM2_NAME}" not found in tournament ${TOURNAMENT_ID}.`);
        }
        if (!team1Id || !team2Id) {
            return; // Stop if either team wasn't found
        }

        // 2. Find Posting
        console.log(`Searching for posting between ${TEAM1_NAME} (${team1Id}) and ${TEAM2_NAME} (${team2Id})...`);
        if (!tournament.postings || tournament.postings.length === 0) {
             console.error(`Error: No postings found in tournament ${TOURNAMENT_ID}.`);
             return;
        }

        for (const posting of tournament.postings) {
            // Convert potential string IDs in postings to ObjectId for comparison if necessary
            // Assuming posting.team1 and posting.team2 are stored as ObjectIds matching team._id type
            const postingTeam1 = posting.team1; // Adjust if stored differently (e.g., posting.team1.toString())
            const postingTeam2 = posting.team2; // Adjust if stored differently

            if (
                (postingTeam1.equals(team1Id) && postingTeam2.equals(team2Id)) ||
                (postingTeam1.equals(team2Id) && postingTeam2.equals(team1Id))
            ) {
                foundPosting = posting;
                console.log('Matching posting found.');
                break; // Stop searching once found
            }
        }

        // 3. Report Findings
        if (foundPosting) {
            console.log("\n--- Found Posting Details ---");
            console.log(`Posting ID: ${foundPosting._id}`);
            console.log(`Round: ${foundPosting.round}`);
            console.log(`Match Number: ${foundPosting.matchNumber}`);
            console.log(`Team 1: ${foundPosting.team1}`);
            console.log(`Team 2: ${foundPosting.team2}`);
            console.log(`Judges: ${JSON.stringify(foundPosting.judges)}`); // Stringify array/objects for clarity
            console.log(`Status: ${foundPosting.status}`);
            console.log(`Winner: ${foundPosting.winner || 'N/A'}`);
            if (foundPosting.evaluation) {
                console.log(`Evaluation: ${JSON.stringify(foundPosting.evaluation, null, 2)}`);
            } else {
                console.log("Evaluation: Not available");
            }
            console.log("---------------------------\n");
        } else {
            console.log(`\nPosting involving ${TEAM1_NAME} and ${TEAM2_NAME} not found in tournament ${TOURNAMENT_ID}.\n`);
        }

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await client.close();
        console.log('MongoDB connection closed.');
    }
}

findPosting();