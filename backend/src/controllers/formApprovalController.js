const { FormApproval, FormSubmission, Form, User, FormNotification } = require('../models');

/**
 * Get approval queue - list all pending approvals for current user
 * Only users with approval roles can view
 * 
 * GET /api/approvals?page=1&limit=10&submissionStatus=pending&sortBy=createdAt&sortOrder=DESC
 */
exports.getApprovalQueue = async (req, res) => {
  try {
    const { page = 1, limit = 10, submissionStatus = 'submitted', sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const userId = req.user.id;

    // Build where clause - only pending approvals for this user
    const whereClause = {
      approverUserId: userId,
      approvalStatus: 'pending'
    };

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch approvals
    const { count, rows } = await FormApproval.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FormSubmission,
          as: 'submission',
          include: [
            {
              model: Form,
              as: 'form',
              attributes: ['id', 'name', 'description', 'status']
            },
            {
              model: User,
              as: 'submitter',
              attributes: ['id', 'username', 'email']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder]],
      offset,
      limit,
      distinct: true
    });

    res.json({
      success: true,
      data: rows.map(approval => ({
        id: approval.id,
        submissionId: approval.submissionId,
        submission: approval.submission,
        approvalOrder: approval.approvalOrder,
        approvalStatus: approval.approvalStatus,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching approval queue:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch approval queue' });
  }
};

/**
 * Get approval detail - single approval with full submission info
 * 
 * GET /api/approvals/:id
 */
exports.getApprovalDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const approval = await FormApproval.findByPk(id, {
      include: [
        {
          model: FormSubmission,
          as: 'submission',
          include: [
            {
              model: Form,
              as: 'form'
            },
            {
              model: User,
              as: 'submitter',
              attributes: ['id', 'username', 'email']
            },
            {
              model: User,
              as: 'approver1',
              attributes: ['id', 'username', 'email']
            },
            {
              model: User,
              as: 'approver2',
              attributes: ['id', 'username', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    // Check permission: only the assigned approver can view
    if (approval.approverUserId !== userId && req.user.userLevel !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to view this approval' });
    }

    res.json({
      success: true,
      approval: {
        id: approval.id,
        submissionId: approval.submissionId,
        submission: approval.submission,
        approver: approval.approver,
        approvalStatus: approval.approvalStatus,
        approvalOrder: approval.approvalOrder,
        rejectionReason: approval.rejectionReason,
        reviewedAt: approval.reviewedAt,
        approvedAt: approval.approvedAt,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching approval detail:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch approval detail' });
  }
};

/**
 * Approve submission
 * Mark approval as approved and update submission status based on approval chain
 * 
 * PATCH /api/approvals/:submissionId/approve
 * Body: { approverComments? }
 */
exports.approveSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { approverComments } = req.body || {};
    const userId = req.user.id;

    // Find the approval record for this user
    const approval = await FormApproval.findOne({
      where: {
        submissionId,
        approverUserId: userId,
        approvalStatus: 'pending'
      }
    });

    if (!approval) {
      return res.status(404).json({ error: 'No pending approval found for this user on this submission' });
    }

    // Update approval status
    approval.approvalStatus = 'approved';
    approval.reviewedAt = new Date();
    approval.approvedAt = new Date();
    await approval.save();

    // Get submission to check if all approvals are done
    const submission = await FormSubmission.findByPk(submissionId, {
      include: [{ model: User, as: 'submitter' }]
    });

    // Check if all required approvals are complete
    const allApprovals = await FormApproval.findAll({
      where: { submissionId }
    });

    const allApproved = allApprovals.every(a => a.approvalStatus === 'approved');
    const anyRejected = allApprovals.some(a => a.approvalStatus === 'rejected');

    // Update submission status based on approval chain
    if (allApproved) {
      submission.status = 'approved';
    } else if (anyRejected) {
      submission.status = 'rejected';
    }

    await submission.save();

    // Create notification for submitter
    if (submission.submittedBy) {
      await FormNotification.create({
        submissionId,
        recipientUserId: submission.submittedBy,
        type: allApproved ? 'approved' : 'submitted',
        message: `Your submission has been approved by ${req.user.username}${approverComments ? ': ' + approverComments : ''}`,
        isRead: false
      });
    }

    res.json({
      success: true,
      message: 'Submission approved successfully',
      approval: {
        id: approval.id,
        submissionId: approval.submissionId,
        approvalStatus: approval.approvalStatus,
        reviewedAt: approval.reviewedAt,
        approvedAt: approval.approvedAt
      },
      submissionStatus: submission.status
    });

  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: error.message || 'Failed to approve submission' });
  }
};

/**
 * Reject submission
 * Mark approval as rejected and update submission status
 * 
 * PATCH /api/approvals/:submissionId/reject
 * Body: { rejectionReason (required), rejectionComments? }
 */
exports.rejectSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { rejectionReason, rejectionComments } = req.body || {};
    const userId = req.user.id;

    // Validate input
    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Find the approval record for this user
    const approval = await FormApproval.findOne({
      where: {
        submissionId,
        approverUserId: userId,
        approvalStatus: 'pending'
      }
    });

    if (!approval) {
      return res.status(404).json({ error: 'No pending approval found for this user on this submission' });
    }

    // Update approval status
    approval.approvalStatus = 'rejected';
    approval.rejectionReason = rejectionReason;
    approval.reviewedAt = new Date();
    await approval.save();

    // Update submission status to rejected
    const submission = await FormSubmission.findByPk(submissionId);

    submission.status = 'rejected';
    submission.notes = `Rejected by ${req.user.username}: ${rejectionReason}${rejectionComments ? ' - ' + rejectionComments : ''}`;
    await submission.save();

    // Create notification for submitter
    if (submission.submittedBy) {
      await FormNotification.create({
        submissionId,
        recipientUserId: submission.submittedBy,
        type: 'rejected',
        message: `Your submission has been rejected by ${req.user.username}: ${rejectionReason}`,
        isRead: false
      });
    }

    res.json({
      success: true,
      message: 'Submission rejected successfully',
      approval: {
        id: approval.id,
        submissionId: approval.submissionId,
        approvalStatus: approval.approvalStatus,
        rejectionReason: approval.rejectionReason,
        reviewedAt: approval.reviewedAt
      },
      submissionStatus: submission.status
    });

  } catch (error) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ error: error.message || 'Failed to reject submission' });
  }
};

/**
 * Get approval history - all completed approvals (approved or rejected)
 * 
 * GET /api/approvals/history?page=1&limit=10&status=approved&sortBy=reviewedAt&sortOrder=DESC
 */
exports.getApprovalHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = 'reviewedAt', sortOrder = 'DESC' } = req.query;
    const userId = req.user.id;

    // Build where clause
    const whereClause = {
      approverUserId: userId,
      approvalStatus: {
        [require('sequelize').Op.not]: 'pending'
      }
    };

    if (status) {
      whereClause.approvalStatus = status;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch approvals
    const { count, rows } = await FormApproval.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FormSubmission,
          as: 'submission',
          include: [
            {
              model: Form,
              as: 'form',
              attributes: ['id', 'name', 'description']
            },
            {
              model: User,
              as: 'submitter',
              attributes: ['id', 'username', 'email']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder]],
      offset,
      limit,
      distinct: true
    });

    res.json({
      success: true,
      data: rows.map(approval => ({
        id: approval.id,
        submissionId: approval.submissionId,
        submission: approval.submission,
        approvalStatus: approval.approvalStatus,
        rejectionReason: approval.rejectionReason,
        reviewedAt: approval.reviewedAt,
        approvedAt: approval.approvedAt,
        createdAt: approval.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch approval history' });
  }
};
