const { User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
  try {
    // Only admin can see all users
    if (req.user.userLevel !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view all users' });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error getting users' });
  }
};

const getUserById = async (req, res) => {
  try {
    // Admin can view any user, others can only view their own profile
    if (req.user.userLevel !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Not authorized to view this user' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error getting user' });
  }
};

const updateUser = async (req, res) => {
  try {
    // Only admin can update other users
    if (req.user.userLevel !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create update data from request body
    const updateData = {};

    // If a field is provided in the request body, include it in the update
    if (req.body.hasOwnProperty('username')) {
      updateData.username = req.body.username || user.username;
    }
    if (req.body.hasOwnProperty('email')) {
      updateData.email = req.body.email || user.email;
    }
    if (req.body.hasOwnProperty('userLevel') && req.user.userLevel === 'admin') {
      updateData.userLevel = req.body.userLevel;
    }
    // Admins may set approval flag
    if (req.body.hasOwnProperty('isApproved') && req.user.userLevel === 'admin') {
      updateData.isApproved = !!req.body.isApproved;
    }

    // Check if username or email is being updated and already exists
    if (updateData.username !== user.username || updateData.email !== user.email) {
      const conditions = [];
      if (updateData.username) conditions.push({ username: updateData.username });
      if (updateData.email) conditions.push({ email: updateData.email });

      if (conditions.length > 0) {
        const existingUser = await User.findOne({
          where: {
            [Op.and]: [
              { id: { [Op.ne]: user.id } },
              { [Op.or]: conditions }
            ]
          }
        });

        if (existingUser) {
          return res.status(400).json({ message: 'Username or email already exists' });
        }
      }
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

const approveUser = async (req, res) => {
  try {
    // Only admin can approve
    if (req.user.userLevel !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to approve users' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isApproved = true;
    await user.save();

    res.json({ message: 'User approved', id: user.id, username: user.username });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Error approving user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Only admin can delete users
    if (req.user.userLevel !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete users' });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.userLevel === 'admin') {
      const adminCount = await User.count({ where: { userLevel: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

const getUserSessions = async (req, res) => {
  try {
    // Only admin can view user sessions
    if (req.user.userLevel !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view user sessions' });
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'userLevel', 'lastLogin', 'createdAt'],
      order: [['lastLogin', 'DESC']]
    });

    res.json(users);
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ message: 'Error getting user sessions' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Users can only change their own password
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Not authorized to change this user\'s password' });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password (store plain here; model hook will hash it once)
    await user.update({ password: newPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};

// Admin endpoint to reset another user's password without current password
const resetPasswordAdmin = async (req, res) => {
  try {
    // Only admin can reset other users' passwords
    if (req.user.userLevel !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reset passwords' });
    }

    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ message: 'Invalid new password' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Let model hook hash the password once on update
    await user.update({ password: newPassword });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

const setUserActive = async (req, res) => {
  try {
    // Only admin can toggle active state
    if (req.user.userLevel !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to change user active state' });
    }

    const { active } = req.body
    if (typeof active !== 'boolean') {
      return res.status(400).json({ message: 'Invalid payload: active must be boolean' });
    }

    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Prevent changing admin active state via this endpoint
    if (user.userLevel === 'admin') return res.status(400).json({ message: 'Cannot change admin active state via this endpoint' })

    user.isActive = active
    await user.save()

    res.json({ id: user.id, isActive: user.isActive })
  } catch (error) {
    console.error('Set user active error:', error)
    res.status(500).json({ message: 'Error setting user active state' })
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  approveUser,
  getUserSessions,
  changePassword
  ,
  resetPasswordAdmin
  ,
  setUserActive
};