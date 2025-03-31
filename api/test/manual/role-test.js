/**
 * Manual test script to verify role preservation during registration
 * 
 * Run with: node test/manual/role-test.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../models/User');
const authController = require('../../controllers/authController');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for testing'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Test data
const testUsers = [
  {
    username: 'test_organizer',
    email: 'test_organizer@example.com',
    password: 'password123',
    role: 'organizer'
  },
  {
    username: 'test_judge',
    email: 'test_judge@example.com',
    password: 'password123',
    role: 'judge'
  },
  {
    username: 'test_user',
    email: 'test_user@example.com',
    password: 'password123',
    role: 'user'
  }
];

// Mock response object
const createMockResponse = () => {
  return {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    },
    statusCode: null,
    data: null
  };
};

// Run tests
async function runTests() {
  try {
    // Clean up test users
    console.log('Cleaning up test users...');
    await User.deleteMany({
      email: { $in: testUsers.map(u => u.email) }
    });

    // Test each user registration
    for (const userData of testUsers) {
      console.log(`\n--- Testing ${userData.role} role ---`);
      
      // Create mock request and response
      const req = { body: userData };
      const res = createMockResponse();
      
      // Register user
      console.log(`Registering ${userData.username} with role ${userData.role}...`);
      await authController.register(req, res);
      
      // Check response
      console.log(`Registration response status: ${res.statusCode}`);
      console.log(`Response role: ${res.data?.role}`);
      
      // Check database
      const savedUser = await User.findOne({ email: userData.email });
      if (savedUser) {
        console.log(`Database role: ${savedUser.role}`);
        
        // Verify role matches
        const roleMatches = savedUser.role === userData.role;
        console.log(`Role preserved correctly: ${roleMatches ? 'YES ✅' : 'NO ❌'}`);
        
        if (!roleMatches) {
          console.log(`ERROR: Expected role '${userData.role}' but got '${savedUser.role}'`);
        }
      } else {
        console.log('ERROR: User not saved to database');
      }
    }

    console.log('\n--- Test Summary ---');
    const allUsers = await User.find({
      email: { $in: testUsers.map(u => u.email) }
    });
    
    console.log('All test users:');
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.email}): Role = ${user.role}`);
    });
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nTests completed, MongoDB disconnected.');
  }
}

// Run the tests
runTests();