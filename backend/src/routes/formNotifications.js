const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const formNotificationController = require('../controllers/formNotificationController');

/**
 * Form Notification Endpoints
 * Endpoints untuk mengelola notifikasi form submissions
 */

/**
 * GET /api/notifications/count/unread
 * Get count of unread notifications (lightweight endpoint)
 * Perfect for badge updates in UI
 * 
 * Response: 200 { success, unreadCount }
 */
router.get('/count/unread', verifyToken, formNotificationController.getUnreadCount);

/**
 * GET /api/notifications/stats
 * Get notification statistics
 * 
 * Response: 200 { success, stats: { totalCount, unreadCount, readCount, typeBreakdown, emailStatusBreakdown } }
 */
router.get('/stats', verifyToken, formNotificationController.getNotificationStats);

/**
 * GET /api/notifications
 * Get all notifications for current user
 * 
 * Query Parameters:
 *   - page (default: 1)
 *   - limit (default: 10)
 *   - isRead (optional: true/false to filter)
 *   - sortBy (default: 'createdAt')
 *   - sortOrder (default: 'DESC')
 * 
 * Response: 200 { success, data: [...], pagination }
 */
router.get('/', verifyToken, formNotificationController.getNotifications);

/**
 * GET /api/notifications/:id
 * Get single notification details
 * Automatically marks notification as read when accessed
 * 
 * Response: 200 { success, notification }
 *         404 { error: 'Notification not found' }
 */
router.get('/:id', verifyToken, formNotificationController.getNotificationDetail);

/**
 * PATCH /api/notifications/:id/read
 * Mark single notification as read
 * 
 * Response: 200 { success, message, notification }
 *         404 { error: 'Notification not found' }
 */
router.patch('/:id/read', verifyToken, formNotificationController.markAsRead);

/**
 * PATCH /api/notifications/read-all
 * Mark multiple notifications as read (or all unread if no IDs provided)
 * 
 * Body: { notificationIds?: number[] }
 * 
 * Response: 200 { success, message, count }
 */
router.patch('/read-all', verifyToken, formNotificationController.markMultipleAsRead);

/**
 * DELETE /api/notifications/:id
 * Delete single notification
 * 
 * Response: 200 { success, message }
 *         404 { error: 'Notification not found' }
 */
router.delete('/:id', verifyToken, formNotificationController.deleteNotification);

/**
 * DELETE /api/notifications
 * Delete multiple notifications (or all if no IDs provided)
 * 
 * Body: { notificationIds?: number[] }
 * 
 * Response: 200 { success, message, count }
 */
router.delete('/', verifyToken, formNotificationController.deleteMultipleNotifications);

module.exports = router;
