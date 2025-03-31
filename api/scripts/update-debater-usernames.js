require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  ssl: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ MongoDB Atlas connection established successfully');
  updateDebaterUsernames(); // Start the update process
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  console.error('Error details:', err.message);
  process.exit(1);
});

async function updateDebaterUsernames() {
  try {
    // Find all users with usernames that start with 'debater_'
    const debaters = await User.find({ username: /^debater_/ });
    
    if (debaters.length === 0) {
      console.log('No debaters found with "debater_" prefix in their usernames.');
      process.exit(0);
    }
    
    console.log(`Found ${debaters.length} debaters to update.`);
    
    // Track successful and failed updates
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      users: []
    };
    
    // Process each debater
    for (const debater of debaters) {
      // Extract the name part and remove trailing numbers
      const oldUsername = debater.username;
      let newUsername = oldUsername.replace('debater_', '');
      
      // Remove trailing numbers
      newUsername = newUsername.replace(/[0-9]+$/, '');
      
      // Capitalize first letter
      newUsername = newUsername.charAt(0).toUpperCase() + newUsername.slice(1);
      
      console.log(`Updating ${oldUsername} to ${newUsername}`);
      
      try {
        // Check if this new username would be a duplicate
        const existingUser = await User.findOne({ 
          username: newUsername, 
          _id: { $ne: debater._id } // exclude the current user
        });
        
        if (existingUser) {
          console.log(`⚠️ Cannot update ${oldUsername}: Username ${newUsername} already exists`);
          results.skipped++;
          results.users.push({
            id: debater._id,
            oldUsername,
            status: 'skipped (duplicate)',
            name: debater.name || null
          });
          continue;
        }
        
        // Update the username
        debater.username = newUsername;
        
        // If the user doesn't have a 'name' field set, set it to the new username
        if (!debater.name) {
          debater.name = newUsername;
        }
        
        await debater.save();
        
        console.log(`✅ Successfully updated ${oldUsername} to ${newUsername}`);
        results.success++;
        results.users.push({
          id: debater._id,
          oldUsername,
          newUsername,
          status: 'updated',
          name: debater.name
        });
      } catch (err) {
        console.error(`❌ Failed to update ${oldUsername}:`, err.message);
        results.failed++;
        results.users.push({
          id: debater._id,
          oldUsername,
          status: 'failed',
          error: err.message,
          name: debater.name || null
        });
      }
    }
    
    // Print summary
    console.log('\n--- Update Summary ---');
    console.log(`Total debaters processed: ${debaters.length}`);
    console.log(`✅ Successfully updated: ${results.success}`);
    console.log(`⚠️ Skipped (duplicates): ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    console.log('Done updating debater usernames!');
  } catch (error) {
    console.error('Error in update process:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}
