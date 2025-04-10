// scripts/retroactiveLoserStats.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Explicitly point to root .env
const mongoose = require('mongoose');
const Debate = require('../api/models/Debate'); // Use Debate model
const Team = require('../api/models/Team'); // Use Team model

// --- Configuration ---
const MONGODB_URI = process.env.MONGODB_URI; // Correct variable name
const TARGET_TOURNAMENT_ID = '67f0496a8f8debcc88f45174';
const BATCH_SIZE = 100; // Process debates in batches of 100
// --- End Configuration ---

async function updateLoserStats() {
    console.log('Connecting to MongoDB...');
    let connection; // Keep track of connection state
    try {
        if (!MONGODB_URI) {
            console.error('Error: MONGODB_URI environment variable is not set.');
            process.exit(1);
        }
        // Use createConnection for more control, especially over disconnection
        connection = await mongoose.createConnection(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000, // 30s timeout
            bufferCommands: false, // Disable command buffering
            autoIndex: false, // Disable auto-indexing for performance in scripts
            connectTimeoutMS: 15000, // Connection timeout
            socketTimeoutMS: 45000, // Socket timeout
        }).asPromise(); // Ensure it returns a promise

        console.log('MongoDB connected successfully.');

        const DebateModel = connection.model('Debate', Debate.schema);
        const TeamModel = connection.model('Team', Team.schema);

        console.log(`Fetching completed debates for tournament ID: ${TARGET_TOURNAMENT_ID} in batches of ${BATCH_SIZE}...`);

        let processedCount = 0;
        let allCompletedDebates = [];
        const teamIds = new Set();

        // Fetch debates in batches
        while (true) {
            console.log(`Fetching batch starting from index ${processedCount}...`);
            const debateBatch = await DebateModel.find({
                tournament: TARGET_TOURNAMENT_ID,
                status: 'completed',
                winner: { $exists: true, $ne: null }
            })
            .select('winner team1 team2 _id')
            .sort({ _id: 1 }) // Sort for consistent skipping
            .skip(processedCount)
            .limit(BATCH_SIZE)
            .lean(); // Use lean for performance if we don't need Mongoose documents

            if (!debateBatch || debateBatch.length === 0) {
                console.log('No more debates found in this batch. Finished fetching.');
                break; // Exit loop if no more debates
            }

            console.log(`Fetched ${debateBatch.length} debates in this batch.`);
            allCompletedDebates = allCompletedDebates.concat(debateBatch);

            // Collect team IDs from the batch
            debateBatch.forEach(debate => {
                if (debate.team1) teamIds.add(debate.team1.toString());
                if (debate.team2) teamIds.add(debate.team2.toString());
            });

            processedCount += debateBatch.length;

            if (debateBatch.length < BATCH_SIZE) {
                console.log('Last batch fetched.');
                break; // Exit if last batch was smaller than BATCH_SIZE
            }
        }


        if (allCompletedDebates.length === 0) {
            console.log(`No completed debates with winners found for tournament ID ${TARGET_TOURNAMENT_ID}.`);
            await connection.close();
            console.log('MongoDB connection closed.');
            return;
        }

        console.log(`Total completed debates fetched: ${allCompletedDebates.length}.`);

        // Fetch team data
        const uniqueTeamIds = Array.from(teamIds);
        console.log(`Found ${uniqueTeamIds.length} unique team IDs in debates. Fetching team data...`);
        const teams = await TeamModel.find({ _id: { $in: uniqueTeamIds } });
        if (!teams || teams.length === 0) {
            console.error('Could not fetch team documents for the IDs found in debates.');
            await connection.close();
            console.log('MongoDB connection closed.');
            return;
        }
        console.log(`Successfully fetched ${teams.length} team documents.`);

        // --- Process fetched data ---
        let updatedLoserStatsCount = 0;
        let teamsModified = false;
        let teamsToSave = new Map();
        const teamMap = new Map(teams.map(team => [team._id.toString(), team])); // Use fetched teams

        // Calculate expected losses based on ALL fetched debates
        const expectedLossesMap = new Map();
        uniqueTeamIds.forEach(teamId => expectedLossesMap.set(teamId, 0));

        allCompletedDebates.forEach(debate => {
            const winnerId = debate.winner.toString();
            const team1Id = debate.team1?.toString();
            const team2Id = debate.team2?.toString();

            if (team1Id && team1Id !== winnerId) {
                expectedLossesMap.set(team1Id, (expectedLossesMap.get(team1Id) || 0) + 1);
            }
            if (team2Id && team2Id !== winnerId) {
                expectedLossesMap.set(team2Id, (expectedLossesMap.get(team2Id) || 0) + 1);
            }
        });

        // Iterate through teams to check if updates are needed
        teams.forEach(team => {
            const teamId = team._id.toString();
            const currentLosses = team.losses || 0;
            const expectedLosses = expectedLossesMap.get(teamId) || 0;

            if (currentLosses < expectedLosses) {
                 // Calculate how many losses/points are missing
                 const lossesToAdd = expectedLosses - currentLosses;
                 console.log(`Updating stats for losing team: ${team.name} (ID: ${teamId}). Current losses: ${currentLosses}, Expected total losses: ${expectedLosses}. Adding ${lossesToAdd} loss(es) and point(s).`);

                 // Update losses and points directly to the expected state based on completed debates
                 team.losses = expectedLosses;
                 team.points = (team.points || 0) + lossesToAdd; // Add points for each missed loss

                 updatedLoserStatsCount += lossesToAdd; // Count updates based on missing losses
                 teamsModified = true;
                 teamsToSave.set(teamId, team);
            }
        });


        // --- Save updates ---
        if (teamsModified) {
            console.log(`Attempting to save updates for ${teamsToSave.size} teams...`);
            const updatePromises = [];
            teamsToSave.forEach((team, teamId) => {
                console.log(` - Saving Team ID: ${teamId}, Name: ${team.name}, Losses: ${team.losses}, Points: ${team.points}`);
                updatePromises.push(
                    TeamModel.updateOne({ _id: teamId }, { $set: { losses: team.losses, points: team.points } })
                );
            });

             try {
                 const results = await Promise.all(updatePromises);
                 console.log(`Team data saved successfully. Results: ${results.length} operations completed.`);
                 results.forEach((res, index) => {
                    // console.log(`   Result ${index + 1}: Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
                 });
             } catch(saveError) {
                 console.error('Error saving updated team data:', saveError);
             }
        } else {
            console.log('No updates were necessary based on the checks.');
        }

        console.log(`\n--- Script Summary ---`);
        console.log(`Tournament ID Checked: ${TARGET_TOURNAMENT_ID}`);
        console.log(`Completed Debates checked: ${allCompletedDebates.length}`);
        console.log(`Total retroactive losses/points added: ${updatedLoserStatsCount}`);
        console.log(`Teams updated: ${teamsToSave.size}`);
        console.log(`--- End Summary ---`);

    } catch (error) {
        console.error('An error occurred during the script execution:', error);
        process.exitCode = 1; // Indicate failure
    } finally {
        if (connection && connection.readyState === 1) { // 1 === open
            try {
                await connection.close();
                console.log('MongoDB connection closed.');
            } catch (disconnectError) {
                console.error('Error disconnecting from MongoDB:', disconnectError);
            }
        } else {
            console.log('MongoDB connection already closed or not established.');
        }
    }
}

updateLoserStats();