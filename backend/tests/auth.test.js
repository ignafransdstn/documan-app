const { describe, it, expect, beforeEach } = require('@jest/globals');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { app } = require('../src/app');
const { User } = require('../src/models');
const { createTestUser, generateToken, clearDatabase, testUsers } = require('./helpers');

describe('Authentication Endpoints', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    userLevel: 'level3'
  };

  const adminUser = {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    userLevel: 'admin'
  };

  beforeEach(async () => {
    await User.destroy({ where: {} }); // Clean up users before each test
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.username).toBe(testUser.username);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not register a user with existing username', async () => {
      await User.create({
        ...testUser,
        password: await bcrypt.hash(testUser.password, 10)
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.username).toBe(testUser.username);
    });

    it('should fail with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let token;

    beforeEach(async () => {
      const user = await User.create(testUser);
      token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should refresh token successfully', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const user = await User.create(testUser);
      token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should get user profile successfully', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe(testUser.username);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body).not.toHaveProperty('password');
    });
  });
});