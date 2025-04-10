// scripts/testLoserStatsUpdate.js
require('dotenv').config(); // Load .env from the project root
const axios = require('axios');
const { MongoClient, ObjectId } = require('mongodb');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001'; // Or your actual API base URL
const MONGODB_URI = process.env.MONGODB_URI;
const TOURNAMENT_ID = '67f0496a8f8debcc88f45174'; // IMPORTANT: Assumed to be the Debate ID for this test
const ADMIN_USERNAME = 'tempadmin';
const JUDGE_EMAIL = 'aibek@turan.edu.kz'; // Using judge_aibek
const JUDGE_PASSWORD = 'password123'; // All test users share this password

let mongoClient;

async function connectDB() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI not found in .env file');
    }
    if (!mongoClient || !mongoClient.topology || !mongoClient.topology.isConnected()) {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        console.log('Connected to MongoDB...');
    }
    return mongoClient.db(); // Use the default database specified in URI
}

async function closeDB() {
    if (mongoClient) {
        await mongoClient.close();
        console.log('MongoDB connection closed.');
        mongoClient = null;
    }
}

async function getJudgeIdByEmail(db, email) { // Function definition
    { // Opening brace for function body
        try {
            console.log(`Fetching judge ID for email: ${email}`);
            const user = await db.collection('users').findOne({ email: email }, { projection: { _id: 1 } });
            if (user) {
                console.log(`Found judge ID: ${user._id}`);
                return user._id; // Returns ObjectId
            } else {
                console.error(`Judge with email ${email} not found.`);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching judge ID for ${email}:`, error);
            throw error;
        }
    } // Closing brace for function body
}

async function getJudgeToken() {
    try {
        console.log(`Attempting login for judge ${JUDGE_EMAIL}...`);
        const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
            email: JUDGE_EMAIL,
            password: JUDGE_PASSWORD,
        });
        if (response.data && response.data.token) {
            console.log('Judge login successful.');
            return response.data.token;
        } else {
            throw new Error('Token not found in login response');
        }
    } catch (error) {
        console.error('Judge login failed:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function findScheduledPosting(db) {
    try {
        console.log(`Searching for an UNEVALUATED scheduled posting in debate ${TOURNAMENT_ID}...`);
        // IMPORTANT: This function searches the 'debates' collection using TOURNAMENT_ID.
        // Assuming TOURNAMENT_ID is the Debate ID and postings are an array within it.
        const debateDoc = await db.collection('debates').findOne({ _id: new ObjectId(TOURNAMENT_ID) });

        if (!debateDoc || !debateDoc.postings || debateDoc.postings.length === 0) {
            console.log('Debate document not found or has no postings.');
            return null;
        }

        // Filter for scheduled postings with both teams within the specific debate
        const candidatePostings = debateDoc.postings.filter(p =>
            p.status === 'scheduled' && p.team1 && p.team2
        );

        if (candidatePostings.length === 0) {
            console.log('No scheduled postings with two teams found in this debate.');
            return null;
        }

        console.log(`Found ${candidatePostings.length} candidate scheduled postings. Checking evaluation status...`);

        const evaluationsCollection = db.collection('apfevaluations');
        const judgeId = await getJudgeIdByEmail(db, JUDGE_EMAIL); // Need judgeId to check specific judge's eval
        if (!judgeId) {
             console.error("Could not get judge ID to check evaluations.");
             return null; // Or handle error appropriately
        }

        for (const posting of candidatePostings) {
            const postingIdStr = posting._id.toString();
            console.log(`Checking posting ID: ${postingIdStr} for judge ${judgeId}`);
            // Check if an evaluation exists for this specific debate *and* judge
            const existingEvaluation = await evaluationsCollection.findOne({
                 debateId: new ObjectId(TOURNAMENT_ID), // The ID of the debate document
                 judgeId: judgeId,
                 // Optionally, could also check for postingId if evaluations store it
                 // gameId: postingIdStr // If gameId in evaluation refers to posting._id
             });

            if (!existingEvaluation) {
                // Found an unevaluated posting *for this judge*
                console.log(`Found UNEVALUATED scheduled posting for this judge: ID ${postingIdStr}`);
                return {
                    postingId: postingIdStr, // This is the ID within the postings array
                    team1Id: posting.team1?.toString(),
                    team2Id: posting.team2?.toString()
                };
            } else {
                console.log(`Posting ID ${postingIdStr} has already been evaluated by this judge. Skipping.`);
            }
        }

        // If loop completes, all scheduled postings were evaluated *by this judge*
        console.log('All candidate scheduled postings in this debate have already been evaluated by this judge.');
        return null;

    } catch (error) {
        console.error('Error finding scheduled posting:', error);
        throw error;
    }
}


async function submitEvaluation(token, postingId, winningTeamId) {
    try {
        console.log(`Submitting evaluation for posting ${postingId}, winner: ${winningTeamId}`);
        // IMPORTANT: The payload needs 'debateId', matching the deletion logic.
        // The API endpoint uses the main Debate ID (TOURNAMENT_ID) in the URL.
        // Adjust payload based on actual API requirements for identifying the specific posting if needed.
        const payload = {
            gameId: postingId, // Correctly passing postingId as gameId
            // postingId: postingId, // May be needed if API expects it to identify sub-document
            winningTeamId: winningTeamId,
            // Provide minimal valid speakerScores if required by schema/controller
            speakerScores: [
                { speaker: 'dummySpeaker1', score: 75, role: 'dummyRole1' },
                { speaker: 'dummySpeaker2', score: 75, role: 'dummyRole2' }
            ],
            // Add other required fields with dummy data if necessary
        };

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // The URL uses TOURNAMENT_ID which is assumed to be the Debate ID
        const response = await axios.post(`${API_BASE_URL}/api/apf/${TOURNAMENT_ID}/evaluate`, payload, config);
        console.log(`API evaluation submission successful. Status: ${response.status}`);
        return response.status;
    } catch (error) {
        console.error('API evaluation submission failed:', error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message);
        throw error; // Re-throw to indicate failure
    }
}


async function verifyLoserStats(db, losingTeamId) {
    try {
        console.log(`Verifying stats for losing team ${losingTeamId} in debate ${TOURNAMENT_ID}...`);
        // Fetching the specific Debate document
        const debateDoc = await db.collection('debates').findOne(
            { _id: new ObjectId(TOURNAMENT_ID) },
            { projection: { teams: 1 } } // Only fetch the teams array within the debate
        );

        if (!debateDoc || !debateDoc.teams) {
            console.log('Debate document or teams array not found during verification.');
            return null;
        }

        // Find the team object matching the losing team ID within the debate's teams array
        const losingTeamObject = debateDoc.teams.find(team => team._id && team._id.toString() === losingTeamId);


        if (!losingTeamObject) {
            console.log(`Losing team object with ID ${losingTeamId} not found in debate teams array.`);
            return null;
        }

        console.log(`Found losing team object: ${JSON.stringify(losingTeamObject)}`);
        // Assuming the stats (losses, points) are directly on this team object within the debate
        return {
            losses: losingTeamObject.losses,
            points: losingTeamObject.points
        };
    } catch (error) {
        console.error('Error verifying loser stats:', error);
        throw error;
    }
}


async function runTest() {
    let token;
    let postingInfo;
    let apiStatus;
    let finalStats;
    let db;
    let reportData = { // Object to hold data for the final report
        debateId: TOURNAMENT_ID, // Changed from tournamentId for clarity
        postingId: null,
        winningTeamId: null,
        losingTeamId: null,
        apiStatus: null,
        finalLosses: null,
        finalPoints: null,
        error: null,
        message: null
    };

    try {
        token = await getJudgeToken();
        db = await connectDB();

        // Get Judge ID
        const judgeId = await getJudgeIdByEmail(db, JUDGE_EMAIL);
        if (!judgeId) {
            throw new Error(`Could not find judge with email ${JUDGE_EMAIL}`);
        }

        // Delete prior evaluations for this judge and debate
        const debateObjectId = new ObjectId(TOURNAMENT_ID);
        const deleteResult = await db.collection('apfevaluations').deleteMany({
            debateId: debateObjectId,
            judgeId: judgeId // judgeId is already an ObjectId from the fetch
        });
        console.log(`Deleted ${deleteResult.deletedCount} prior evaluation(s) for judge ${JUDGE_EMAIL} and debate ${TOURNAMENT_ID}.`);


        postingInfo = await findScheduledPosting(db); // This now searches within the specific debate
        if (!postingInfo || !postingInfo.team1Id || !postingInfo.team2Id) {
            reportData.message = "Could not find a suitable unevaluated scheduled posting for this judge in the specified debate.";
            console.log(reportData.message);
            return reportData; // Return early if no suitable posting found
        }
        reportData.postingId = postingInfo.postingId; // ID of the posting within the debate

        // Designate winner and loser
        reportData.winningTeamId = postingInfo.team1Id;
        reportData.losingTeamId = postingInfo.team2Id;
        console.log(`Designated Winner: ${reportData.winningTeamId}, Loser: ${reportData.losingTeamId}`);

        // Pass postingId (from within debate) and winningTeamId
        reportData.apiStatus = await submitEvaluation(token, reportData.postingId, reportData.winningTeamId);

        // Short delay to allow potential async updates to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        // Re-fetch DB connection if necessary (might not be needed if connection persists)
        db = await connectDB();
        finalStats = await verifyLoserStats(db, reportData.losingTeamId); // Verifies within the debate doc

        if (finalStats) {
            reportData.finalLosses = finalStats.losses;
            reportData.finalPoints = finalStats.points;
            reportData.message = "Verification complete. Check if the final stats match expected values.";
            console.log(`Final Losing Team Stats in DB => Losses: ${reportData.finalLosses}, Points: ${reportData.finalPoints}`);
        } else {
            reportData.message = "Could not verify final stats for the losing team in the database.";
            console.log(reportData.message);
        }

    } catch (error) {
        reportData.error = error.message;
        console.error('\n--- Test Failed ---');
        console.error('An error occurred during the test:', error.message);
        console.error('--- End Test Failure ---');
    } finally {
        await closeDB();
    }
    return reportData; // Return the collected data
}

// Execute and capture report data for attempt_completion
runTest().then(reportData => {
    // Store report data or pass it to the next step/tool
    // For now, we'll just log it again for clarity before attempting completion
    console.log("\n--- Final Report Data ---");
    console.log(JSON.stringify(reportData, null, 2));
    console.log("--- End Final Report Data ---");

    // Now you would typically use this reportData in the attempt_completion tool
    // This console log simulates making the data available for the next step.
    // In a real scenario, this data would be used in the <attempt_completion> call.
    process.exit(0); // Exit cleanly after logging
}).catch(err => {
    console.error("Script execution failed:", err);
    process.exit(1); // Exit with error code
});