require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Load .env from project root
const { MongoClient } = require('mongodb');

async function findJudge() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not found. Ensure it is set in the .env file in the project root.');
    process.exit(1);
  }

  // Add specific options needed for Atlas connection if required, mirroring server.js if necessary
  const client = new MongoClient(uri, {
    useNewUrlParser: true, // Deprecated but might be needed depending on driver version
    useUnifiedTopology: true, // Deprecated but might be needed
    serverSelectionTimeoutMS: 5000, // Example option
    // ssl: true, // Often needed for Atlas
    // retryWrites: true, // Common Atlas setting
    // w: 'majority' // Common Atlas setting
  });


  try {
    await client.connect();
    console.log('✅ Connected to MongoDB'); // Added connection confirmation
    const db = client.db(); // Use default DB from URI, or specify if needed e.g., client.db("debate-platform")
    const usersCollection = db.collection('users');

    // Primary Goal: Find Head Judge
    console.log('🔍 Searching for Head Judge...');
    let judge = await usersCollection.findOne(
      { role: 'judge', judgeRole: 'Head Judge' },
      { projection: { _id: 1, username: 1, judgeRole: 1 } }
    );

    if (judge) {
      console.log('✅ Head Judge Found:');
      console.log(JSON.stringify({ status: 'Head Judge Found', user: judge }, null, 2)); // Pretty print JSON
    } else {
      console.log('ℹ️ No Head Judge found, searching for any judge...');
      // Fallback: Find any Judge
      judge = await usersCollection.findOne(
        { role: 'judge' },
        { projection: { _id: 1, username: 1, judgeRole: 1 } }
      );

      if (judge) {
        console.log('✅ Regular Judge Found:');
        console.log(JSON.stringify({ status: 'Judge Found (Not Head)', user: judge }, null, 2)); // Pretty print JSON
      } else {
        console.log('❌ No users with role "judge" found.');
        console.log(JSON.stringify({ status: 'No Judge Found' }));
      }
    }
  } catch (err) {
    console.error('❌ Error during database operation:', err);
    process.exit(1); // Exit with error code
  } finally {
    await client.close();
    console.log('✅ MongoDB connection closed'); // Added closing confirmation
  }
}

findJudge();