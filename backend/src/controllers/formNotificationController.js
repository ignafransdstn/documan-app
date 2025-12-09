const { FormNotification, FormSubmission, User, Form } = require('../models');

/**
 * Get notifications for current user
 * Lists all notifications with pagination and filtering
 * 
 * GET /api/notifications?page=1&limit=10&isRead=false&sortBy=createdAt&sortOrder=DESC
 */
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, isRead, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const userId = req.user.id;

    // Build where clause
    const whereClause = {
      recipientUserId: userId
    };

    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true' || isRead === true;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch notifications
    const { count, rows } = await FormNotification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FormSubmission,
          as: 'submission',
          attributes: ['id', 'status', 'submittedAt'],
          include: [
            {
              model: Form,
              as: 'form',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [[sortBy, sortOrder]],
      offset,
      limit: parseInt(limit),
      distinct: true
    });

    res.json({
      success: true,
      data: rows.map(notification => ({
        id: notification.id,
        submissionId: notification.submissionId,
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        emailStatus: notification.emailStatus,
        submission: notification.submission,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        sentAt: notification.sentAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
        unreadCount: rows.filter(n => !n.isRead).length
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
};

/**
 * Get single notification details
 * 
 * GET /api/notifications/:id
 */
exports.getNotificationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await FormNotification.findOne({
      where: {
        id,
        recipientUserId: userId
      },
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
              attributes: ['id', 'username', 'email', 'name']
            }
          ]
        }
      ]
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Mark as read if not already
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      success: true,
      notification: {
        id: notification.id,
        submissionId: notification.submissionId,
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        emailStatus: notification.emailStatus,
        submission: notification.submission,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        sentAt: notification.sentAt
      }
    });

  } catch (error) {
    console.error('Error fetching notification detail:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notification' });
  }
};

/**
 * Mark notification as read
 * 
 * PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await FormNotification.findOne({
      where: {
        id,
        recipientUserId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification: {
        id: notification.id,
        isRead: notification.isRead,
        readAt: notification.readAt
      }
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
};

/**
 * Mark multiple notifications as read
 * 
 * PATCH /api/notifications/read-all
 * Body: { notificationIds?: number[] } (optional - if not provided, marks all unread as read)
 */
exports.markMultipleAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body || {};
    const userId = req.user.id;

    const whereClause = {
      recipientUserId: userId,
      isRead: false
    };

    // If specific IDs provided, filter by them
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      whereClause.id = {
        [require('sequelize').Op.in]: notificationIds
      };
    }

    const updated = await FormNotification.update(
      {
        isRead: true,
        readAt: new Date()
      },
      { where: whereClause, returning: true }
    );

    res.json({
      success: true,
      message: `${updated[0]} notification(s) marked as read`,
      count: updated[0]
    });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: error.message || 'Failed to mark notifications as read' });
  }
};

/**
 * Delete notification
 * 
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await FormNotification.findOne({
      where: {
        id,
        recipientUserId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message || 'Failed to delete notification' });
  }
};

/**
 * Delete multiple notifications
 * 
 * DELETE /api/notifications
 * Body: { notificationIds?: number[] } (optional - if not provided, deletes all)
 */
exports.deleteMultipleNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body || {};
    const userId = req.user.id;

    const whereClause = {
      recipientUserId: userId
    };

    // If specific IDs provided, filter by them
    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      whereClause.id = {
        [require('sequelize').Op.in]: notificationIds
      };
    }

    const deleted = await FormNotification.destroy({
      where: whereClause
    });

    res.json({
      success: true,
      message: `${deleted} notification(s) deleted successfully`,
      count: deleted
    });

  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to delete notifications' });
  }
};

/**
 * Get notification statistics for current user
 * 
 * GET /api/notifications/stats
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalCount = await FormNotification.count({
      where: { recipientUserId: userId }
    });

    const unreadCount = await FormNotification.count({
      where: {
        recipientUserId: userId,
        isRead: false
      }
    });

    const typeBreakdown = await FormNotification.findAll({
      where: { recipientUserId: userId },
      attributes: [
        'type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    const emailStatusBreakdown = await FormNotification.findAll({
      where: { recipientUserId: userId },
      attributes: [
        'emailStatus',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['emailStatus'],
      raw: true
    });

    res.json({
      success: true,
      stats: {
        totalCount,
        unreadCount,
        readCount: totalCount - unreadCount,
        typeBreakdown: typeBreakdown.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
        emailStatusBreakdown: emailStatusBreakdown.reduce((acc, item) => {
          acc[item.emailStatus] = parseInt(item.count);
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notification statistics' });
  }
};

/**
 * Get unread notifications count (lightweight)
 * 
 * GET /api/notifications/count/unread
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await FormNotification.count({
      where: {
        recipientUserId: userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch unread count' });
  }
};
