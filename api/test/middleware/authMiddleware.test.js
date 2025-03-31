const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const { protect, isOrganizer, isAdmin } = require('../../middleware/authMiddleware');
const dbSetup = require('../setup');

// Setup database connection before tests
beforeAll(async () => await dbSetup.connect());
afterEach(async () => await dbSetup.clearDatabase());
afterAll(async () => await dbSetup.closeDatabase());

describe('Auth Middleware', () => {
  describe('protect middleware', () => {
    it('should return 401 if no token is provided', async () => {
      const req = {
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should set user in req object and call next() if token is valid', async () => {
      // Create a user
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });

      // Mock jwt.verify to return our user's id
      jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: user._id }));

      const req = {
        headers: {
          authorization: 'Bearer validtoken'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      // Mock jwt.verify to throw an error
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const req = {
        headers: {
          authorization: 'Bearer invalidtoken'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isOrganizer middleware', () => {
    it('should call next() if user is an organizer', () => {
      const req = {
        user: { role: 'organizer' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      isOrganizer(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an organizer', () => {
      const req = {
        user: { role: 'user' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      isOrganizer(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied: Only organizers can perform this action' 
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin middleware', () => {
    it('should call next() if user is the first organizer', async () => {
      const req = {
        user: { role: 'organizer', isFirstOrganizer: true }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not the first organizer', async () => {
      const req = {
        user: { role: 'organizer', isFirstOrganizer: false }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied: Only administrators can perform this action' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});