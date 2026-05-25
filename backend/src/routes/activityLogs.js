const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { ActivityLog, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @swagger
 * /activity-logs:
 *   get:
 *     summary: Get activity logs
 *     description: Admin sees all logs. Regular users see only their own logs.
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityLog'
 *                 totalCount:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// Get activity logs
// Admin: See all logs
// Regular users: See only their own logs
router.get('/', verifyToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Build query based on user level
    const whereClause = req.user.userLevel === 'admin' 
      ? {} 
      : { userId: req.user.id };

    const logs = await ActivityLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'userLevel']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await ActivityLog.count({ where: whereClause });

    res.json({
      logs,
      totalCount,
      hasMore: totalCount > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Error fetching activity logs' });
  }
});

/**
 * @swagger
 * /activity-logs/export:
 *   get:
 *     summary: Export activity logs filtered by date range
 *     description: Returns all matching logs without pagination. Admin exports all users; others export only their own.
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date (inclusive), format YYYY-MM-DD
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs up to this date (inclusive), format YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Logs exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ActivityLog'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// Export activity logs filtered by date range (returns all matching rows, no pagination)
router.get('/export', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause = req.user.userLevel === 'admin'
      ? {}
      : { userId: req.user.id };

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereClause.createdAt = { ...(whereClause.createdAt || {}), [Op.gte]: start };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { ...(whereClause.createdAt || {}), [Op.lte]: end };
    }

    const logs = await ActivityLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'userLevel']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({ logs });
  } catch (error) {
    console.error('Export activity logs error:', error);
    res.status(500).json({ message: 'Error exporting activity logs' });
  }
});

module.exports = router;
