const request = require('supertest');
const jwt = require('jsonwebtoken');
const { sequelize, User, Form, FormField, FormSubmission, FormApproval, FormNotification } = require('../src/models');
const { app } = require('../src/app');

// Helper function to create JWT token
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '24h' });
};

describe('Form Approval Endpoints', () => {
  let testAdmin, testApprover, testSubmitter, testForm, testSubmission, testApproval;

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

    testApprover = await User.create({
      username: `approver_${Date.now()}`,
      email: `approver_${Date.now()}@test.local`,
      password: 'hashedpassword123',
      userLevel: 'level2',
      isApproved: true,
      isActive: true
    });

    testSubmitter = await User.create({
      username: `submitter_${Date.now()}`,
      email: `submitter_${Date.now()}@test.local`,
      password: 'hashedpassword123',
      userLevel: 'level4',
      isApproved: true,
      isActive: true
    });

    // Create test form
    testForm = await Form.create({
      name: 'Approval Test Form',
      description: 'Form for testing approval workflow',
      originalFile: Buffer.from('test content'),
      status: 'active',
      createdBy: testAdmin.id
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
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ============= Authorization Tests =============
  describe('Authorization Checks', () => {
    test('reject request without authentication', async () => {
      const res = await request(app)
        .get('/api/approvals');

      expect(res.status).toBe(401);
    });

    test('allow authenticated users to view their approval queue', async () => {
      // Create a submission and approval
      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'John Doe', department: 'IT' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: testApprover.id,
        approvalStatus: 'pending'
      });

      const token = createToken(testApprover.id);
      const res = await request(app)
        .get('/api/approvals')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('prevent user from viewing other user\'s approval detail', async () => {
      const otherApprover = await User.create({
        username: `approver2_${Date.now()}`,
        email: `approver2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Jane Doe', department: 'HR' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: testApprover.id,
        approvalStatus: 'pending'
      });

      const otherToken = createToken(otherApprover.id);
      const res = await request(app)
        .get(`/api/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });

    test('allow admin to view any approval detail', async () => {
      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Admin Test', department: 'Operations' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: testApprover.id,
        approvalStatus: 'pending'
      });

      const adminToken = createToken(testAdmin.id);
      const res = await request(app)
        .get(`/api/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.approval).toBeDefined();
    });

    test('prevent user from approving others\' submissions', async () => {
      const otherApprover = await User.create({
        username: `approver3_${Date.now()}`,
        email: `approver3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Test', department: 'IT' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: testApprover.id,
        approvalStatus: 'pending'
      });

      const otherToken = createToken(otherApprover.id);
      const res = await request(app)
        .patch(`/api/approvals/${submission.id}/approve`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('No pending approval found');
    });
  });

  // ============= Approval Queue Tests =============
  describe('GET /api/approvals - Approval Queue', () => {
    test('successfully list pending approvals with pagination', async () => {
      const user = await User.create({
        username: `queue_user1_${Date.now()}`,
        email: `queue_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Queue Test 1', department: 'IT' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: user.id,
        approvalStatus: 'pending'
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get('/api/approvals?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
    });

    test('filter approval queue by approval status', async () => {
      const user = await User.create({
        username: `queue_user2_${Date.now()}`,
        email: `queue_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      // Create approved submission
      const approvedSubmission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'approved',
        submissionData: { employeeName: 'Approved', department: 'IT' }
      });

      const approvedApproval = await FormApproval.create({
        submissionId: approvedSubmission.id,
        approverUserId: user.id,
        approvalStatus: 'approved',
        approvedAt: new Date()
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get('/api/approvals')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Should only return pending approvals
      const pendingCount = res.body.data.filter(a => a.approvalStatus === 'pending').length;
      expect(pendingCount).toBe(res.body.data.length);
    });

    test('return empty list when user has no pending approvals', async () => {
      const user = await User.create({
        username: `queue_user3_${Date.now()}`,
        email: `queue_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get('/api/approvals')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(0);
    });

    test('support custom pagination parameters', async () => {
      const user = await User.create({
        username: `queue_user4_${Date.now()}`,
        email: `queue_user4_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get('/api/approvals?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  // ============= Get Approval Detail Tests =============
  describe('GET /api/approvals/:id - Get Approval Detail', () => {
    test('successfully retrieve approval detail for assigned approver', async () => {
      const user = await User.create({
        username: `detail_user1_${Date.now()}`,
        email: `detail_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Detail Test', department: 'Finance' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: user.id,
        approvalStatus: 'pending'
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get(`/api/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.approval).toBeDefined();
      expect(res.body.approval.id).toBe(approval.id);
      expect(res.body.approval.submissionId).toBe(submission.id);
    });

    test('return 404 for non-existent approval', async () => {
      const token = createToken(testApprover.id);
      const res = await request(app)
        .get('/api/approvals/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    test('include submission and form details in response', async () => {
      const user = await User.create({
        username: `detail_user2_${Date.now()}`,
        email: `detail_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Detail Form Test', department: 'HR' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: user.id,
        approvalStatus: 'pending'
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get(`/api/approvals/${approval.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.approval.submission).toBeDefined();
      expect(res.body.approval.submission.form).toBeDefined();
      expect(res.body.approval.approver).toBeDefined();
    });
  });

  // ============= Approve Submission Tests =============
  describe('PATCH /api/approvals/:submissionId/approve - Approve Submission', () => {
    test('successfully approve a pending submission', async () => {
      const approver = await User.create({
        username: `approve_user1_${Date.now()}`,
        email: `approve_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Approve Test', department: 'IT' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: approver.id,
        approvalStatus: 'pending'
      });

      const token = createToken(approver.id);
      const res = await request(app)
        .patch(`/api/approvals/${submission.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({ approverComments: 'Looks good' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.approval.approvalStatus).toBe('approved');
      expect(res.body.approval.approvedAt).toBeDefined();
    });

    test('update submission status when approval is given', async () => {
      const approver = await User.create({
        username: `approve_user2_${Date.now()}`,
        email: `approve_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Status Test', department: 'Operations' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: approver.id,
        approvalStatus: 'pending',
        approvalOrder: 1
      });

      const token = createToken(approver.id);
      const res = await request(app)
        .patch(`/api/approvals/${submission.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.submissionStatus).toBe('approved');

      // Verify submission was updated
      const updated = await FormSubmission.findByPk(submission.id);
      expect(updated.status).toBe('approved');
    });

    test('create notification when submission is approved', async () => {
      const approver = await User.create({
        username: `approve_user3_${Date.now()}`,
        email: `approve_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Notification Test', department: 'Finance' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: approver.id,
        approvalStatus: 'pending'
      });

      const token = createToken(approver.id);
      const res = await request(app)
        .patch(`/api/approvals/${submission.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);

      // Verify notification was created
      const notification = await FormNotification.findOne({
        where: {
          submissionId: submission.id,
          recipientUserId: testSubmitter.id
        }
      });

      expect(notification).toBeDefined();
      expect(notification.type).toBe('approved');
    });

    test('return 404 when approval not found', async () => {
      const token = createToken(testApprover.id);
      const res = await request(app)
        .patch('/api/approvals/99999/approve')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('No pending approval found');
    });
  });

  // ============= Reject Submission Tests =============
  describe('PATCH /api/approvals/:submissionId/reject - Reject Submission', () => {
    test('successfully reject a pending submission', async () => {
      const approver = await User.create({
        username: `reject_user1_${Date.now()}`,
        email: `reject_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Reject Test', department: 'HR' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: approver.id,
        approvalStatus: 'pending'
      });

      const token = createToken(approver.id);
      const res = await request(app)
        .patch(`/api/approvals/${submission.id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rejectionReason: 'Missing required information',
          rejectionComments: 'Please provide employee ID'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.approval.approvalStatus).toBe('rejected');
      expect(res.body.approval.rejectionReason).toBe('Missing required information');
    });

    test('update submission status to rejected', async () => {
      const approver = await User.create({
        username: `reject_user2_${Date.now()}`,
        email: `reject_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Reject Status Test', department: 'IT' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: approver.id,
        approvalStatus: 'pending'
      });

      const token = createToken(approver.id);
      const res = await request(app)
        .patch(`/api/approvals/${submission.id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rejectionReason: 'Incomplete form'
        });

      expect(res.status).toBe(200);
      expect(res.body.submissionStatus).toBe('rejected');

      // Verify submission was updated
      const updated = await FormSubmission.findByPk(submission.id);
      expect(updated.status).toBe('rejected');
      expect(updated.notes).toContain('Incomplete form');
    });

    test('create notification when submission is rejected', async () => {
      const approver = await User.create({
        username: `reject_user3_${Date.now()}`,
        email: `reject_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Reject Notification Test', department: 'Finance' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: approver.id,
        approvalStatus: 'pending'
      });

      const token = createToken(approver.id);
      const res = await request(app)
        .patch(`/api/approvals/${submission.id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rejectionReason: 'Invalid data'
        });

      expect(res.status).toBe(200);

      // Verify notification was created
      const notification = await FormNotification.findOne({
        where: {
          submissionId: submission.id,
          recipientUserId: testSubmitter.id
        }
      });

      expect(notification).toBeDefined();
      expect(notification.type).toBe('rejected');
    });

    test('require rejection reason', async () => {
      const token = createToken(testApprover.id);
      const res = await request(app)
        .patch('/api/approvals/1/reject')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Rejection reason is required');
    });

    test('return 404 when approval not found for rejection', async () => {
      const token = createToken(testApprover.id);
      const res = await request(app)
        .patch('/api/approvals/99999/reject')
        .set('Authorization', `Bearer ${token}`)
        .send({
          rejectionReason: 'Test reason'
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('No pending approval found');
    });
  });

  // ============= Approval History Tests =============
  describe('GET /api/approvals/history - Approval History', () => {
    test('successfully retrieve approval history', async () => {
      const user = await User.create({
        username: `history_user1_${Date.now()}`,
        email: `history_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'approved',
        submissionData: { employeeName: 'History Test', department: 'Operations' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: user.id,
        approvalStatus: 'approved',
        reviewedAt: new Date(),
        approvedAt: new Date()
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get('/api/approvals/history')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('filter history by approval status', async () => {
      const user = await User.create({
        username: `history_user2_${Date.now()}`,
        email: `history_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      // Create approved approval
      const approvedSubmission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'approved',
        submissionData: { employeeName: 'Approved History', department: 'IT' }
      });

      const approvedApproval = await FormApproval.create({
        submissionId: approvedSubmission.id,
        approverUserId: user.id,
        approvalStatus: 'approved',
        reviewedAt: new Date(),
        approvedAt: new Date()
      });

      // Create rejected approval
      const rejectedSubmission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'rejected',
        submissionData: { employeeName: 'Rejected History', department: 'HR' }
      });

      const rejectedApproval = await FormApproval.create({
        submissionId: rejectedSubmission.id,
        approverUserId: user.id,
        approvalStatus: 'rejected',
        rejectionReason: 'Invalid',
        reviewedAt: new Date()
      });

      const token = createToken(user.id);
      
      // Filter by approved
      const approvedRes = await request(app)
        .get('/api/approvals/history?status=approved')
        .set('Authorization', `Bearer ${token}`);

      expect(approvedRes.status).toBe(200);
      approvedRes.body.data.forEach(item => {
        expect(item.approvalStatus).toBe('approved');
      });

      // Filter by rejected
      const rejectedRes = await request(app)
        .get('/api/approvals/history?status=rejected')
        .set('Authorization', `Bearer ${token}`);

      expect(rejectedRes.status).toBe(200);
      rejectedRes.body.data.forEach(item => {
        expect(item.approvalStatus).toBe('rejected');
      });
    });

    test('support pagination in history', async () => {
      const token = createToken(testApprover.id);
      const res = await request(app)
        .get('/api/approvals/history?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  // ============= Edge Cases =============
  describe('Edge Cases', () => {
    test('handle approval with empty comments', async () => {
      const approver = await User.create({
        username: `edge_user1_${Date.now()}`,
        email: `edge_user1_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Edge Test', department: 'Finance' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: approver.id,
        approvalStatus: 'pending'
      });

      const token = createToken(approver.id);
      const res = await request(app)
        .patch(`/api/approvals/${submission.id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.approval.approvalStatus).toBe('approved');
    });

    test('handle rejection with long reason text', async () => {
      const approver = await User.create({
        username: `edge_user2_${Date.now()}`,
        email: `edge_user2_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const submission = await FormSubmission.create({
        formId: testForm.id,
        submittedBy: testSubmitter.id,
        status: 'submitted',
        submissionData: { employeeName: 'Long Reason Test', department: 'Operations' }
      });

      const approval = await FormApproval.create({
        submissionId: submission.id,
        approverUserId: approver.id,
        approvalStatus: 'pending'
      });

      const longReason = 'A'.repeat(500);

      const token = createToken(approver.id);
      const res = await request(app)
        .patch(`/api/approvals/${submission.id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rejectionReason: longReason
        });

      expect(res.status).toBe(200);
      expect(res.body.approval.rejectionReason.length).toBe(500);
    });

    test('handle pagination beyond available data', async () => {
      const user = await User.create({
        username: `edge_user3_${Date.now()}`,
        email: `edge_user3_${Date.now()}@test.local`,
        password: 'hashedpassword123',
        userLevel: 'level2',
        isApproved: true,
        isActive: true
      });

      const token = createToken(user.id);
      const res = await request(app)
        .get('/api/approvals?page=100&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination.page).toBe(100);
    });
  });
});
