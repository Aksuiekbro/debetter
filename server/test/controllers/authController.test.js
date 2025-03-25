const mongoose = require('mongoose');
const User = require('../../models/User');
const dbSetup = require('../setup');
const { register, login, promoteToOrganizer } = require('../../controllers/authController');

// Setup database connection before tests
beforeAll(async () => await dbSetup.connect());
afterEach(async () => await dbSetup.clearDatabase());
afterAll(async () => await dbSetup.closeDatabase());

describe('Auth Controller', () => {
  describe('register function', () => {
    it('should create a new user with user role when no role provided', async () => {
      const req = {
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      // Check if user was created with user role
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).not.toBeNull();
      expect(user.role).toBe('user');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create a new user with judge role when judge role provided', async () => {
      const req = {
        body: {
          username: 'judgeguy',
          email: 'judge@example.com',
          password: 'password123',
          role: 'judge'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      // Check if user was created with judge role
      const user = await User.findOne({ email: 'judge@example.com' });
      expect(user).not.toBeNull();
      expect(user.role).toBe('judge');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should not allow direct registration as organizer', async () => {
      const req = {
        body: {
          username: 'wannabeorganizer',
          email: 'organizer@example.com',
          password: 'password123',
          role: 'organizer'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      // Check that user was created but with user role instead of organizer
      const user = await User.findOne({ email: 'organizer@example.com' });
      expect(user).not.toBeNull();
      expect(user.role).toBe('user');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if user already exists', async () => {
      // First create a user
      await User.create({
        username: 'existinguser',
        email: 'exists@example.com',
        password: 'password123',
        role: 'user'
      });

      // Try to register again with the same email
      const req = {
        body: {
          username: 'newname',
          email: 'exists@example.com',
          password: 'newpassword'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
    });
  });

  describe('promoteToOrganizer function', () => {
    it('should promote a user to organizer role', async () => {
      // Create a regular user first
      const user = await User.create({
        username: 'regularuser',
        email: 'regular@example.com',
        password: 'password123',
        role: 'user'
      });

      const req = {
        body: {
          userId: user._id
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await promoteToOrganizer(req, res);

      // Check if user was promoted to organizer
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.role).toBe('organizer');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('has been promoted to organizer'),
        user: expect.objectContaining({
          role: 'organizer'
        })
      }));
    });

    it('should return 400 if userId is not provided', async () => {
      const req = {
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await promoteToOrganizer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    it('should return 404 if user not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const req = {
        body: {
          userId: nonExistentId
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await promoteToOrganizer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });
});