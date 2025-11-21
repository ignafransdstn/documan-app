const request = require('supertest');
const { app } = require('../src/app');
const { User } = require('../src/models');

beforeEach(async () => {
  await User.destroy({ where: {} });
});

describe('Validation for signup/register', () => {
  test('signup rejects username with spaces', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'bad user', password: 'Abc!1234', email: 'ok@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('errors');
  });

  test('signup rejects weak password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'gooduser', password: 'weakpass', email: 'ok@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  test('signup rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'gooduser2', password: 'Abc!1234', email: 'not-an-email' });

    expect(res.statusCode).toBe(400);
  });

  test('signup accepts valid payload', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'validuser', password: 'Abc!1234', email: 'valid@example.com' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    // for non-admins should auto-login and return token
    expect(res.body).toHaveProperty('token');
  });
});
