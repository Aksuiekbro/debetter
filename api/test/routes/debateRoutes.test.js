const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Debate = require('../../models/Debate');
const debateRoutes = require('../../routes/debateRoutes');
const dbSetup = require('../setup');
const { protect, isOrganizer } = require('../../middleware/authMiddleware');

// Create express app for testing routes
const app = express();
app.use(express.json());
app.use('/api/debates', debateRoutes);

// Setup database connection before tests
beforeAll(async () => await dbSetup.connect());
afterEach(async () => await dbSetup.clearDatabase());
afterAll(async () => await dbSetup.closeDatabase());

// Helper function to generate token for a user
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '1h'
  });
};

describe('Debate Routes - Organizer Role Restrictions', () => {
  let organizerUser, regularUser;

  beforeEach(async () => {
    // Create an organizer user and a regular user
    organizerUser = await User.create({
      username: 'organizer',
      email: 'organizer@example.com',
      password: 'password123',
      role: 'organizer'
    });

    regularUser = await User.create({
      username: 'regular',
      email: 'regular@example.com',
      password: 'password123',
      role: 'user'
    });
  });

  describe('POST /api/debates', () => {
    it('should allow an organizer to create a debate', async () => {
      const token = generateToken(organizerUser._id);
      const debateData = {
        title: 'Test Debate',
        description: 'This is a test debate',
        category: 'politics',
        difficulty: 'intermediate',
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        format: 'standard'
      };

      const res = await request(app)
        .post('/api/debates')
        .set('Authorization', `Bearer ${token}`)
        .send(debateData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('title', debateData.title);

      // Verify that debate was created in database
      const debate = await Debate.findOne({ title: debateData.title });
      expect(debate).not.toBeNull();
      expect(debate.creator.toString()).toBe(organizerUser._id.toString());
    });

    it('should prevent a regular user from creating a debate', async () => {
      const token = generateToken(regularUser._id);
      const debateData = {
        title: 'Test Debate by Regular User',
        description: 'This should not be allowed',
        category: 'science',
        difficulty: 'beginner',
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        format: 'standard'
      };

      const res = await request(app)
        .post('/api/debates')
        .set('Authorization', `Bearer ${token}`)
        .send(debateData);

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Access denied: Only organizers can perform this action');

      // Verify that no debate was created in database
      const debate = await Debate.findOne({ title: debateData.title });
      expect(debate).toBeNull();
    });

    it('should prevent unauthorized access to create debates', async () => {
      const debateData = {
        title: 'Test Debate No Auth',
        description: 'This should not be allowed',
        category: 'economics',
        difficulty: 'advanced',
        startDate: new Date(Date.now() + 86400000),
        format: 'standard'
      };

      const res = await request(app)
        .post('/api/debates')
        .send(debateData);

      expect(res.statusCode).toBe(401);
    });
  });
});