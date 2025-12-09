const request = require('supertest');
const jwt = require('jsonwebtoken');
const { sequelize, User, Form, FormField, FormSubmission, FormApproval, Document, FormNotification } = require('../src/models');
const { app } = require('../src/app');
const fs = require('fs');
const path = require('path');

describe('Archive System Integration Tests', () => {
  let adminUser, submitterUser, approverUser;
  let testForm, testSubmission;
  let adminToken, submitterToken, approverToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear and recreate tables
    await sequelize.sync({ force: true });

    // Create users
    adminUser = await User.create({
      username: 'admin_archive_test',
      email: 'admin_archive@test.com',
      password: 'hashedpassword123',
      userLevel: 'admin',
      name: 'Admin Archive',
      isApproved: true,
      isActive: true
    });

    submitterUser = await User.create({
      username: 'submitter_archive_test',
      email: 'submitter_archive@test.com',
      password: 'hashedpassword123',
      userLevel: 'level3',
      name: 'Submitter Archive',
      isApproved: true,
      isActive: true
    });

    approverUser = await User.create({
      username: 'approver_archive_test',
      email: 'approver_archive@test.com',
      password: 'hashedpassword123',
      userLevel: 'level2',
      name: 'Approver Archive',
      isApproved: true,
      isActive: true
    });

    // Create form
    testForm = await Form.create({
      name: 'Archive Test Form',
      description: 'Form for archive testing',
      originalFile: Buffer.from('test form content'),
      createdBy: adminUser.id,
      status: 'active'
    });

    // Create form fields
    await FormField.create({
      formId: testForm.id,
      fieldName: 'firstName',
      fieldLabel: 'First Name',
      fieldType: 'text',
      isRequired: true,
      fieldOrder: 1
    });

    // Create submission
    testSubmission = await FormSubmission.create({
      formId: testForm.id,
      submittedBy: submitterUser.id,
      submissionData: {
        firstName: 'John',
        lastName: 'Doe'
      },
      status: 'submitted'
    });

    // Approve the submission
    await FormApproval.create({
      submissionId: testSubmission.id,
      approverUserId: approverUser.id,
      approvalLevel: 1,
      status: 'approved',
      approvedAt: new Date()
    });

    // Update submission status to approved
    await testSubmission.update({ status: 'approved' });

    // Generate tokens
    const secret = process.env.JWT_SECRET || 'test-secret';
    adminToken = jwt.sign({ id: adminUser.id, userLevel: adminUser.userLevel }, secret, { expiresIn: '1h' });
    submitterToken = jwt.sign({ id: submitterUser.id, userLevel: submitterUser.userLevel }, secret, { expiresIn: '1h' });
    approverToken = jwt.sign({ id: approverUser.id, userLevel: approverUser.userLevel }, secret, { expiresIn: '1h' });
  });

  describe('POST /api/archive/:submissionId', () => {
    test('should archive approved submission', async () => {
      const res = await request(app)
        .post(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('document');
      expect(res.body.document).toHaveProperty('id');
    });

    test('should create Document record', async () => {
      const res = await request(app)
        .post(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const docId = res.body.document.id;
      const doc = await Document.findByPk(docId);
      expect(doc).toBeDefined();
      expect(doc.formSubmissionId).toBe(testSubmission.id);
    });

    test('should generate document file', async () => {
      const res = await request(app)
        .post(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.document).toHaveProperty('fileName');
      const fileName = res.body.document.fileName;
      const fullPath = path.join(__dirname, '..', 'uploads', fileName);
      expect(fs.existsSync(fullPath)).toBe(true);
    });

    test('should reject archiving non-approved submission', async () => {
      // Create a pending submission
      const pendingSubmission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: submitterUser.id,
        submissionData: { firstName: 'Jane' },
        status: 'submitted'
      });

      const res = await request(app)
        .post(`/api/archive/${pendingSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.toLowerCase()).toContain('approved');
    });

    test('should return 404 for non-existent submission', async () => {
      const res = await request(app)
        .post('/api/archive/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/archive', () => {
    beforeEach(async () => {
      // Archive the test submission
      await request(app)
        .post(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
    });

    test('should get archive history with pagination', async () => {
      const res = await request(app)
        .get('/api/archive?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('page');
      expect(res.body.pagination).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should filter archive by formId', async () => {
      const res = await request(app)
        .get(`/api/archive?formId=${testForm.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should filter archive by userId', async () => {
      const res = await request(app)
        .get(`/api/archive?userId=${submitterUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should require authentication', async () => {
      await request(app)
        .get('/api/archive')
        .expect(401);
    });
  });

  describe('GET /api/archive/document/:documentId', () => {
    let documentId;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      documentId = res.body.document.id;
    });

    test('should get document details', async () => {
      const res = await request(app)
        .get(`/api/archive/document/${documentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('document');
      expect(res.body.document.id).toBe(documentId);
    });

    test('should return 404 for non-existent document', async () => {
      const res = await request(app)
        .get('/api/archive/document/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/archive/document/:documentId/download', () => {
    let documentId;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      documentId = res.body.document.id;
    });

    test('should download document file', async () => {
      const res = await request(app)
        .get(`/api/archive/document/${documentId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-disposition']).toBeDefined();
    });

    test('should return 404 if document file not found', async () => {
      const doc = await Document.findByPk(documentId);
      await doc.update({ filePath: '/invalid/path/file.txt' });

      await request(app)
        .get(`/api/archive/document/${documentId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/archive/:submissionId', () => {
    test('should delete archived submission', async () => {
      // First archive the submission
      await request(app)
        .post(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .delete(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
    });

    test('should delete associated document files', async () => {
      const res = await request(app)
        .post(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const fileName = res.body.document.fileName;
      const filePath = path.join(__dirname, '..', 'uploads', fileName);

      // Verify file exists
      expect(fs.existsSync(filePath)).toBe(true);

      // Delete the archived submission
      await request(app)
        .delete(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify file was deleted
      expect(fs.existsSync(filePath)).toBe(false);
    });

    test('should return 404 for non-existent submission', async () => {
      await request(app)
        .delete('/api/archive/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    test('should reject deletion of non-archived submission', async () => {
      const res = await request(app)
        .delete(`/api/archive/${testSubmission.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('Authorization', () => {
    test('should require authentication for all archive endpoints', async () => {
      await request(app)
        .post(`/api/archive/${testSubmission.id}`)
        .expect(401);

      await request(app)
        .get('/api/archive')
        .expect(401);

      await request(app)
        .get('/api/archive/document/1')
        .expect(401);

      await request(app)
        .get('/api/archive/document/1/download')
        .expect(401);

      await request(app)
        .delete(`/api/archive/${testSubmission.id}`)
        .expect(401);
    });
  });
});
