const { ActivityLog } = require('../models');

/**
 * Log user activity
 * @param {Object} params
 * @param {number} params.userId - User ID
 * @param {string} params.action - Action type (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, DOWNLOAD)
 * @param {string} params.description - Activity description
 * @param {string} params.entityType - Optional entity type (document, subdocument, user)
 * @param {number} params.entityId - Optional entity ID
 * @param {Object} params.req - Express request object (for IP and User Agent)
 */
async function logActivity({ userId, action, description, entityType = null, entityId = null, req = null }) {
  try {
    const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
    const userAgent = req ? req.get('user-agent') : null;

    await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      description,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent breaking main flow
  }
}

module.exports = { logActivity };
