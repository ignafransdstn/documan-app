/**
 * Document Generation Integration Tests
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { sequelize, User, Form, FormSubmission } = require('../src/models');
const { app } = require('../src/app');

let testAdminUser, approverUser, submitterUser;
let testForm;
let adminToken, approverToken, submitterToken;

describe('Document Generation Endpoints', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create admin user
    testAdminUser = await User.create({
      username: 'admin_doc_gen_test',
      email: 'admin_doc@test.local',
      password: 'hashedpassword123',
      userLevel: 'admin',
      isApproved: true,
      isActive: true
    });

    // Create approver user
    approverUser = await User.create({
      username: 'approver_doc_gen_test',
      email: 'approver_doc@test.local',
      password: 'hashedpassword123',
      userLevel: 'level1',
      isApproved: true,
      isActive: true
    });

    // Create submitter user
    submitterUser = await User.create({
      username: 'submitter_doc_gen_test',
      email: 'submitter_doc@test.local',
      password: 'hashedpassword123',
      userLevel: 'level4',
      isApproved: true,
      isActive: true
    });

    // Generate tokens
    adminToken = jwt.sign(
      { id: testAdminUser.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '24h' }
    );

    approverToken = jwt.sign(
      { id: approverUser.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '24h' }
    );

    submitterToken = jwt.sign(
      { id: submitterUser.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '24h' }
    );

    // Create test form
    testForm = await Form.create({
      name: 'Test Form for Document Generation',
      description: 'Test form for document generation',
      originalFile: Buffer.from('mock pdf file'),
      status: 'active',
      createdBy: testAdminUser.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/document-generation/generate/:submissionId', () => {
    it('should fail to generate document for non-existent submission', async () => {
      const response = await request(app)
        .post('/api/document-generation/generate/9999')
        .set('Authorization', `Bearer ${approverToken}`)
        .send({});

      expect(response.status).toBe(404);
    });

    it('should fail to generate document for draft submission', async () => {
      const draftSubmission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: submitterUser.id,
        submissionData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        status: 'draft'
      });

      const response = await request(app)
        .post(`/api/document-generation/generate/${draftSubmission.id}`)
        .set('Authorization', `Bearer ${approverToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should generate document for approved submission', async () => {
      const approvedSubmission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: submitterUser.id,
        submissionData: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        },
        status: 'approved',
        approver1UserId: approverUser.id,
        approvedAt: new Date()
      });

      const response = await request(app)
        .post(`/api/document-generation/generate/${approvedSubmission.id}`)
        .set('Authorization', `Bearer ${approverToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data).toHaveProperty('fileName');
    });
  });

  describe('GET /api/document-generation/history/:submissionId', () => {
    it('should return document history for submission', async () => {
      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: submitterUser.id,
        submissionData: {
          firstName: 'David',
          lastName: 'Miller',
          email: 'david@example.com'
        },
        status: 'approved',
        approver1UserId: approverUser.id,
        approvedAt: new Date()
      });

      const response = await request(app)
        .get(`/api/document-generation/history/${submission.id}`)
        .set('Authorization', `Bearer ${submitterToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data).toHaveProperty('submissionId');
    });
  });

  describe('Authorization Tests', () => {
    it('should allow admin to generate document', async () => {
      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: submitterUser.id,
        submissionData: {
          firstName: 'Frank',
          lastName: 'Nelson',
          email: 'frank@example.com'
        },
        status: 'approved',
        approver1UserId: testAdminUser.id,
        approvedAt: new Date()
      });

      const response = await request(app)
        .post(`/api/document-generation/generate/${submission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
    });
  });
});
