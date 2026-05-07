const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { ActivityLog, User } = require('../models');
const { Op } = require('sequelize');

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
