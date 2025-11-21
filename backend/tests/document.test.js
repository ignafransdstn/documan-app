const { describe, it, expect, beforeAll, beforeEach, afterAll } = require('@jest/globals');
const request = require('supertest');
const { app } = require('../src/app');
const { User, Document, SubDocument } = require('../src/models');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

describe('Document Management Endpoints', () => {
  let adminToken, level1Token, level2Token, level3Token;
  let adminUser, level1User, level2User, level3User;

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
    },
    level2: {
      username: 'level2user',
      email: 'level2@example.com',
      password: 'pass123',
      userLevel: 'level2'
    },
    level3: {
      username: 'level3user',
      email: 'level3@example.com',
      password: 'pass123',
      userLevel: 'level3'
    }
  };

  beforeAll(async () => {
    // Create test users
    adminUser = await User.create(testUsers.admin);
    level1User = await User.create(testUsers.level1);
    level2User = await User.create(testUsers.level2);
    level3User = await User.create(testUsers.level3);

    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser.id, username: adminUser.username, userLevel: 'admin' },
      process.env.JWT_SECRET
    );
    level1Token = jwt.sign(
      { id: level1User.id, username: level1User.username, userLevel: 'level1' },
      process.env.JWT_SECRET
    );
    level2Token = jwt.sign(
      { id: level2User.id, username: level2User.username, userLevel: 'level2' },
      process.env.JWT_SECRET
    );
    level3Token = jwt.sign(
      { id: level3User.id, username: level3User.username, userLevel: 'level3' },
      process.env.JWT_SECRET
    );
  });

  beforeEach(async () => {
    // Clean up documents before each test
    await Document.destroy({ where: {} });
    await SubDocument.destroy({ where: {} });
  });

  describe('POST /api/documents', () => {
    const testFile = path.join(__dirname, 'test.pdf');
    
    beforeAll(async () => {
      // Create test file
      await fs.writeFile(testFile, 'Test content');
    });

    afterAll(async () => {
      // Clean up test file
      await fs.unlink(testFile);
    });

    it('should allow admin to create document', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('document', testFile)
        .field('title', 'Test Document')
        .field('location', 'Test Location')
        .field('status', 'active');

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Document');
    });

    it('should not allow level3 user to create document', async () => {
      const res = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${level3Token}`)
        .attach('document', testFile)
        .field('title', 'Test Document')
        .field('location', 'Test Location')
        .field('status', 'active');

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/documents', () => {
    beforeEach(async () => {
      // Create test document
      await Document.create({
        title: 'Test Document',
        filePath: '/test/path',
        location: 'Test Location',
        status: 'active',
        createdBy: adminUser.id
      });
    });

    it('should allow all users to get documents', async () => {
      const res = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${level3Token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });
  });

  describe('PUT /api/documents/:id', () => {
    let documentId;

    beforeEach(async () => {
      const doc = await Document.create({
        title: 'Test Document',
        filePath: '/test/path',
        location: 'Test Location',
        status: 'active',
        createdBy: adminUser.id
      });
      documentId = doc.id;
    });

    it('should allow admin to update document', async () => {
      const res = await request(app)
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Document',
          location: 'Updated Location',
          status: 'archived'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe('Updated Document');
    });

    it('should not allow level3 user to update document', async () => {
      const res = await request(app)
        .put(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${level3Token}`)
        .send({
          title: 'Updated Document',
          location: 'Updated Location',
          status: 'archived'
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/documents/:id', () => {
    let documentId;

    beforeEach(async () => {
      const doc = await Document.create({
        title: 'Test Document',
        filePath: '/test/path',
        location: 'Test Location',
        status: 'active',
        createdBy: adminUser.id
      });
      documentId = doc.id;
    });

    it('should allow admin to delete document', async () => {
      const res = await request(app)
        .delete(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('should not allow level2 or level3 users to delete document', async () => {
      const res = await request(app)
        .delete(`/api/documents/${documentId}`)
        .set('Authorization', `Bearer ${level2Token}`);

      expect(res.statusCode).toBe(403);
    });
  });
});