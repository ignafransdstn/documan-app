const request = require('supertest');
const { app } = require('../src/app');
const {
  User,
  Form,
  FormField,
  FormSubmission,
  FormApproval,
  FormNotification,
  sequelize
} = require('../src/models');
const { generateToken } = require('./helpers');

describe('Email Notification Integration Tests', () => {
  let submitterToken, approverToken, submitterId, approverId, formId, submissionId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Create test users
    const submitter = await User.create({
      username: 'submitter@test.com',
      email: 'submitter@test.com',
      password: 'hashed_password',
      userLevel: 'standard',
      isApproved: true,
      isActive: true
    });
    submitterId = submitter.id;
    submitterToken = generateToken(submitter);

    const approver = await User.create({
      username: 'approver@test.com',
      email: 'approver@test.com',
      password: 'hashed_password',
      userLevel: 'admin',
      isApproved: true,
      isActive: true
    });
    approverId = approver.id;
    approverToken = generateToken(approver);

    // Create test form
    const form = await Form.create({
      name: 'Test Form',
      description: 'Test form for email notifications',
      originalFile: Buffer.from('test'),
      creatorId: approverId,
      isActive: true,
      level1Approver: approverId
    });
    formId = form.id;

    // Create form submission
    const submission = await FormSubmission.create({
      formId: form.id,
      submitterId: submitterId,
      submissionData: {
        field1: 'test data',
        field2: 'more data'
      },
      status: 'pending'
    });
    submissionId = submission.id;
  });

  describe('POST /api/email/send/submission/:submissionId', () => {
    it('should send submission confirmation email', async () => {
      const response = await request(app)
        .post(`/api/email/send/submission/${submissionId}`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('email sent');

      // Verify notification was created
      const notification = await FormNotification.findOne({
        where: {
          submissionId: submissionId,
          type: 'submitted'
        }
      });
      expect(notification).toBeDefined();
    });

    it('should return 404 for non-existent submission', async () => {
      await request(app)
        .post('/api/email/send/submission/99999')
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .post(`/api/email/send/submission/${submissionId}`)
        .expect(401);
    });
  });

  describe('POST /api/email/send/approval/:submissionId/:approverId', () => {
    beforeEach(async () => {
      // Create approval record
      await FormApproval.create({
        submissionId: submissionId,
        approverId: approverId,
        level: 'level1',
        status: 'approved',
        approvalDate: new Date()
      });
    });

    it('should send approval notification email', async () => {
      const response = await request(app)
        .post(`/api/email/send/approval/${submissionId}/${approverId}`)
        .set('Authorization', `Bearer ${approverToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('email sent');

      // Verify notification was created
      const notification = await FormNotification.findOne({
        where: {
          submissionId: submissionId,
          type: 'approved'
        }
      });
      expect(notification).toBeDefined();
    });

    it('should return 404 for non-existent submission', async () => {
      await request(app)
        .post(`/api/email/send/approval/99999/${approverId}`)
        .set('Authorization', `Bearer ${approverToken}`)
        .expect(404);
    });
  });

  describe('POST /api/email/send/rejection/:submissionId/:approverId', () => {
    it('should send rejection notification with reason', async () => {
      const rejectionReason = 'Form incomplete, please resubmit with all required fields';

      const response = await request(app)
        .post(`/api/email/send/rejection/${submissionId}/${approverId}`)
        .set('Authorization', `Bearer ${approverToken}`)
        .send({ rejectionReason })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('email sent');

      // Verify notification includes rejection reason
      const notification = await FormNotification.findOne({
        where: {
          submissionId: submissionId,
          type: 'rejected'
        }
      });
      expect(notification).toBeDefined();
      expect(notification.message).toContain(rejectionReason);
    });

    it('should return 404 for non-existent submission', async () => {
      await request(app)
        .post(`/api/email/send/rejection/99999/${approverId}`)
        .set('Authorization', `Bearer ${approverToken}`)
        .send({ rejectionReason: 'Invalid submission' })
        .expect(404);
    });
  });

  describe('POST /api/email/send/archive/:submissionId/:documentId', () => {
    it('should send archive notification email', async () => {
      const documentId = 123; // Mock document ID

      const response = await request(app)
        .post(`/api/email/send/archive/${submissionId}/${documentId}`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('email sent');

      // Verify notification was created
      const notification = await FormNotification.findOne({
        where: {
          submissionId: submissionId,
          type: 'archived'
        }
      });
      expect(notification).toBeDefined();
    });

    it('should return 404 for non-existent submission', async () => {
      await request(app)
        .post('/api/email/send/archive/99999/123')
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(404);
    });
  });

  describe('GET /api/email/user', () => {
    beforeEach(async () => {
      // Create some notifications for the submitter
      await FormNotification.create({
        submissionId: submissionId,
        userId: submitterId,
        type: 'submitted',
        message: 'Your form has been submitted',
        isRead: false
      });

      await FormNotification.create({
        submissionId: submissionId,
        userId: submitterId,
        type: 'approved',
        message: 'Your form has been approved',
        isRead: false
      });
    });

    it('should retrieve user notifications with pagination', async () => {
      const response = await request(app)
        .get('/api/email/user?page=1&limit=10')
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter unread notifications only', async () => {
      const response = await request(app)
        .get('/api/email/user?page=1&limit=10&unreadOnly=true')
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(notif => !notif.isRead)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/email/user')
        .expect(401);
    });
  });

  describe('PATCH /api/email/:notificationId/read', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await FormNotification.create({
        submissionId: submissionId,
        userId: submitterId,
        type: 'submitted',
        message: 'Your form has been submitted',
        isRead: false
      });
      notificationId = notification.id;
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .patch(`/api/email/${notificationId}/read`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify notification is marked as read
      const notification = await FormNotification.findByPk(notificationId);
      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeDefined();
    });

    it('should return 404 for non-existent notification', async () => {
      await request(app)
        .patch('/api/email/99999/read')
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .patch(`/api/email/${notificationId}/read`)
        .expect(401);
    });
  });

  describe('DELETE /api/email/:notificationId', () => {
    let notificationId;

    beforeEach(async () => {
      const notification = await FormNotification.create({
        submissionId: submissionId,
        userId: submitterId,
        type: 'submitted',
        message: 'Your form has been submitted',
        isRead: false
      });
      notificationId = notification.id;
    });

    it('should delete notification', async () => {
      const response = await request(app)
        .delete(`/api/email/${notificationId}`)
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify notification is deleted
      const notification = await FormNotification.findByPk(notificationId);
      expect(notification).toBeNull();
    });

    it('should return 404 for non-existent notification', async () => {
      await request(app)
        .delete('/api/email/99999')
        .set('Authorization', `Bearer ${submitterToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .delete(`/api/email/${notificationId}`)
        .expect(401);
    });
  });
});
