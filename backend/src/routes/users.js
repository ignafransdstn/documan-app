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
    
    // Get active sessions: users yang login dalam 1 jam terakhir dan belum logout
    // Sesi dianggap aktif jika:
    // 1. lastLogin ada dan dalam 1 jam terakhir
    // 2. lastLogout null ATAU lastLogout < lastLogin (belum logout setelah login terakhir)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 jam
    const { Op } = require('sequelize');
    
    const activeUsers = await User.findAll({
      where: {
        lastLogin: {
          [Op.gte]: oneHourAgo
        },
        [Op.or]: [
          { lastLogout: null },
          {
            lastLogout: {
              [Op.lt]: require('sequelize').literal('"lastLogin"')
            }
          }
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
      recentDocuments 
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