const request = require('supertest');
const { app } = require('../src/app');
const { User } = require('../src/models');
const { createTestUser, generateToken, clearDatabase, testUsers } = require('./helpers');

beforeEach(async () => {
  await clearDatabase();
});

describe('Admin-only /api/auth/register', () => {
  test('rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newuser', password: 'Abc!1234', email: 'n@example.com' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  test('rejects non-admin authenticated users', async () => {
    const user = await createTestUser(testUsers.level3);
    const token = generateToken(user);

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'newuser2', password: 'Abc!1234', email: 'n2@example.com' });

    expect(res.statusCode).toBe(403);
  });

  test('admin can register a valid user', async () => {
    const admin = await createTestUser(testUsers.admin);
    const token = generateToken(admin);

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'createdbyadmin', password: 'Abc!1234', email: 'created@example.com', userLevel: 'level1' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.username).toBe('createdbyadmin');
  });

  test('admin gets validation error for bad payload', async () => {
    const admin = await createTestUser(testUsers.admin);
    const token = generateToken(admin);

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'bad user', password: 'weak', email: 'not-an-email' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});
