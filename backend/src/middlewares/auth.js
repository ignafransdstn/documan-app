const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT, attach latest user info from DB and enforce active state
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the latest user record from DB to check active/approval state
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Prevent non-admin deactivated users from accessing protected endpoints
    if (user.userLevel !== 'admin' && user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Attach trimmed user info to request for downstream middlewares/controllers
    req.user = {
      id: user.id,
      username: user.username,
      userLevel: user.userLevel
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const checkUserLevel = (allowedLevels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!allowedLevels.includes(req.user.userLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};

const isAdmin = (req, res, next) => {
  if (req.user.userLevel !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = {
  verifyToken,
  checkUserLevel,
  isAdmin
};