const {
  User,
  FormSubmission,
  Form,
  FormApproval,
  FormNotification,
  sequelize
} = require('../models');
const { sendEmail, sendEmailBatch } = require('../services/emailService');
const { Op } = require('sequelize');

/**
 * Send submission confirmation email to submitter
 * Notifies all approvers of pending submission
 */
async function notifySubmission(submissionId, res) {
  try {
    const submission = await FormSubmission.findByPk(submissionId, {
      include: [
        { model: User, as: 'submitter' },
        { model: Form, as: 'form' }
      ]
    });

    if (!submission) {
      if (res) return res.status(404).json({ success: false, error: 'Submission not found' });
      throw new Error('Submission not found');
    }

    // Send confirmation to submitter
    await sendEmail(
      submission.submitter.email,
      'submissionConfirmation',
      {
        submitterName: submission.submitter.username,
        formName: submission.form.name,
        submissionId: submission.id,
        submissionDate: submission.createdAt
      }
    );

    // Find and notify level1 approvers
    const approvers = await User.findAll({
      where: {
        userLevel: { [Op.in]: ['admin', 'manager'] },
        isActive: true
      }
    });

    if (approvers.length > 0) {
      await sendEmailBatch(
        approvers.map(a => a.email),
        'approverNotification',
        {
          submitterName: submission.submitter.username,
          formName: submission.form.name,
          submissionId: submission.id,
          submissionDate: submission.createdAt
        }
      );
    }

    // Log notification
    await FormNotification.create({
      submissionId: submission.id,
      userId: submission.submitterId,
      type: 'submitted',
      message: `Form "${submission.form.name}" submitted and awaiting approval`,
      isRead: false
    });

    if (res) {
      return res.status(200).json({
        success: true,
        message: 'Submission confirmation email sent successfully'
      });
    }
  } catch (error) {
    console.error('Error sending submission notification:', error);
    if (res) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
}

/**
 * Send approval notification email to submitter
 */
async function notifyApproval(submissionId, approverId, res) {
  try {
    const submission = await FormSubmission.findByPk(submissionId, {
      include: [
        { model: User, as: 'submitter' },
        { model: Form, as: 'form' },
        { model: FormApproval, as: 'approvals' }
      ]
    });

    if (!submission) {
      if (res) return res.status(404).json({ success: false, error: 'Submission not found' });
      throw new Error('Submission not found');
    }

    const approver = await User.findByPk(approverId);

    if (!approver) {
      if (res) return res.status(404).json({ success: false, error: 'Approver not found' });
      throw new Error('Approver not found');
    }

    // Send approval to submitter
    await sendEmail(
      submission.submitter.email,
      'approvalNotification',
      {
        submitterName: submission.submitter.username,
        formName: submission.form.name,
        approverName: approver.username,
        approvalDate: new Date(),
        submissionId: submission.id
      }
    );

    // Log notification
    await FormNotification.create({
      submissionId: submission.id,
      userId: submission.submitterId,
      type: 'approved',
      message: `Your form "${submission.form.name}" has been approved by ${approver.username}`,
      isRead: false
    });

    if (res) {
      return res.status(200).json({
        success: true,
        message: 'Approval notification email sent successfully'
      });
    }
  } catch (error) {
    console.error('Error sending approval notification:', error);
    if (res) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
}

/**
 * Send rejection notification email with reason
 */
async function notifyRejection(submissionId, approverId, rejectionReason, res) {
  try {
    const submission = await FormSubmission.findByPk(submissionId, {
      include: [
        { model: User, as: 'submitter' },
        { model: Form, as: 'form' }
      ]
    });

    if (!submission) {
      if (res) return res.status(404).json({ success: false, error: 'Submission not found' });
      throw new Error('Submission not found');
    }

    const approver = await User.findByPk(approverId);

    if (!approver) {
      if (res) return res.status(404).json({ success: false, error: 'Approver not found' });
      throw new Error('Approver not found');
    }

    // Send rejection to submitter
    await sendEmail(
      submission.submitter.email,
      'rejectionNotification',
      {
        submitterName: submission.submitter.username,
        formName: submission.form.name,
        approverName: approver.username,
        rejectionReason: rejectionReason,
        submissionId: submission.id
      }
    );

    // Log notification with reason
    await FormNotification.create({
      submissionId: submission.id,
      userId: submission.submitterId,
      type: 'rejected',
      message: `Your form "${submission.form.name}" has been rejected by ${approver.username}. Reason: ${rejectionReason}`,
      isRead: false
    });

    if (res) {
      return res.status(200).json({
        success: true,
        message: 'Rejection notification email sent successfully'
      });
    }
  } catch (error) {
    console.error('Error sending rejection notification:', error);
    if (res) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
}

/**
 * Send archive notification email
 */
async function notifyArchive(submissionId, documentId, res) {
  try {
    const submission = await FormSubmission.findByPk(submissionId, {
      include: [
        { model: User, as: 'submitter' },
        { model: Form, as: 'form' }
      ]
    });

    if (!submission) {
      if (res) return res.status(404).json({ success: false, error: 'Submission not found' });
      throw new Error('Submission not found');
    }

    // Send archive confirmation to submitter
    await sendEmail(
      submission.submitter.email,
      'archiveNotification',
      {
        submitterName: submission.submitter.username,
        formName: submission.form.name,
        documentId: documentId,
        archiveDate: new Date(),
        submissionId: submission.id
      }
    );

    // Log notification
    await FormNotification.create({
      submissionId: submission.id,
      userId: submission.submitterId,
      type: 'archived',
      message: `Your form "${submission.form.name}" has been archived (Document ID: ${documentId})`,
      isRead: false
    });

    if (res) {
      return res.status(200).json({
        success: true,
        message: 'Archive notification email sent successfully'
      });
    }
  } catch (error) {
    console.error('Error sending archive notification:', error);
    if (res) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
}

/**
 * Get paginated notifications for a user
 */
async function getUserNotifications(userId, req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const { count, rows } = await FormNotification.findAndCountAll({
      where,
      include: [
        { model: FormSubmission, as: 'submission', include: [{ model: Form, as: 'form' }] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Mark notification as read
 */
async function markNotificationRead(notificationId, req, res) {
  try {
    const notification = await FormNotification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Delete notification
 */
async function deleteNotification(notificationId, req, res) {
  try {
    const notification = await FormNotification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await notification.destroy();

    return res.status(200).json({
      success: true,
      message: 'Notification deleted',
      deletedId: notificationId
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  notifySubmission,
  notifyApproval,
  notifyRejection,
  notifyArchive,
  getUserNotifications,
  markNotificationRead,
  deleteNotification
};
