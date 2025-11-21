const { describe, it, expect, beforeAll } = require('@jest/globals');
const request = require('supertest');
const { app } = require('../src/app');
const { User } = require('../src/models');
const jwt = require('jsonwebtoken');

describe('User Management Endpoints', () => {
  let adminToken, level1Token, adminUser, level1User;

  const testUsers = {
    admin: {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      userLevel: 'admin'
    },
    level1: {
      username: 'level1user',
      email: 'level1@example.com',
      password: 'pass123',
      userLevel: 'level1'
    }
  };

  beforeAll(async () => {
    // Create test users
    adminUser = await User.create(testUsers.admin);
    level1User = await User.create(testUsers.level1);

    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser.id, username: adminUser.username, userLevel: 'admin' },
      process.env.JWT_SECRET
    );
    level1Token = jwt.sign(
      { id: level1User.id, username: level1User.username, userLevel: 'level1' },
      process.env.JWT_SECRET
    );
  });

  describe('GET /api/users', () => {
    it('should allow admin to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).not.toHaveProperty('password');
    });

    it('should not allow non-admin users to get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${level1Token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should allow users to get their own profile', async () => {
      const res = await request(app)
        .get(`/api/users/${level1User.id}`)
        .set('Authorization', `Bearer ${level1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe(testUsers.level1.username);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should allow admin to get any user profile', async () => {
      const res = await request(app)
        .get(`/api/users/${level1User.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe(testUsers.level1.username);
    });

    it('should not allow users to get other user profiles', async () => {
      const res = await request(app)
        .get(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${level1Token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should allow users to update their own profile', async () => {
      const updateData = {
        email: 'updated@example.com'
      };

      const res = await request(app)
        .put(`/api/users/${level1User.id}`)
        .set('Authorization', `Bearer ${level1Token}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(updateData.email);
    });

    it('should allow admin to update any user profile', async () => {
      const updateData = {
        email: 'adminupdated@example.com',
        userLevel: 'level2'
      };

      const res = await request(app)
        .put(`/api/users/${level1User.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.email).toBe(updateData.email);
      expect(res.body.userLevel).toBe(updateData.userLevel);
    });

    it('should not allow users to update other user profiles', async () => {
      const res = await request(app)
        .put(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${level1Token}`)
        .send({ email: 'hack@example.com' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/users/sessions', () => {
    it('should allow admin to get user sessions', async () => {
      const res = await request(app)
        .get('/api/users/sessions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should not allow non-admin users to get sessions', async () => {
      const res = await request(app)
        .get('/api/users/sessions')
        .set('Authorization', `Bearer ${level1Token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/users/:id/change-password', () => {
    it('should allow users to change their own password', async () => {
      const passwordData = {
        currentPassword: testUsers.level1.password,
        newPassword: 'newpassword123'
      };

      const res = await request(app)
        .post(`/api/users/${level1User.id}/change-password`)
        .set('Authorization', `Bearer ${level1Token}`)
        .send(passwordData);

      expect(res.statusCode).toBe(200);
    });

    it('should not allow password change with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const res = await request(app)
        .post(`/api/users/${level1User.id}/change-password`)
        .set('Authorization', `Bearer ${level1Token}`)
        .send(passwordData);

      expect(res.statusCode).toBe(401);
    });
  });
});