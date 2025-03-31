const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const userRoutes = require('../../routes/userRoutes');
const dbSetup = require('../setup');

// Create express app for testing routes
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

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

describe('User Routes - Organizer Promotion', () => {
  let adminUser, regularUser, anotherUser, organizerUser;

  beforeEach(async () => {
    // Create an organizer user who will be the admin (first organizer)
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'organizer'
    });

    // Create a second organizer user who is not an admin
    organizerUser = await User.create({
      username: 'organizer2',
      email: 'organizer2@example.com',
      password: 'password123',
      role: 'organizer'
    });

    // Create regular users
    regularUser = await User.create({
      username: 'regular',
      email: 'regular@example.com',
      password: 'password123',
      role: 'user'
    });

    anotherUser = await User.create({
      username: 'another',
      email: 'another@example.com',
      password: 'password123',
      role: 'user'
    });
  });

  describe('POST /api/users/promote-organizer', () => {
    it('should allow the admin to promote a user to organizer', async () => {
      const token = generateToken(adminUser._id);
      
      const res = await request(app)
        .post('/api/users/promote-organizer')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: regularUser._id });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', `${regularUser.username} has been promoted to organizer`);
      
      // Verify that user was promoted in the database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.role).toBe('organizer');
    });

    it('should prevent non-admin organizers from promoting users', async () => {
      const token = generateToken(organizerUser._id);
      
      const res = await request(app)
        .post('/api/users/promote-organizer')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: regularUser._id });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('message', 'Access denied: Only administrators can perform this action');
      
      // Verify that user was not promoted
      const user = await User.findById(regularUser._id);
      expect(user.role).toBe('user');
    });

    it('should prevent regular users from promoting other users', async () => {
      const token = generateToken(regularUser._id);
      
      const res = await request(app)
        .post('/api/users/promote-organizer')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: anotherUser._id });

      expect(res.statusCode).toBe(403);
      
      // Verify that user was not promoted
      const user = await User.findById(anotherUser._id);
      expect(user.role).toBe('user');
    });

    it('should return 400 if userId is not provided', async () => {
      const token = generateToken(adminUser._id);
      
      const res = await request(app)
        .post('/api/users/promote-organizer')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'User ID is required');
    });

    it('should return 404 if user to promote does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const token = generateToken(adminUser._id);
      
      const res = await request(app)
        .post('/api/users/promote-organizer')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: nonExistentId });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should prevent unauthorized access to promotion endpoint', async () => {
      const res = await request(app)
        .post('/api/users/promote-organizer')
        .send({ userId: regularUser._id });

      expect(res.statusCode).toBe(401);
    });
  });
});