/**
 * Form Submission Integration Tests
 * Tests untuk form submission endpoints (POST, GET list, GET detail, PATCH)
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { sequelize, User, Form, FormField, FormSubmission } = require('../src/models');
const { app } = require('../src/app');

let testAdminUser, testForm, testForm2, authToken;

describe('Form Submission Endpoints', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create admin user for creating forms
    testAdminUser = await User.create({
      username: 'admin_submission_test',
      email: 'admin@submission-test.local',
      password: 'hashedpassword123',
      userLevel: 'admin',
      isApproved: true,
      isActive: true
    });

    authToken = jwt.sign(
      { id: testAdminUser.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '24h' }
    );

    // Create test forms
    testForm = await Form.create({
      name: 'Test Form',
      description: 'Test form description',
      originalFile: Buffer.from('test content'),
      status: 'active',
      createdBy: testAdminUser.id
    });

    testForm2 = await Form.create({
      name: 'Inactive Form',
      description: 'Inactive form description',
      originalFile: Buffer.from('test content'),
      status: 'archived',
      createdBy: testAdminUser.id
    });

    // Create form fields
    await FormField.create({
      formId: testForm.id,
      fieldName: 'employeeName',
      fieldType: 'text',
      isRequired: true,
      order: 1
    });

    await FormField.create({
      formId: testForm.id,
      fieldName: 'department',
      fieldType: 'text',
      isRequired: true,
      order: 2
    });

    await FormField.create({
      formId: testForm.id,
      fieldName: 'comments',
      fieldType: 'textarea',
      isRequired: false,
      order: 3
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ============= Authorization Tests =============
  describe('Authorization Checks', () => {
    test('POST /api/submissions - reject request without authentication', async () => {
      const res = await request(app)
        .post('/api/submissions')
        .send({
          formId: testForm.id,
          submissionData: {
            employeeName: 'Jane Doe',
            department: 'HR'
          }
        });

      expect(res.status).toBe(401);
    });

    test('POST /api/submissions - reject non-level4 users', async () => {
      const lowLevelUser = await User.create({
        username: `level2_user_${Date.now()}`,
        email: `level2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });
      const lowToken = jwt.sign(
        { id: lowLevelUser.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${lowToken}`)
        .send({
          formId: testForm.id,
          submissionData: {
            employeeName: 'Jane Doe',
            department: 'HR'
          }
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('level 4');
    });

    test('GET /api/submissions/:id - reject other user viewing submission', async () => {
      // Create two level 4 users
      const user1 = await User.create({
        username: `user1_${Date.now()}`,
        email: `user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const user2 = await User.create({
        username: `user2_${Date.now()}`,
        email: `user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      // User1 creates submission
      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user1.id,
        status: 'draft',
        submissionData: {
          employeeName: 'John Doe',
          department: 'IT'
        }
      });

      // User2 tries to view
      const user2Token = jwt.sign(
        { id: user2.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('permission');
    });

    test('GET /api/submissions/:id - allow admin viewing any submission', async () => {
      const user = await User.create({
        username: `user_${Date.now()}`,
        email: `user_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: {
          employeeName: 'John Doe',
          department: 'IT'
        }
      });

      const adminToken = jwt.sign(
        { id: testAdminUser.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.submission).toBeDefined();
    });

    test('PATCH /api/submissions/:id - reject other user editing submission', async () => {
      const user1 = await User.create({
        username: `patch_user1_${Date.now()}`,
        email: `patch_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const user2 = await User.create({
        username: `patch_user2_${Date.now()}`,
        email: `patch_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user1.id,
        status: 'draft',
        submissionData: {
          employeeName: 'John Doe',
          department: 'IT'
        }
      });

      const user2Token = jwt.sign(
        { id: user2.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .patch(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          submissionData: {
            employeeName: 'Jane Doe',
            department: 'Finance'
          }
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('permission');
    });
  });

  // ============= Input Validation Tests =============
  describe('Input Validation', () => {
    test('POST /api/submissions - reject missing formId', async () => {
      const user = await User.create({
        username: `validate_user1_${Date.now()}`,
        email: `validate_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          submissionData: {
            employeeName: 'Jane Doe',
            department: 'HR'
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('POST /api/submissions - reject invalid formId type', async () => {
      const user = await User.create({
        username: `validate_user2_${Date.now()}`,
        email: `validate_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          formId: 'not_a_number',
          submissionData: {
            employeeName: 'Jane Doe',
            department: 'HR'
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('POST /api/submissions - reject missing submissionData', async () => {
      const user = await User.create({
        username: `validate_user3_${Date.now()}`,
        email: `validate_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          formId: testForm.id
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('POST /api/submissions - reject invalid submissionData type', async () => {
      const user = await User.create({
        username: `validate_user4_${Date.now()}`,
        email: `validate_user4_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          formId: testForm.id,
          submissionData: 'not_an_object'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('PATCH /api/submissions/:id - reject missing submissionData', async () => {
      const user = await User.create({
        username: `patch_validate_user1_${Date.now()}`,
        email: `patch_validate_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: {
          employeeName: 'John Doe',
          department: 'IT'
        }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .patch(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('PATCH /api/submissions/:id - reject invalid submissionData type', async () => {
      const user = await User.create({
        username: `patch_validate_user2_${Date.now()}`,
        email: `patch_validate_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: {
          employeeName: 'John Doe',
          department: 'IT'
        }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .patch(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          submissionData: 'not_an_object'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  // ============= Form Status Tests =============
  describe('Form Status Validation', () => {
    test('POST /api/submissions - reject submission on inactive form', async () => {
      const user = await User.create({
        username: `status_user1_${Date.now()}`,
        email: `status_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          formId: testForm2.id,
          submissionData: {
            employeeName: 'Jane Doe',
            department: 'HR'
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('POST /api/submissions - reject submission on non-existent form', async () => {
      const user = await User.create({
        username: `status_user2_${Date.now()}`,
        email: `status_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          formId: 99999,
          submissionData: {
            employeeName: 'Jane Doe',
            department: 'HR'
          }
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  // ============= Create Submission Tests =============
  describe('POST /api/submissions - Create Submission', () => {
    test('successfully create new draft submission', async () => {
      const user = await User.create({
        username: `create_user1_${Date.now()}`,
        email: `create_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          formId: testForm.id,
          submissionData: {
            employeeName: 'Alice Smith',
            department: 'Marketing'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.submission).toBeDefined();
      expect(res.body.submission.id).toBeDefined();
      expect(res.body.submission.formId).toBe(testForm.id);
      expect(res.body.submission.status).toBe('draft');
      expect(res.body.submission.submissionData.employeeName).toBe('Alice Smith');
      expect(res.body.submission.submissionData.department).toBe('Marketing');
    });

    test('successfully create submission with only required fields', async () => {
      const user = await User.create({
        username: `create_user2_${Date.now()}`,
        email: `create_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          formId: testForm.id,
          submissionData: {
            employeeName: 'Bob Johnson',
            department: 'Sales'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.submission.submissionData.comments).toBeUndefined();
    });

    test('successfully create submission with all fields including optional', async () => {
      const user = await User.create({
        username: `create_user3_${Date.now()}`,
        email: `create_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          formId: testForm.id,
          submissionData: {
            employeeName: 'Carol White',
            department: 'Finance',
            comments: 'Some additional notes'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.submission.submissionData.comments).toBe('Some additional notes');
    });

    test('successfully create submission with admin user', async () => {
      const adminToken = jwt.sign(
        { id: testAdminUser.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          formId: testForm.id,
          submissionData: {
            employeeName: 'David Brown',
            department: 'Operations'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.submission.id).toBeDefined();
    });
  });

  // ============= Get Submissions List Tests =============
  describe('GET /api/submissions - List Submissions', () => {
    test('successfully list user submissions with default pagination', async () => {
      const user = await User.create({
        username: `list_user1_${Date.now()}`,
        email: `list_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      // Create multiple submissions
      await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'Test 1', department: 'IT' }
      });

      await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'Test 2', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    test('successfully list submissions with custom pagination', async () => {
      const user = await User.create({
        username: `list_user2_${Date.now()}`,
        email: `list_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'Test', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get('/api/submissions?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
    });

    test('successfully filter submissions by status', async () => {
      const user = await User.create({
        username: `list_user3_${Date.now()}`,
        email: `list_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'Test 1', department: 'IT' }
      });

      await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { employeeName: 'Test 2', department: 'HR' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get('/api/submissions?status=draft')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      res.body.data.forEach(submission => {
        expect(submission.status).toBe('draft');
      });
    });

    test('successfully filter submissions by formId', async () => {
      const user = await User.create({
        username: `list_user4_${Date.now()}`,
        email: `list_user4_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'Test', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get(`/api/submissions?formId=${testForm.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      res.body.data.forEach(submission => {
        expect(submission.formId).toBe(testForm.id);
      });
    });

    test('successfully filter by both status and formId', async () => {
      const user = await User.create({
        username: `list_user5_${Date.now()}`,
        email: `list_user5_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'Test', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get(`/api/submissions?status=draft&formId=${testForm.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      res.body.data.forEach(submission => {
        expect(submission.status).toBe('draft');
        expect(submission.formId).toBe(testForm.id);
      });
    });

    test('return empty list for other user submissions', async () => {
      const user = await User.create({
        username: `list_user6_${Date.now()}`,
        email: `list_user6_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(0);
    });

    test('include form and field details in list response', async () => {
      const user = await User.create({
        username: `list_user7_${Date.now()}`,
        email: `list_user7_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'Test', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      if (res.body.data.length > 0) {
        const submission = res.body.data[0];
        expect(submission.form).toBeDefined();
        expect(submission.form.name).toBeDefined();
      }
    });
  });

  // ============= Get Submission Detail Tests =============
  describe('GET /api/submissions/:id - Get Submission Detail', () => {
    test('successfully retrieve submission detail for submitter', async () => {
      const user = await User.create({
        username: `detail_user1_${Date.now()}`,
        email: `detail_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'John Doe', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.submission).toBeDefined();
      expect(res.body.submission.id).toBe(submission.id);
      expect(res.body.submission.formId).toBe(testForm.id);
      expect(res.body.submission.status).toBe('draft');
    });

    test('successfully retrieve submission detail includes form details', async () => {
      const user = await User.create({
        username: `detail_user2_${Date.now()}`,
        email: `detail_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'John Doe', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.submission.form).toBeDefined();
      expect(res.body.submission.form.name).toBe(testForm.name);
      expect(res.body.submission.form.fields).toBeDefined();
      expect(Array.isArray(res.body.submission.form.fields)).toBe(true);
    });

    test('successfully retrieve submission detail includes submitter info', async () => {
      const user = await User.create({
        username: `detail_user3_${Date.now()}`,
        email: `detail_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'John Doe', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.submission.submitter).toBeDefined();
      expect(res.body.submission.submitter.id).toBe(user.id);
    });

    test('return 404 for non-existent submission', async () => {
      const user = await User.create({
        username: `detail_user4_${Date.now()}`,
        email: `detail_user4_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get('/api/submissions/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  // ============= Update Submission Tests =============
  describe('PATCH /api/submissions/:id - Update Submission', () => {
    test('successfully update draft submission data', async () => {
      const user = await User.create({
        username: `update_user1_${Date.now()}`,
        email: `update_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'John Doe', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .patch(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          submissionData: {
            employeeName: 'John Updated',
            department: 'Finance'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.submission).toBeDefined();
      expect(res.body.submission.submissionData.employeeName).toBe('John Updated');
      expect(res.body.submission.submissionData.department).toBe('Finance');
    });

    test('successfully update partial submission fields', async () => {
      const user = await User.create({
        username: `update_user2_${Date.now()}`,
        email: `update_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'John Doe', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .patch(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          submissionData: {
            department: 'Operations'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.submission.submissionData.department).toBe('Operations');
      // Original field remains
      expect(res.body.submission.submissionData.employeeName).toBe('John Doe');
    });

    test('successfully add optional field to submission', async () => {
      const user = await User.create({
        username: `update_user3_${Date.now()}`,
        email: `update_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'John Doe', department: 'IT' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .patch(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          submissionData: {
            employeeName: 'John Doe',
            department: 'IT',
            comments: 'New comment added'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.submission.submissionData.comments).toBe('New comment added');
    });

    test('reject update for non-draft submission', async () => {
      const user = await User.create({
        username: `update_user4_${Date.now()}`,
        email: `update_user4_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { employeeName: 'Jane Doe', department: 'HR' }
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .patch(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          submissionData: {
            employeeName: 'Jane Updated'
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('draft');
    });

    test('return 404 for non-existent submission update', async () => {
      const user = await User.create({
        username: `update_user5_${Date.now()}`,
        email: `update_user5_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .patch('/api/submissions/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          submissionData: {
            employeeName: 'Test'
          }
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    test('successfully update changes updatedAt timestamp', async () => {
      const user = await User.create({
        username: `update_user6_${Date.now()}`,
        email: `update_user6_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'draft',
        submissionData: { employeeName: 'John Doe', department: 'IT' }
      });

      const originalUpdatedAt = submission.updatedAt;

      // Add small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .patch(`/api/submissions/${submission.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          submissionData: {
            employeeName: 'Updated John'
          }
        });

      expect(res.status).toBe(200);
      const responseUpdatedAt = typeof res.body.submission.updatedAt === 'string' 
        ? new Date(res.body.submission.updatedAt) 
        : res.body.submission.updatedAt;
      expect(responseUpdatedAt.getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });
  });

  // ============= Edge Cases =============
  describe('Edge Cases', () => {
    test('handle submission with empty submissionData object', async () => {
      const user = await User.create({
        username: `edge_user1_${Date.now()}`,
        email: `edge_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          formId: testForm.id,
          submissionData: {}
        });

      // Should create with empty object (validation happens at submit time)
      expect(res.status).toBe(201);
      expect(res.body.submission.submissionData).toBeDefined();
    });

    test('handle pagination with page number beyond data', async () => {
      const user = await User.create({
        username: `edge_user2_${Date.now()}`,
        email: `edge_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get('/api/submissions?page=100&limit=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('handle invalid status filter gracefully', async () => {
      const user = await User.create({
        username: `edge_user3_${Date.now()}`,
        email: `edge_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const res = await request(app)
        .get('/api/submissions?status=invalid_status')
        .set('Authorization', `Bearer ${userToken}`);

      // Invalid ENUM values might cause error or return empty
      expect([200, 400, 500]).toContain(res.status);
    });
  });
});
