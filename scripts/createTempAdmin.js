// scripts/createTempAdmin.js
require('dotenv').config(); // Load .env from the current directory
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const tempAdmin = {
  username: 'tempadmin',
  email: 'admin@temp.com',
  password: 'password123', // Plain text password
  role: 'admin'
};

async function createAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not found in .env file');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB...');

    const database = client.db(); // Use the default database
    const usersCollection = database.collection('users');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: tempAdmin.email });
    if (existingAdmin) {
      console.log(`Admin user with email ${tempAdmin.email} already exists.`);
      console.log('--- Temporary Admin Credentials ---');
      console.log(`Username: ${tempAdmin.username}`);
      console.log(`Email: ${tempAdmin.email}`);
      console.log(`Password: ${tempAdmin.password}`);
      console.log('---------------------------------');
      return; // Exit if user exists
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempAdmin.password, salt);

    // Create the admin user document
    const adminUserData = {
      username: tempAdmin.username,
      email: tempAdmin.email,
      password: hashedPassword,
      role: tempAdmin.role,
      createdAt: new Date(),
      updatedAt: new Date()
      // Add other default fields if necessary based on the schema
    };

    const result = await usersCollection.insertOne(adminUserData);
    console.log(`Successfully created temporary admin user with ID: ${result.insertedId}`);
    console.log('--- Temporary Admin Credentials ---');
    console.log(`Username: ${tempAdmin.username}`);
    console.log(`Email: ${tempAdmin.email}`);
    console.log(`Password: ${tempAdmin.password}`);
    console.log('---------------------------------');
    console.log('Please use these credentials to log in via the UI and obtain a JWT token.');


  } catch (err) {
    console.error('Error creating temporary admin user:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

createAdmin();