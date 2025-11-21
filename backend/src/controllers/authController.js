const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      userLevel: user.userLevel 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const register = async (req, res) => {
  try {
    const { username, email, password, userLevel } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ 
      where: { 
        [Op.or]: [{ username }, { email }] 
      } 
    });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    // If this endpoint is called by an authenticated admin (internal register), allow setting userLevel.
    // For public signups (signup endpoint below) we will create normal users but if userLevel is admin, mark as isApproved=false
    const userAttrs = {
      username,
      email,
      password,
      name: req.body.name || null
    };

    if (req.user?.userLevel === 'admin') {
      userAttrs.userLevel = userLevel || 'level3';
      userAttrs.isApproved = true;
    } else {
      // Non-authenticated or non-admin registration results in default 'level3' unless explicitly requested
      // If requested level is 'admin', mark as unapproved so admins can approve later
      userAttrs.userLevel = userLevel && ['level1','level2','level3'].includes(userLevel) ? userLevel : 'level3';
      if (userLevel === 'admin') {
        userAttrs.userLevel = 'admin';
        userAttrs.isApproved = false;
      } else {
        userAttrs.isApproved = true;
      }
    }

    const user = await User.create(userAttrs);

    const token = generateToken(user);

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      userLevel: user.userLevel,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check approval when applicable
    if (user.userLevel === 'admin' && user.isApproved === false) {
      return res.status(403).json({ message: 'Admin account pending approval' });
    }

    // Check active state for non-admin users
    if (user.userLevel !== 'admin' && user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'LOGIN',
      description: 'User logged in successfully',
      req
    });

    const token = generateToken(user);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      userLevel: user.userLevel,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = generateToken(user);
    res.json({ token });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error getting profile' });
  }
};

const logout = async (req, res) => {
  try {
    // Update lastLogout untuk user yang logout
    await User.update(
      { lastLogout: new Date() },
      { where: { id: req.user.id } }
    );

    // Log logout activity
    await logActivity({
      userId: req.user.id,
      action: 'LOGOUT',
      description: 'User logged out',
      req
    });

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
};

module.exports = {
  register,
  // public signup endpoint
  async signupPublic(req, res) {
    try {
      const { username, email, password, userLevel, name } = req.body;

      // Check if user exists
      const userExists = await User.findOne({
        where: {
          [Op.or]: [{ username }, { email }]
        }
      });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const userAttrs = {
        username,
        email,
        password,
        name: name || null
      };

      // If user signs up requesting admin, create as unapproved
      if (userLevel === 'admin') {
        userAttrs.userLevel = 'admin';
        userAttrs.isApproved = false;
      } else if (['level1', 'level2', 'level3'].includes(userLevel)) {
        userAttrs.userLevel = userLevel;
        userAttrs.isApproved = true;
      } else {
        userAttrs.userLevel = 'level3';
        userAttrs.isApproved = true;
      }

      const user = await User.create(userAttrs);

      // Do not auto-login unapproved admins
      if (user.isApproved) {
        const token = generateToken(user);
        return res.status(201).json({
          id: user.id,
          username: user.username,
          email: user.email,
          userLevel: user.userLevel,
          token
        });
      }

      // For pending admin, return 201 with pending status
      return res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        userLevel: user.userLevel,
        isApproved: user.isApproved,
        message: 'Account created and pending admin approval'
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Error registering user' });
    }
  },
  login,
  logout,
  refreshToken,
  getProfile
};