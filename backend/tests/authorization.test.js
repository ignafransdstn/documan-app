const request = require('supertest');
const { app, startServer } = require('../src/app');
const { sequelize } = require('../src/models');
const { createTestUsers, generateToken, cleanupTestData } = require('./helpers');

let server;

describe('Authorization Tests', () => {
  let adminToken, level1Token, level2Token, level3Token;
  let adminUser, level1User, level2User, level3User;

  beforeAll(async () => {
    server = await startServer();
    await sequelize.sync({ force: true });
    [adminUser, level1User, level2User, level3User] = await createTestUsers();
    adminToken = generateToken(adminUser);
    level1Token = generateToken(level1User);
    level2Token = generateToken(level2User);
    level3Token = generateToken(level3User);
  });

  afterAll(async () => {
    await cleanupTestData();
    await server.close();
  });

  describe('Admin Authorization', () => {
    test('admin should have access to user management', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('admin should be able to modify user roles', async () => {
      const response = await request(app)
        .put(`/api/users/${level3User.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userLevel: 'level2' });
      expect(response.status).toBe(200);
      expect(response.body.userLevel).toBe('level2');
    });
  });

  describe('Level 1 Authorization', () => {
    test('level1 user should have access to document management', async () => {
      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${level1Token}`)
        .field('title', 'Test Document')
        .field('location', '/test/location')
        .attach('document', Buffer.from('test file content'), 'test.txt');
      expect(response.status).toBe(201);
    });

    test('level1 user should not have access to user management', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${level1Token}`);
      expect(response.status).toBe(403);
    });
  });

  describe('Level 2 Authorization', () => {
    test('level2 user should have limited document management access', async () => {
      const createResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${level2Token}`)
        .field('title', 'Level 2 Document')
        .field('location', '/test/level2')
        .attach('document', Buffer.from('test content'), 'test.txt');
      expect(createResponse.status).toBe(201);

      // Should be able to read documents
      const readResponse = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${level2Token}`);
      expect(readResponse.status).toBe(200);

      // Should not be able to delete documents
      const deleteResponse = await request(app)
        .delete(`/api/documents/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${level2Token}`);
      expect(deleteResponse.status).toBe(403);
    });
  });

  describe('Level 3 Authorization', () => {
    test('level3 user should only have read access', async () => {
      // Should be able to read documents
      const readResponse = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${level3Token}`);
      expect(readResponse.status).toBe(200);

      // Should not be able to create documents
      const createResponse = await request(app)
        .post('/api/documents')
        .set('Authorization', `Bearer ${level3Token}`)
        .field('title', 'Level 3 Document')
        .field('location', '/test/level3')
        .attach('document', Buffer.from('test content'), 'test.txt');
      expect(createResponse.status).toBe(403);

      // Should not be able to update documents
      const updateResponse = await request(app)
        .put('/api/documents/1')
        .set('Authorization', `Bearer ${level3Token}`)
        .send({ title: 'Updated Title' });
      expect(updateResponse.status).toBe(403);
    });
  });
});