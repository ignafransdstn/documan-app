'use strict';

const request = require('supertest');
const { startServer } = require('../src/app');

let server;
let agent;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = 0; // ephemeral port
  server = await startServer();
  agent = request(server);
});

afterAll(async () => {
  if (server && server.close) await new Promise((res) => server.close(res));
});

test('E2E: register -> login -> get documents', async () => {
  const username = `e2e_${Date.now()}`;
  const email = `${username}@example.com`;
  const password = 'Password123!';

  // Register
  const reg = await agent
    .post('/api/auth/register')
    .send({ username, email, password })
    .set('Accept', 'application/json');

  expect(reg.status).toBe(201);
  expect(reg.body).toHaveProperty('token');

  // Login
  const login = await agent
    .post('/api/auth/login')
    .send({ username, password })
    .set('Accept', 'application/json');

  expect(login.status).toBe(200);
  expect(login.body).toHaveProperty('token');

  const token = login.body.token;

  // Get documents (should return an array)
  const docs = await agent
    .get('/api/documents')
    .set('Authorization', `Bearer ${token}`);

  expect(docs.status).toBe(200);
  expect(Array.isArray(docs.body)).toBe(true);
});
