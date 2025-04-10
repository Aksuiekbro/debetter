// scripts/checkJudgeAssignment.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file in the api directory
// Assumes .env file exists at ../api/.env relative to this script
const envPath = path.resolve(__dirname, '../api/.env');
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
    console.warn(`Warning: Could not load .env file from ${envPath}. Ensure it exists and MONGODB_URI is set if needed.`);
    // Attempt to proceed assuming MONGODB_URI might be set globally
}


// Ensure Tournament model path is correct relative to this script's location
const tournamentModelPath = path.resolve(__dirname, '../api/models/Tournament');
let Tournament;
try {
    Tournament = require(tournamentModelPath);
} catch (err) {
    console.error(`Error loading Tournament model from ${tournamentModelPath}:`, err);
    process.exit(1);
}


const tournamentId = '67f5e4a694464187766a83c7';
const judgeIdToFind = '67f0495f8f8debcc88f4514c';

const checkJudgeAssignment = async () => {
    const dbUri = process.env.MONGODB_URI;

    if (!dbUri) {
        console.error('Error: MONGODB_URI environment variable not set.');
        console.error('Please ensure MONGODB_URI is defined in your environment or in api/.env');
        process.exit(1);
    }

    try {
        console.log(`Connecting to MongoDB using URI from environment...`);
        await mongoose.connect(dbUri);
        console.log('MongoDB Connected Successfully.');

        console.log(`Searching for tournament with ID: ${tournamentId}`);
        const tournament = await Tournament.findById(tournamentId)
            .select('postings') // Only select the postings field
            .lean(); // Use lean for faster read-only query

        if (!tournament) {
            console.log(`RESULT: Tournament with ID ${tournamentId} not found.`);
            return;
        }

        if (!tournament.postings || tournament.postings.length === 0) {
            console.log(`RESULT: Tournament ${tournamentId} found, but it has no postings.`);
            return;
        }

        console.log(`Found ${tournament.postings.length} postings for tournament ${tournamentId}. Checking first few...`);

        let judgeFound = false;
        const postingsToCheck = tournament.postings.slice(0, 5); // Check first 5 postings as requested

        for (let i = 0; i < postingsToCheck.length; i++) {
            const posting = postingsToCheck[i];
            const postingIdentifier = posting._id ? posting._id.toString() : `index ${i}`;
            console.log(`\n--- Checking Posting ${i + 1} (ID: ${postingIdentifier}) ---`);

            if (!posting.judges || posting.judges.length === 0) {
                console.log(`  Posting ${postingIdentifier} has no judges assigned.`);
                continue;
            }

            // Convert judge ObjectIds to strings for comparison
            const assignedJudgeIds = posting.judges.map(j => j.toString());
            console.log(`  Judges assigned: [${assignedJudgeIds.join(', ')}]`);

            // Check if the judgeIdToFind exists in the judges array
            const foundInPosting = assignedJudgeIds.includes(judgeIdToFind);

            if (foundInPosting) {
                console.log(`  FOUND Judge ${judgeIdToFind} in posting ${postingIdentifier}.`);
                judgeFound = true;
                // No need to break, let's check all requested postings
            } else {
                console.log(`  Judge ${judgeIdToFind} NOT FOUND in posting ${postingIdentifier}.`);
            }
        }

        console.log('\n--- Verification Summary ---');
        if (judgeFound) {
            console.log(`RESULT: Judge ${judgeIdToFind} (judge_aibek) WAS FOUND in at least one of the first ${postingsToCheck.length} postings checked for tournament ${tournamentId}.`);
        } else {
            console.log(`RESULT: Judge ${judgeIdToFind} (judge_aibek) WAS NOT FOUND in any of the first ${postingsToCheck.length} postings checked for tournament ${tournamentId}.`);
        }

    } catch (error) {
        console.error('Error during script execution:', error);
        console.log(`RESULT: An error occurred while checking judge assignment.`);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('MongoDB Disconnected.');
        }
    }
};

checkJudgeAssignment();