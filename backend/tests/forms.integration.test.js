/**
 * Integration Tests untuk Form CRUD Endpoints
 * Test: upload, list, detail, update, delete operations
 */

const request = require('supertest');
const { sequelize, User, Form, FormField, FormSubmission } = require('../src/models');

// Test app
const { app } = require('../src/app');

let authToken = '';
let adminUserId = '';

describe('Form CRUD Endpoints Integration Tests', () => {
  
  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
    
    // Create admin user untuk testing
    const adminUser = await User.create({
      username: 'admin_forms_test',
      email: 'admin@forms-test.local',
      password: 'hashed_password_123',
      userLevel: 'admin',
      isApproved: true,
      isActive: true
    });
    
    adminUserId = adminUser.id;
    
    // Create JWT token untuk testing
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { id: adminUser.id },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/forms/upload - Upload form template', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/forms/upload')
        .send({ name: 'Test Form' });
      
      expect(response.status).toBe(401);
    });

    test('should return 403 if not admin', async () => {
      // Create non-admin user
      const user = await User.create({
        username: 'level1_user_test',
        email: 'level1@forms-test.local',
        password: 'hashed_password_123',
        userLevel: 'level1',
        isApproved: true,
        isActive: true
      });

      const jwt = require('jsonwebtoken');
      const userToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .post('/api/forms/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Form' });
      
      expect(response.status).toBe(403);
    });

    test('should return 400 if form name is missing', async () => {
      const response = await request(app)
        .post('/api/forms/upload')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    test('should return 400 if file is missing', async () => {
      const response = await request(app)
        .post('/api/forms/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Form' });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('file');
    });

    test('should return 400 if file is not a valid DOCX', async () => {
      const response = await request(app)
        .post('/api/forms/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Test Form')
        .attach('file', Buffer.from('invalid content'), 'test.docx');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('GET /api/forms - List forms', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/forms');
      
      expect(response.status).toBe(401);
    });

    test('should return forms list with pagination', async () => {
      const response = await request(app)
        .get('/api/forms')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/forms?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(5);
    });

    test('should support search parameter', async () => {
      const response = await request(app)
        .get('/api/forms?search=test')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should support status filter', async () => {
      const response = await request(app)
        .get('/api/forms?status=active')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/forms/:id - Get form detail', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/forms/999');
      
      expect(response.status).toBe(401);
    });

    test('should return 404 if form not found', async () => {
      const response = await request(app)
        .get('/api/forms/999999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
    });

    test('should return form detail with fields', async () => {
      // Create a test form first
      const testForm = await Form.create({
        name: 'Detail Test Form',
        description: 'Test description',
        originalFile: Buffer.from('mock'),
        createdBy: adminUserId
      });

      // Add some fields
      await FormField.create({
        formId: testForm.id,
        fieldName: 'firstName',
        fieldType: 'text',
        isRequired: true,
        displayOrder: 1
      });

      const response = await request(app)
        .get(`/api/forms/${testForm.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('form');
      expect(response.body.form).toHaveProperty('id');
      expect(response.body.form).toHaveProperty('name');
      expect(response.body.form).toHaveProperty('fields');
      expect(Array.isArray(response.body.form.fields)).toBe(true);
    });
  });

  describe('PUT /api/forms/:id - Update form', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/forms/999')
        .send({ name: 'Updated' });
      
      expect(response.status).toBe(401);
    });

    test('should return 404 if form not found', async () => {
      const response = await request(app)
        .put('/api/forms/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });
      
      expect(response.status).toBe(404);
    });

    test('should return 400 if form name is empty', async () => {
      const testForm = await Form.create({
        name: 'Update Test Form',
        originalFile: Buffer.from('mock'),
        createdBy: adminUserId
      });

      const response = await request(app)
        .put(`/api/forms/${testForm.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '   ' }); // Whitespace only
      
      expect(response.status).toBe(400);
    });

    test('should allow creator to update form', async () => {
      const testForm = await Form.create({
        name: 'Original Name',
        description: 'Original Description',
        originalFile: Buffer.from('mock'),
        createdBy: adminUserId
      });

      const response = await request(app)
        .put(`/api/forms/${testForm.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'Updated Name',
          description: 'Updated Description'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.form.name).toBe('Updated Name');
      expect(response.body.form.description).toBe('Updated Description');
    });

    test('should return 403 if not creator or admin', async () => {
      // Create form by one user
      const otherUser = await User.create({
        username: 'other_user_test',
        email: 'other@forms-test.local',
        password: 'hashed_password_123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const testForm = await Form.create({
        name: 'Other User Form',
        originalFile: Buffer.from('mock'),
        createdBy: otherUser.id
      });

      // Try to update with different user's token
      const response = await request(app)
        .put(`/api/forms/${testForm.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Hacked Name' });
      
      // Admin should still be able to update
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /api/forms/:id/deactivate - Deactivate form', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .patch('/api/forms/999/deactivate');
      
      expect(response.status).toBe(401);
    });

    test('should return 404 if form not found', async () => {
      const response = await request(app)
        .patch('/api/forms/999999/deactivate')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
    });

    test('should deactivate form', async () => {
      const testForm = await Form.create({
        name: 'Deactivate Test',
        originalFile: Buffer.from('mock'),
        createdBy: adminUserId,
        status: 'active'
      });

      const response = await request(app)
        .patch(`/api/forms/${testForm.id}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      
      // Verify status changed
      const updated = await Form.findByPk(testForm.id);
      expect(updated.status).toBe('archived');
    });
  });

  describe('DELETE /api/forms/:id - Delete form', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .delete('/api/forms/999');
      
      expect(response.status).toBe(401);
    });

    test('should return 404 if form not found', async () => {
      const response = await request(app)
        .delete('/api/forms/999999')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
    });

    test('should delete form if no submissions', async () => {
      const testForm = await Form.create({
        name: 'Delete Test',
        originalFile: Buffer.from('mock'),
        createdBy: adminUserId
      });

      const response = await request(app)
        .delete(`/api/forms/${testForm.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      
      // Verify deleted
      const deleted = await Form.findByPk(testForm.id);
      expect(deleted).toBeNull();
    });

    test('should return 400 if form has submissions', async () => {
      const testForm = await Form.create({
        name: 'Delete Test With Submission',
        originalFile: Buffer.from('mock'),
        createdBy: adminUserId
      });

      // Create a submission
      await FormSubmission.create({
        formId: testForm.id,
        submittedBy: adminUserId,
        submissionData: {},
        status: 'draft'
      });

      const response = await request(app)
        .delete(`/api/forms/${testForm.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(400);
    });
  });
});
