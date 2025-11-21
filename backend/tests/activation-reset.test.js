const request = require('supertest');
const { app } = require('../src/app');
const { createTestUser, generateToken, clearDatabase, testUsers } = require('./helpers');
const { User } = require('../src/models');

beforeEach(async () => {
  await clearDatabase();
});

describe('Activation toggle and admin reset-password', () => {
  test('admin can deactivate and activate a non-admin user', async () => {
    const admin = await createTestUser(testUsers.admin);
    const user = await createTestUser(testUsers.level1);
    const token = generateToken(admin);

    // Deactivate
    const resDeactivate = await request(app)
      .patch(`/api/users/${user.id}/activation`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });

    expect(resDeactivate.statusCode).toBe(200);
    expect(resDeactivate.body).toHaveProperty('id', user.id);
    expect(resDeactivate.body).toHaveProperty('isActive', false);

    // Confirm user cannot login now
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: user.username, password: testUsers.level1.password });

    expect(loginRes.statusCode).toBe(403);

    // Activate back
    const resActivate = await request(app)
      .patch(`/api/users/${user.id}/activation`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: true });

    expect(resActivate.statusCode).toBe(200);
    expect(resActivate.body).toHaveProperty('isActive', true);
  });

  test('non-admin cannot toggle activation', async () => {
    const admin = await createTestUser(testUsers.admin);
    const level2 = await createTestUser(testUsers.level2);
    const token = generateToken(level2);

    const res = await request(app)
      .patch(`/api/users/${admin.id}/activation`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });

    expect(res.statusCode).toBe(403);
  });

  test('admin can reset another user password and user can login with new password', async () => {
    const admin = await createTestUser(testUsers.admin);
    const user = await createTestUser(testUsers.level3);
    const token = generateToken(admin);

    const newPassword = 'NewStrongP@ssw0rd';

    const res = await request(app)
      .post(`/api/users/${user.id}/reset-password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword });

    expect(res.statusCode).toBe(200);

    // Try login with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: user.username, password: newPassword });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
  });
});
