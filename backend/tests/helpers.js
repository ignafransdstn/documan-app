const jwt = require('jsonwebtoken');
const { User } = require('../src/models');

const createTestUser = async (userData) => {
  return await User.create(userData);
};

const createTestUsers = async () => {
  const admin = await createTestUser(testUsers.admin);
  const level1 = await createTestUser(testUsers.level1);
  const level2 = await createTestUser(testUsers.level2);
  const level3 = await createTestUser(testUsers.level3);
  return [admin, level1, level2, level3];
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      userLevel: user.userLevel 
    },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '1h' }
  );
};

const cleanupTestData = async () => {
  await clearDatabase();
};

const clearDatabase = async () => {
  const models = require('../src/models');
  const tableNames = Object.keys(models).filter(key => key !== 'sequelize' && key !== 'Sequelize');
  
  for (const modelName of tableNames) {
    await models[modelName].destroy({ 
      where: {},
      force: true,
      truncate: { cascade: true }
    });
  }
};

const testUsers = {
  admin: {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    userLevel: 'admin'
  },
  level1: {
    username: 'level1user',
    email: 'level1@example.com',
    password: 'pass123',
    userLevel: 'level1'
  },
  level2: {
    username: 'level2user',
    email: 'level2@example.com',
    password: 'pass123',
    userLevel: 'level2'
  },
  level3: {
    username: 'level3user',
    email: 'level3@example.com',
    password: 'pass123',
    userLevel: 'level3'
  }
};

module.exports = {
  createTestUser,
  createTestUsers,
  generateToken,
  clearDatabase,
  cleanupTestData,
  testUsers
};