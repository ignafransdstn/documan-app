const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserSessions,
  changePassword
} = require('../controllers/userController');

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         userLevel:
 *           type: string
 *           enum: [admin, level1, level2, level3]
 *           description: User access level (admin only)
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Current password
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: New password
 *     UserSession:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username
 *         userLevel:
 *           type: string
 *           description: User access level
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 */

// Protect all routes
router.use(verifyToken);
// Apply screen-capture prevention headers for non-admin authenticated users
const preventScreenCapture = require('../middlewares/screenCapture');
router.use((req, res, next) => preventScreenCapture(req, res, next));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/', isAdmin, getAllUsers);

/**
 * Summary endpoint - Accessible by all authenticated users
 * Non-admin users can see document counts but not active sessions details
 */
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const { User, Document, SubDocument } = require('../models');
    const { Op } = require('sequelize');

    const totalUsers = await User.count();
    const admins = await User.count({ where: { userLevel: 'admin' } });
    const level1 = await User.count({ where: { userLevel: 'level1' } });
    const level2 = await User.count({ where: { userLevel: 'level2' } });
    const level3 = await User.count({ where: { userLevel: 'level3' } });
    const pendingAdmins = await User.count({ where: { userLevel: 'admin', isApproved: false } });
    const totalMasterDocuments = await Document.count();
    const totalSubDocuments = await SubDocument.count();
    const totalDocuments = totalMasterDocuments + totalSubDocuments;
    const recentDocuments = await Document.findAll({ order: [['createdAt', 'DESC']], limit: 5 });

    // Document status breakdown (master + sub combined)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active: status='active' AND (no expiredDate OR expiredDate >= today)
    const activeCount = await Document.count({
      where: {
        status: 'active',
        [Op.or]: [
          { expiredDate: null },
          { expiredDate: { [Op.gte]: today } }
        ]
      }
    });
    const activeSubCount = await SubDocument.count({
      where: {
        status: 'active',
        [Op.or]: [
          { expiredDate: null },
          { expiredDate: { [Op.gte]: today } }
        ]
      }
    });

    // Archived
    const archivedCount = await Document.count({ where: { status: 'archived' } });
    const archivedSubCount = await SubDocument.count({ where: { status: 'archived' } });

    // Expired: expiredDate < today (regardless of status field)
    const expiredCount = await Document.count({
      where: { expiredDate: { [Op.lt]: today }, status: { [Op.ne]: 'archived' } }
    });
    const expiredSubCount = await SubDocument.count({
      where: { expiredDate: { [Op.lt]: today }, status: { [Op.ne]: 'archived' } }
    });

    // Expiry watch: H-30 (30 days ahead) to H+3 (3 days after expiry)
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    const expiringDocuments = await Document.findAll({
      where: {
        status: { [Op.ne]: 'archived' },
        expiredDate: { [Op.gte]: threeDaysAgo, [Op.lte]: in30Days }
      },
      attributes: ['id', 'title', 'expiredDate', 'location'],
      order: [['expiredDate', 'ASC']],
      limit: 15
    });
    const expiringSubDocuments = await SubDocument.findAll({
      where: {
        status: { [Op.ne]: 'archived' },
        expiredDate: { [Op.gte]: threeDaysAgo, [Op.lte]: in30Days }
      },
      attributes: ['id', 'title', 'expiredDate', 'location'],
      order: [['expiredDate', 'ASC']],
      limit: 15
    });

    // Combine and sort by expiredDate ascending (expired first, then upcoming)
    const expiringAll = [
      ...expiringDocuments.map(d => ({ ...d.toJSON(), docType: 'master' })),
      ...expiringSubDocuments.map(d => ({ ...d.toJSON(), docType: 'sub' }))
    ].sort((a, b) => new Date(a.expiredDate) - new Date(b.expiredDate)).slice(0, 15);

    // Year-ahead notification: only documents expiring in exactly 363–365 days
    // (H-365, H-364, H-363 window — shows for 3 days then disappears automatically)
    const in363Days = new Date(today);
    in363Days.setDate(in363Days.getDate() + 363);
    const in365Days = new Date(today);
    in365Days.setDate(in365Days.getDate() + 365);
    in365Days.setHours(23, 59, 59, 999);

    const yearNotifDocs = await Document.findAll({
      where: {
        status: { [Op.ne]: 'archived' },
        expiredDate: { [Op.gte]: in363Days, [Op.lte]: in365Days }
      },
      attributes: ['id', 'title', 'expiredDate', 'location'],
      order: [['expiredDate', 'ASC']]
    });
    const yearNotifSubDocs = await SubDocument.findAll({
      where: {
        status: { [Op.ne]: 'archived' },
        expiredDate: { [Op.gte]: in363Days, [Op.lte]: in365Days }
      },
      attributes: ['id', 'title', 'expiredDate', 'location'],
      order: [['expiredDate', 'ASC']]
    });
    const yearAheadNotifications = [
      ...yearNotifDocs.map(d => ({ ...d.toJSON(), docType: 'master' })),
      ...yearNotifSubDocs.map(d => ({ ...d.toJSON(), docType: 'sub' }))
    ].sort((a, b) => new Date(a.expiredDate) - new Date(b.expiredDate));

    // Get active sessions
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeUsers = await User.findAll({
      where: {
        lastLogin: { [Op.gte]: oneHourAgo },
        [Op.or]: [
          { lastLogout: null },
          { lastLogout: { [Op.lt]: require('sequelize').literal('"lastLogin"') } }
        ]
      }
    });
    const activeSessions = activeUsers.length;

    res.json({
      totalUsers,
      admins,
      level1,
      level2,
      level3,
      pendingAdmins,
      totalDocuments,
      totalMasterDocuments,
      totalSubDocuments,
      activeSessions,
      recentDocuments,
      statusBreakdown: {
        active: activeCount + activeSubCount,
        archived: archivedCount + archivedSubCount,
        expired: expiredCount + expiredSubCount
      },
      expiringDocuments: expiringAll,
      yearAheadNotifications
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ message: 'Error fetching summary' });
  }
});

/**
 * @swagger
 * /users/sessions:
 *   get:
 *     summary: Get user sessions (Admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSession'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 */
router.get('/sessions', isAdmin, getUserSessions);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized to view this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Username or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       400:
 *         description: Cannot delete the last admin user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', isAdmin, deleteUser);

/**
 * @swagger
 * /users/{id}/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *       401:
 *         description: Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to change this user's password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/change-password', changePassword);

/**
 * Admin reset password for another user
 */
router.post('/:id/reset-password', isAdmin, async (req, res, next) => {
  try {
    const { resetPasswordAdmin } = require('../controllers/userController');
    return await resetPasswordAdmin(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * Approve a pending user (Admin only)
 */
router.post('/:id/approve', isAdmin, async (req, res, next) => {
  try {
    // Delegate to controller
    const { approveUser } = require('../controllers/userController');
    return await approveUser(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * Set user active/inactive (Admin only, cannot change admins)
 */
router.patch('/:id/activation', isAdmin, async (req, res, next) => {
  try {
    const { setUserActive } = require('../controllers/userController')
    return await setUserActive(req, res, next)
  } catch (err) {
    next(err)
  }
})

module.exports = router;