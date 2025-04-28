require('dotenv').config({ path: './api/.env' }); // Load environment variables from api/.env
const mongoose = require('mongoose');
const User = require('../api/models/User'); // Corrected path casing

const userIdToCheck = '680e871bfff6573d61390be7'; // The ID of the tempadmin user

async function checkUserRole() {
    console.log(`Connecting to MongoDB: ${process.env.MONGODB_URI ? 'URI found' : 'URI NOT FOUND'}`); // Corrected variable name
    if (!process.env.MONGODB_URI) { // Corrected variable name
        console.error('Error: MONGODB_URI not found in environment variables. Make sure api/.env is loaded.'); // Corrected variable name
        process.exit(1);
    }

    try {
        // Increase connection timeout options
        const connectionOptions = {
            serverSelectionTimeoutMS: 30000, // 30 seconds timeout for server selection
            socketTimeoutMS: 45000, // 45 seconds timeout for socket inactivity
            connectTimeoutMS: 30000 // 30 seconds timeout for initial connection
        };
        await mongoose.connect(process.env.MONGODB_URI, connectionOptions); // Corrected variable name and added options
        console.log('MongoDB Connected (with increased timeouts)');

        console.log(`Searching for user with ID: ${userIdToCheck}`);
        const user = await User.findById(userIdToCheck).select('username email role isTestAccount'); // Select relevant fields

        if (!user) {
            console.log(`User with ID ${userIdToCheck} not found.`);
        } else {
            console.log('User found:');
            console.log(`  Username: ${user.username}`);
            console.log(`  Email:    ${user.email}`);
            console.log(`  Role:     ${user.role}`);
            console.log(`  Test Acc: ${user.isTestAccount}`);
        }

    } catch (error) {
        console.error('Error checking user role:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
    }
}

checkUserRole();