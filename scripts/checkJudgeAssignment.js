// scripts/checkJudgeAssignment.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// --- Configuration ---
// Determine project root assuming script is in /scripts and api is sibling
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRoot, 'api', '.env');
const debateModelPath = path.resolve(projectRoot, 'api', 'models', 'Debate');
const userModelPath = path.resolve(projectRoot, 'api', 'models', 'User');

// --- Load Environment Variables ---
const dotenvResult = dotenv.config({ path: envPath });
if (dotenvResult.error) {
    console.warn(`Warning: Could not load .env file from ${envPath}. Ensure it exists and MONGODB_URI is set if needed.`);
}

// --- Argument Parsing ---
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Error: Missing required arguments.');
    console.error('Usage: node scripts/checkJudgeAssignment.js <tournamentId> <judgeIdToCheck>');
    console.error('Example: node scripts/checkJudgeAssignment.js 67f895cd0d84abb3011f1140 67f0495f8f8debcc88f4514c');
    process.exit(1);
}
const [tournamentId, judgeIdToCheck] = args;

// Validate ObjectIds (basic check)
if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
    console.error(`Error: Invalid Tournament ID format: ${tournamentId}`);
    process.exit(1);
}
if (!mongoose.Types.ObjectId.isValid(judgeIdToCheck)) {
    console.error(`Error: Invalid Judge ID format: ${judgeIdToCheck}`);
    process.exit(1);
}

// --- Model Loading ---
let Debate, User;
try {
    Debate = require(debateModelPath);
    User = require(userModelPath);
} catch (err) {
    console.error(`Error loading models:`, err);
    console.error(`Ensure models exist at ${debateModelPath} and ${userModelPath}`);
    process.exit(1);
}

// --- Main Logic ---
const checkJudgeAssignment = async () => {
    const dbUri = process.env.MONGODB_URI;

    if (!dbUri) {
        console.error('Error: MONGODB_URI environment variable not set.');
        console.error(`Please ensure MONGODB_URI is defined in your environment or in ${envPath}`);
        process.exit(1);
    }

    let connection; // Keep track of the connection

    try {
        console.log(`Connecting to MongoDB...`);
        // Use createConnection to get a connection object we can explicitly close
        connection = await mongoose.createConnection(dbUri, {
            serverSelectionTimeoutMS: 30000, // 30 seconds
            socketTimeoutMS: 45000 // 45 seconds
        }).asPromise(); // Ensure it returns a promise
        console.log('MongoDB Connected Successfully.');

        // Use the connection for models
        const DebateModel = connection.model('Debate', Debate.schema);
        const UserModel = connection.model('User', User.schema);

        // 1. Validate Judge ID
        console.log(`Validating Judge ID: ${judgeIdToCheck}...`);
        const judgeUser = await UserModel.findById(judgeIdToCheck).lean();

        if (!judgeUser) {
            console.error(`Error: Judge with ID ${judgeIdToCheck} not found in the User collection.`);
            process.exit(1);
        }
        if (judgeUser.role !== 'judge') {
            console.error(`Error: User ${judgeIdToCheck} (${judgeUser.username}) exists but is not a judge (role: ${judgeUser.role}).`);
            process.exit(1);
        }
        console.log(`Judge ${judgeIdToCheck} (${judgeUser.username}) validated successfully.`);

        // 2. Find Debates and Check Assignments
        console.log(`Searching for debates in tournament ID: ${tournamentId}`);
        const debates = await DebateModel.find({ tournament: tournamentId })
            .select('judges postings.judges postings._id round') // Select necessary fields
            .maxTimeMS(60000)
            .lean();

        if (!debates || debates.length === 0) {
            console.log(`RESULT: No debates found for tournament ID ${tournamentId}.`);
            return;
        }

        console.log(`Found ${debates.length} debates for tournament ID ${tournamentId}. Checking for judge ${judgeIdToCheck}...`);

        let judgeFoundCount = 0;
        let debatesCheckedCount = 0;
        const findings = []; // Store detailed findings

        for (const debate of debates) {
            debatesCheckedCount++;
            const debateIdentifier = debate._id ? debate._id.toString() : `Debate index ${debatesCheckedCount - 1}`;
            const roundInfo = debate.round ? ` (Round ${debate.round})` : '';
            let foundInThisDebate = false;
            const locationsFound = [];

            // Check top-level judges array
            if (debate.judges && debate.judges.length > 0) {
                const topLevelJudgeIds = debate.judges.map(j => j.toString());
                if (topLevelJudgeIds.includes(judgeIdToCheck)) {
                    foundInThisDebate = true;
                    locationsFound.push('top-level judges array');
                }
            }

            // Check judges array within each posting
            if (debate.postings && debate.postings.length > 0) {
                for (const posting of debate.postings) {
                    if (posting.judges && posting.judges.length > 0) {
                        const postingJudgeIds = posting.judges.map(j => j.toString());
                        if (postingJudgeIds.includes(judgeIdToCheck)) {
                            foundInThisDebate = true;
                            locationsFound.push(`posting ${posting._id ? posting._id.toString() : 'N/A'} judges array`);
                        }
                    }
                }
            }

            if (foundInThisDebate) {
                judgeFoundCount++;
                const finding = `FOUND Judge ${judgeIdToCheck} in Debate ${debateIdentifier}${roundInfo}. Locations: [${locationsFound.join(', ')}]`;
                console.log(`  ${finding}`);
                findings.push(finding);
            } else {
                 console.log(`  Judge ${judgeIdToCheck} NOT FOUND in Debate ${debateIdentifier}${roundInfo}.`);
            }
        }

        console.log('\n--- Verification Summary ---');
        console.log(`Checked ${debatesCheckedCount} debates for tournament ID ${tournamentId}.`);
        if (judgeFoundCount > 0) {
            console.log(`RESULT: Judge ${judgeIdToCheck} WAS FOUND in ${judgeFoundCount} debate(s).`);
            findings.forEach(f => console.log(`  - ${f}`));
        } else {
            console.log(`RESULT: Judge ${judgeIdToCheck} WAS NOT FOUND in any of the checked debates.`);
        }

    } catch (error) {
        console.error('\n--- Error during script execution ---');
        if (error.name === 'MongoServerSelectionError') {
            console.error('Database Connection Error:', error.message);
            console.error('Check if the MongoDB server is running and accessible with the provided MONGODB_URI.');
        } else {
            console.error('Error:', error);
        }
        console.log(`\nRESULT: An error occurred while checking judge assignment.`);
        process.exitCode = 1; // Indicate failure
    } finally {
        if (connection && connection.readyState === 1) { // Check if connection exists and is open
            await connection.close();
            console.log('MongoDB Connection Closed.');
        } else if (mongoose.connection.readyState === 1) {
             // Fallback if connection object wasn't assigned but default connection opened
             await mongoose.disconnect();
             console.log('Default MongoDB Connection Closed.');
        }
    }
};

checkJudgeAssignment();