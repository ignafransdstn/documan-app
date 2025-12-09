const request = require('supertest');
const jwt = require('jsonwebtoken');
const { sequelize, User, Form, FormField, FormSubmission, FormNotification } = require('../src/models');
const { app } = require('../src/app');

// Helper function to create JWT token
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '24h' });
};

describe('Form Notification Endpoints', () => {
  let testAdmin, testUser1, testUser2, testForm, testSubmission, testNotification;

  beforeAll(async () => {
    // Create test users
    testAdmin = await User.create({
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@test.local`,
      password: 'hashedpassword123',
      userLevel: 'admin',
      isApproved: true,
      isActive: true
    });

    testUser1 = await User.create({
      username: `user1_${Date.now()}`,
      email: `user1_${Date.now()}@test.local`,
      password: 'hashedpassword123',
      userLevel: 'level4',
      isApproved: true,
      isActive: true
    });

    testUser2 = await User.create({
      username: `user2_${Date.now()}`,
      email: `user2_${Date.now()}@test.local`,
      password: 'hashedpassword123',
      userLevel: 'level2',
      isApproved: true,
      isActive: true
    });

    // Create test form
    testForm = await Form.create({
      name: 'Notification Test Form',
      description: 'Form for testing notifications',
      originalFile: Buffer.from('test content'),
      status: 'active',
      createdBy: testAdmin.id
    });

    // Create form field
    await FormField.create({
      formId: testForm.id,
      fieldName: 'testField',
      fieldType: 'text',
      isRequired: true,
      order: 1
    });

    // Create test submission
    testSubmission = await FormSubmission.create({
      formId: testForm.id,
      submittedBy: testUser1.id,
      status: 'submitted',
      submissionData: { testField: 'test value' }
    });

    // Create test notification
    testNotification = await FormNotification.create({
      submissionId: testSubmission.id,
      recipientUserId: testUser1.id,
      type: 'submitted',
      message: 'Your form has been submitted successfully',
      isRead: false,
      emailStatus: 'pending'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ============= Authorization Tests =============
  describe('Authorization Checks', () => {
    test('reject request without authentication', async () => {
      const res = await request(app)
        .get('/api/notifications');

      expect(res.status).toBe(401);
    });

    test('allow authenticated user to view their notifications', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('prevent user from viewing other user\'s notifications', async () => {
      const token = createToken(testUser2.id);
      const res = await request(app)
        .get(`/api/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    test('allow admin to view unread count', async () => {
      const token = createToken(testAdmin.id);
      const res = await request(app)
        .get('/api/notifications/count/unread')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.unreadCount).toBe('number');
    });
  });

  // ============= Get Notifications Tests =============
  describe('GET /api/notifications - Get Notifications', () => {
    test('successfully list notifications with pagination', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .get('/api/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });

    test('filter notifications by isRead status', async () => {
      const user = await User.create({
        username: `filter_user_${Date.now()}`,
        email: `filter_user_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      // Create read and unread notifications
      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { testField: 'test' }
      });

      await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Unread notification',
        isRead: false
      });

      await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'approved',
        message: 'Read notification',
        isRead: true,
        readAt: new Date()
      });

      const token = createToken(user.id);
      
      // Get unread notifications
      const unreadRes = await request(app)
        .get('/api/notifications?isRead=false')
        .set('Authorization', `Bearer ${token}`);

      expect(unreadRes.status).toBe(200);
      unreadRes.body.data.forEach(n => {
        expect(n.isRead).toBe(false);
      });

      // Get read notifications
      const readRes = await request(app)
        .get('/api/notifications?isRead=true')
        .set('Authorization', `Bearer ${token}`);

      expect(readRes.status).toBe(200);
      readRes.body.data.forEach(n => {
        expect(n.isRead).toBe(true);
      });
    });

    test('support custom pagination parameters', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .get('/api/notifications?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
    });

    test('include unread count in pagination response', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.pagination.unreadCount).toBe('number');
    });
  });

  // ============= Get Notification Detail Tests =============
  describe('GET /api/notifications/:id - Get Notification Detail', () => {
    test('successfully retrieve notification detail', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .get(`/api/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.notification).toBeDefined();
      expect(res.body.notification.id).toBe(testNotification.id);
    });

    test('auto-mark notification as read when viewing detail', async () => {
      const user = await User.create({
        username: `read_user_${Date.now()}`,
        email: `read_user_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { testField: 'test' }
      });

      const notification = await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Test notification',
        isRead: false
      });

      expect(notification.isRead).toBe(false);

      const token = createToken(user.id);
      const res = await request(app)
        .get(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.notification.isRead).toBe(true);
      expect(res.body.notification.readAt).toBeDefined();
    });

    test('return 404 for non-existent notification', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .get('/api/notifications/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    test('include submission and form details in response', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .get(`/api/notifications/${testNotification.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.notification.submission).toBeDefined();
      expect(res.body.notification.submission.form).toBeDefined();
    });
  });

  // ============= Mark as Read Tests =============
  describe('PATCH /api/notifications/:id/read - Mark as Read', () => {
    test('successfully mark single notification as read', async () => {
      const user = await User.create({
        username: `mark_user_${Date.now()}`,
        email: `mark_user_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { testField: 'test' }
      });

      const notification = await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Test',
        isRead: false
      });

      const token = createToken(user.id);
      const res = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.notification.isRead).toBe(true);
      expect(res.body.notification.readAt).toBeDefined();
    });

    test('return 404 when marking non-existent notification', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .patch('/api/notifications/99999/read')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(404);
    });

    test('handle marking already read notification', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .patch(`/api/notifications/${testNotification.id}/read`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.notification.isRead).toBe(true);
    });
  });

  // ============= Mark Multiple as Read Tests =============
  describe('PATCH /api/notifications/read-all - Mark Multiple as Read', () => {
    test('successfully mark specific notifications as read', async () => {
      const user = await User.create({
        username: `multi_user_${Date.now()}`,
        email: `multi_user_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { testField: 'test' }
      });

      const n1 = await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Test 1',
        isRead: false
      });

      const n2 = await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Test 2',
        isRead: false
      });

      const token = createToken(user.id);
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`)
        .send({ notificationIds: [n1.id, n2.id] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
    });

    test('mark all unread notifications when no IDs provided', async () => {
      const user = await User.create({
        username: `mark_all_${Date.now()}`,
        email: `mark_all_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { testField: 'test' }
      });

      await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Unread 1',
        isRead: false
      });

      await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'approved',
        message: 'Unread 2',
        isRead: false
      });

      const token = createToken(user.id);
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(2);
    });
  });

  // ============= Delete Notification Tests =============
  describe('DELETE /api/notifications/:id - Delete Notification', () => {
    test('successfully delete single notification', async () => {
      const user = await User.create({
        username: `delete_user_${Date.now()}`,
        email: `delete_user_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { testField: 'test' }
      });

      const notification = await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Test',
        isRead: false
      });

      const token = createToken(user.id);
      const res = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deleted
      const check = await FormNotification.findByPk(notification.id);
      expect(check).toBeNull();
    });

    test('return 404 when deleting non-existent notification', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .delete('/api/notifications/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ============= Delete Multiple Tests =============
  describe('DELETE /api/notifications - Delete Multiple', () => {
    test('successfully delete specific notifications', async () => {
      const user = await User.create({
        username: `multi_delete_${Date.now()}`,
        email: `multi_delete_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { testField: 'test' }
      });

      const n1 = await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Delete 1',
        isRead: false
      });

      const n2 = await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Delete 2',
        isRead: false
      });

      const token = createToken(user.id);
      const res = await request(app)
        .delete('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({ notificationIds: [n1.id, n2.id] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
    });
  });

  // ============= Notification Statistics Tests =============
  describe('GET /api/notifications/stats - Get Statistics', () => {
    test('successfully retrieve notification statistics', async () => {
      const user = await User.create({
        username: `stats_user_${Date.now()}`,
        email: `stats_user_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { testField: 'test' }
      });

      await FormNotification.create({
        submissionId: submission.id,
        recipientUserId: user.id,
        type: 'submitted',
        message: 'Test',
        isRead: false
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get('/api/notifications/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.totalCount).toBeGreaterThanOrEqual(0);
      expect(res.body.stats.unreadCount).toBeGreaterThanOrEqual(0);
      expect(res.body.stats.readCount).toBeGreaterThanOrEqual(0);
      expect(res.body.stats.typeBreakdown).toBeDefined();
      expect(res.body.stats.emailStatusBreakdown).toBeDefined();
    });
  });

  // ============= Unread Count Tests =============
  describe('GET /api/notifications/count/unread - Get Unread Count', () => {
    test('successfully retrieve unread notification count', async () => {
      const user = await User.create({
        username: `count_user_${Date.now()}`,
        email: `count_user_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get('/api/notifications/count/unread')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.unreadCount).toBe('number');
      expect(res.body.unreadCount).toBeGreaterThanOrEqual(0);
    });
  });

  // ============= Edge Cases =============
  describe('Edge Cases', () => {
    test('handle multiple notification types correctly', async () => {
      const user = await User.create({
        username: `types_user_${Date.now()}`,
        email: `types_user_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level4',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: user.id,
        status: 'submitted',
        submissionData: { testField: 'test' }
      });

      const types = ['submitted', 'approved', 'rejected', 'archived'];
      for (const type of types) {
        await FormNotification.create({
          submissionId: submission.id,
          recipientUserId: user.id,
          type,
          message: `Notification of type: ${type}`,
          isRead: false
        });
      }

      const token = createToken(user.id);
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const types_in_response = res.body.data.map(n => n.type);
      expect(new Set(types_in_response).size).toBeGreaterThan(0);
    });

    test('handle pagination beyond available data', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .get('/api/notifications?page=100&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(100);
    });

    test('handle sorting with different parameters', async () => {
      const token = createToken(testUser1.id);
      const res = await request(app)
        .get('/api/notifications?sortBy=createdAt&sortOrder=ASC')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
