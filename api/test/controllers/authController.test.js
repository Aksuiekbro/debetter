const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { expect } = require('chai');
const sinon = require('sinon');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../../models/User');
const authController = require('../../controllers/authController');

describe('Auth Controller Tests', function() {
  let mongoServer;
  
  before(async function() {
    // Create an in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  after(async function() {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async function() {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('Registration', function() {
    it('should register a new user with default role', async function() {
      // Setup request and response objects
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
          // No role specified
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Call the register function
      await authController.register(req, res);
      
      // Assertions
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
      
      // Check that the response has the right properties
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('username', 'testuser');
      expect(response).to.have.property('email', 'test@example.com');
      expect(response).to.have.property('role', 'user'); // Default role
      expect(response).to.have.property('token').that.is.a('string');
      
      // Verify user was saved in the database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).to.exist;
      expect(user.role).to.equal('user'); // Default role
    });

    it('should register a new user with organizer role', async function() {
      // Setup request with organizer role
      const req = {
        body: {
          username: 'organizer',
          email: 'organizer@example.com',
          password: 'password123',
          role: 'organizer'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Call the register function
      await authController.register(req, res);
      
      // Assertions
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.called).to.be.true;
      
      // Check that the response has the right properties with organizer role
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('username', 'organizer');
      expect(response).to.have.property('email', 'organizer@example.com');
      expect(response).to.have.property('role', 'organizer'); // Organizer role
      expect(response).to.have.property('token').that.is.a('string');
      
      // Verify user was saved in the database with organizer role
      const user = await User.findOne({ email: 'organizer@example.com' });
      expect(user).to.exist;
      expect(user.role).to.equal('organizer'); // Organizer role
    });

    it('should register a new user with judge role', async function() {
      // Setup request with judge role
      const req = {
        body: {
          username: 'judge',
          email: 'judge@example.com',
          password: 'password123',
          role: 'judge'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Call the register function
      await authController.register(req, res);
      
      // Assertions
      expect(res.status.calledWith(201)).to.be.true;
      
      // Check that the response has the right role
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('role', 'judge');
      
      // Verify user was saved with judge role
      const user = await User.findOne({ email: 'judge@example.com' });
      expect(user).to.exist;
      expect(user.role).to.equal('judge');
    });

    it('should not accept invalid roles', async function() {
      // Setup request with invalid role
      const req = {
        body: {
          username: 'invalid',
          email: 'invalid@example.com',
          password: 'password123',
          role: 'invalid-role'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Call the register function
      await authController.register(req, res);
      
      // The controller should either fall back to default role or reject the request
      // If it falls back to default:
      const user = await User.findOne({ email: 'invalid@example.com' });
      if (user) {
        // It fell back to default role
        expect(user.role).to.equal('user');
      } else {
        // It rejected the request
        expect(res.status.calledWith(400)).to.be.true;
      }
    });

    it('should not register a user with existing email', async function() {
      // First create a user
      await User.create({
        username: 'existing',
        email: 'existing@example.com',
        password: 'password123',
        role: 'user'
      });
      
      // Try to register with same email
      const req = {
        body: {
          username: 'newuser',
          email: 'existing@example.com',
          password: 'newpassword',
          role: 'organizer'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Call the register function
      await authController.register(req, res);
      
      // Should return 400 Bad Request
      expect(res.status.calledWith(400)).to.be.true;
      
      // Response should indicate user exists
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('message').that.includes('exists');
    });
  });

  describe('Login', function() {
    beforeEach(async function() {
      // Create test user before login tests
      const hashedPassword = await bcrypt.hash('password123', 12);
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user'
      });
      
      // Create organizer user
      const hashedOrganizerPassword = await bcrypt.hash('password123', 12);
      await User.create({
        username: 'organizer',
        email: 'organizer@example.com',
        password: hashedOrganizerPassword,
        role: 'organizer'
      });
    });
    
    it('should login successfully with correct credentials and return user role', async function() {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };
      
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
      
      await authController.login(req, res);
      
      // Should return user data with token
      expect(res.json.called).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('username', 'testuser');
      expect(response).to.have.property('email', 'test@example.com');
      expect(response).to.have.property('role', 'user'); // Check role
      expect(response).to.have.property('token').that.is.a('string');
    });
    
    it('should login with organizer role and return correct role', async function() {
      const req = {
        body: {
          email: 'organizer@example.com',
          password: 'password123'
        }
      };
      
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
      
      await authController.login(req, res);
      
      // Should return organizer role
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('role', 'organizer');
    });
    
    it('should fail login with incorrect password', async function() {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      };
      
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
      
      await authController.login(req, res);
      
      // Should return 401 Unauthorized
      expect(res.status.calledWith(401)).to.be.true;
    });
  });

  describe('Get Profile', function() {
    beforeEach(async function() {
      // Create test user before profile tests
      await User.create({
        _id: new mongoose.Types.ObjectId('5f8d0500f2d2f0325c93a3fb'),
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        bio: 'Test bio',
        interests: ['testing', 'coding']
      });
      
      // Create organizer user
      await User.create({
        _id: new mongoose.Types.ObjectId('5f8d0500f2d2f0325c93a3fc'),
        username: 'organizer',
        email: 'organizer@example.com',
        password: 'hashedpassword',
        role: 'organizer',
        bio: 'Organizer bio'
      });
    });
    
    it('should get user profile with role', async function() {
      const req = {
        user: { _id: '5f8d0500f2d2f0325c93a3fb' }
      };
      
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
      
      await authController.getProfile(req, res);
      
      // Should return profile data
      expect(res.json.called).to.be.true;
      const profile = res.json.firstCall.args[0];
      expect(profile).to.have.property('username', 'testuser');
      expect(profile).to.have.property('email', 'test@example.com');
      expect(profile).to.have.property('role', 'user'); // Check role
      expect(profile).to.have.property('bio', 'Test bio');
      expect(profile).to.have.property('interests').that.includes('testing', 'coding');
    });
    
    it('should get organizer profile with organizer role', async function() {
      const req = {
        user: { _id: '5f8d0500f2d2f0325c93a3fc' }
      };
      
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
      
      await authController.getProfile(req, res);
      
      // Should return organizer role
      const profile = res.json.firstCall.args[0];
      expect(profile).to.have.property('username', 'organizer');
      expect(profile).to.have.property('role', 'organizer'); // Check role
    });
  });

  describe('Role Preservation Bug Tests', function() {
    it('should preserve organizer role during registration', async function() {
      // Setup request with explicit organizer role
      const req = {
        body: {
          username: 'organizer_test',
          email: 'organizer_test@example.com',
          password: 'password123',
          role: 'organizer'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      
      // Call the register function
      await authController.register(req, res);
      
      // Get the response data
      const responseData = res.json.firstCall.args[0];
      console.log('Registration response:', responseData);
      
      // Specific assertions for the bug
      expect(responseData.role).to.equal('organizer', 'Role was changed from organizer in the response');
      
      // Check the database directly to verify the role was saved correctly
      const savedUser = await User.findOne({ email: 'organizer_test@example.com' });
      expect(savedUser).to.exist;
      expect(savedUser.role).to.equal('organizer', 'Role was not correctly saved as organizer in the database');
    });

    it('should not convert organizer role to user role', async function() {
      // This test specifically checks the bug where organizer was being converted to user
      
      // Direct database insert to test
      const testUser = await User.create({
        username: 'direct_organizer',
        email: 'direct_organizer@example.com',
        password: 'password123',
        role: 'organizer'
      });
      
      // Verify the role was saved correctly
      expect(testUser.role).to.equal('organizer');
      
      // Now let's retrieve it via the controller
      const req = {
        user: { _id: testUser._id }
      };
      
      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
      
      await authController.getProfile(req, res);
      
      // Verify the profile response includes the correct role
      const profile = res.json.firstCall.args[0];
      expect(profile).to.have.property('role', 'organizer', 'Role was changed from organizer when retrieving profile');
    });
  });
});