const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const {
  notifySubmission,
  notifyApproval,
  notifyRejection,
  notifyArchive,
  getUserNotifications,
  markNotificationRead,
  deleteNotification
} = require('../controllers/emailNotificationController');

/**
 * @swagger
 * /api/email/send/submission/{submissionId}:
 *   post:
 *     summary: Send submission confirmation email
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       404:
 *         description: Submission not found
 */
router.post(
  '/send/submission/:submissionId',
  verifyToken,
  (req, res) => notifySubmission(req.params.submissionId, res)
);

/**
 * @swagger
 * /api/email/send/approval/{submissionId}/{approverId}:
 *   post:
 *     summary: Send approval notification email
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: approverId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       404:
 *         description: Submission not found
 */
router.post(
  '/send/approval/:submissionId/:approverId',
  verifyToken,
  (req, res) => notifyApproval(req.params.submissionId, req.params.approverId, res)
);

/**
 * @swagger
 * /api/email/send/rejection/{submissionId}/{approverId}:
 *   post:
 *     summary: Send rejection notification email
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: approverId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       404:
 *         description: Submission not found
 */
router.post(
  '/send/rejection/:submissionId/:approverId',
  verifyToken,
  (req, res) => {
    const { rejectionReason } = req.body;
    return notifyRejection(req.params.submissionId, req.params.approverId, rejectionReason, res);
  }
);

/**
 * @swagger
 * /api/email/send/archive/{submissionId}/{documentId}:
 *   post:
 *     summary: Send archive notification email
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       404:
 *         description: Submission not found
 */
router.post(
  '/send/archive/:submissionId/:documentId',
  verifyToken,
  (req, res) => notifyArchive(req.params.submissionId, req.params.documentId, res)
);

/**
 * @swagger
 * /api/email/user:
 *   get:
 *     summary: Get notifications for current user
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get(
  '/user',
  verifyToken,
  (req, res) => getUserNotifications(req.user.id, req, res)
);

/**
 * @swagger
 * /api/email/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch(
  '/:notificationId/read',
  verifyToken,
  (req, res) => markNotificationRead(req.params.notificationId, req, res)
);

/**
 * @swagger
 * /api/email/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete(
  '/:notificationId',
  verifyToken,
  (req, res) => deleteNotification(req.params.notificationId, req, res)
);

module.exports = router;
