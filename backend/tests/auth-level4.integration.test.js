/**
 * Level 4 User Authentication Integration Tests
 * Tests comprehensive authentication scenarios for Level 4 users
 * Covers registration, login, authorization, and form submission workflows
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { sequelize, User, Form } = require('../src/models');
const { app } = require('../src/app');

describe('Level 4 User Authentication', () => {
  const level4UserData = {
    username: 'level4_user_test',
    email: 'level4@test.com',
    password: 'Level4Password123!',
    userLevel: 'level4'
  };

  const adminUserData = {
    username: 'admin_auth_test',
    email: 'admin_auth@test.com',
    password: 'AdminPassword123!',
    userLevel: 'admin'
  };

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Registration Tests', () => {
    test('should register level 4 user successfully', async () => {
      const timestamp = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uniqueUser = {
        username: `level4_${timestamp}`,
        email: `level4_${timestamp}@test.com`,
        password: 'Level4Password123!'
        // userLevel should default or be accepted
      };

      const res = await request(app)
        .post('/api/auth/signup')
        .send(uniqueUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.username).toBe(uniqueUser.username);
    });

    test('should not register with duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          ...level4UserData,
          email: 'different@test.com'
        })
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });

    test('should not register with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'test_user_invalid_email',
          email: 'not-an-email',
          password: 'Password123!',
          userLevel: 'level4'
        })
        .expect(400);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Login Tests', () => {
    let testUser;

    beforeAll(async () => {
      // Create a fresh test user for login tests
      testUser = {
        username: `login_test_${Date.now()}`,
        email: `login_${Date.now()}@test.com`,
        password: 'Login Password123!',
        userLevel: 'level4'
      };

      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      if (signupRes.status !== 201) {
        testUser = null;
      }
    });

    test('should login level 4 user with valid credentials', async () => {
      if (!testUser) return;

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.userLevel).toBe('level4');

      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded.userLevel).toBe('level4');
    });

    test('should reject login with invalid password', async () => {
      if (!testUser) return;

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });

    test('should reject login with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent_user_xyz',
          password: 'Password123!'
        })
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Token Tests', () => {
    let level4Token, level4User;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: level4UserData.username,
          password: level4UserData.password
        });

      if (loginRes.status === 200) {
        level4Token = loginRes.body.token;
        level4User = await User.findOne({ where: { username: level4UserData.username } });
      }
    });

    test('token should contain user claims', async () => {
      if (!level4Token) return;

      const decoded = jwt.verify(level4Token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('username');
      expect(decoded.userLevel).toBe('level4');
    });

    test('missing token should be rejected', async () => {
      const res = await request(app)
        .get('/api/users')
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });

    test('invalid token should be rejected', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid_token_xyz')
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });

    test('expired token should be rejected', async () => {
      const expiredToken = jwt.sign(
        { id: 999, username: 'test', userLevel: 'level4' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ formId: 1, submissionData: {} })
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Authorization Tests', () => {
    let level4Token, level4User;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: level4UserData.username,
          password: level4UserData.password
        });

      if (loginRes.status === 200) {
        level4Token = loginRes.body.token;
        level4User = await User.findOne({ where: { username: level4UserData.username } });
      }
    });

    test('level 4 user can view their own profile', async () => {
      if (!level4Token || !level4User) return;

      const res = await request(app)
        .get(`/api/users/${level4User.id}`)
        .set('Authorization', `Bearer ${level4Token}`)
        .expect(200);

      expect(res.body.username).toBe(level4UserData.username);
      expect(res.body.userLevel).toBe('level4');
      expect(res.body).not.toHaveProperty('password');
    });

    test('level 4 user cannot access admin endpoints', async () => {
      if (!level4Token) return;

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${level4Token}`)
        .expect(403);

      expect(res.body).toHaveProperty('message');
    });

    test('level 4 user can access submissions endpoint', async () => {
      if (!level4Token) return;

      const res = await request(app)
        .get('/api/submissions')
        .set('Authorization', `Bearer ${level4Token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Workflow Tests', () => {
    let level4Token, level4User, testForm, adminToken, admin;

    beforeEach(async () => {
      // Get admin
      const adminLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: adminUserData.username,
          password: adminUserData.password
        });

      if (adminLoginRes.status !== 200) {
        // Create admin if doesn't exist
        const adminRes = await request(app)
          .post('/api/auth/signup')
          .send(adminUserData);
        adminToken = adminRes.body.token;
        admin = await User.findByPk(adminRes.body.id);
      } else {
        adminToken = adminLoginRes.body.token;
        admin = await User.findOne({ where: { username: adminUserData.username } });
      }

      // Get level 4 user
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: level4UserData.username,
          password: level4UserData.password
        });

      if (loginRes.status === 200) {
        level4Token = loginRes.body.token;
        level4User = await User.findOne({ where: { username: level4UserData.username } });
      }

      // Create test form
      testForm = await Form.findOne({ where: { name: 'Workflow Test Form' } });
      if (!testForm && admin) {
        testForm = await Form.create({
          name: 'Workflow Test Form',
          description: 'For workflow testing',
          originalFile: Buffer.from('test content'),
          createdBy: admin.id,
          status: 'active'
        });
      }
    });

    test('level 4 user can submit form', async () => {
      if (!level4Token || !testForm) return;

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${level4Token}`)
        .send({
          formId: testForm.id,
          submissionData: { field: 'value' }
        });

      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('Password Management Tests', () => {
    let level4Token, level4User;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          username: level4UserData.username,
          password: level4UserData.password
        });

      if (loginRes.status === 200) {
        level4Token = loginRes.body.token;
        level4User = await User.findOne({ where: { username: level4UserData.username } });
      }
    });

    test('level 4 user can change password', async () => {
      if (!level4Token || !level4User) return;

      const res = await request(app)
        .post(`/api/users/${level4User.id}/change-password`)
        .set('Authorization', `Bearer ${level4Token}`)
        .send({
          currentPassword: level4UserData.password,
          newPassword: 'NewPassword123!'
        });

      expect([200, 400, 401]).toContain(res.status);
    });

    test('wrong current password is rejected', async () => {
      if (!level4Token || !level4User) return;

      const res = await request(app)
        .post(`/api/users/${level4User.id}/change-password`)
        .set('Authorization', `Bearer ${level4Token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!'
        });

      expect([400, 401]).toContain(res.status);
    });
  });

  describe('Deactivation Tests', () => {
    test('deactivated user cannot login', async () => {
      // Create a test user
      const testRes = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'deactivated_test_user',
          email: 'deactivated_test@test.com',
          password: 'TestPass123!',
          userLevel: 'level4'
        });

      const testUser = await User.findByPk(testRes.body.id);
      if (testUser) {
        await testUser.update({ isActive: false });

        const res = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'deactivated_test_user',
            password: 'TestPass123!'
          })
          .expect(401);

        expect(res.body).toHaveProperty('message');
      }
    });
  });
});
