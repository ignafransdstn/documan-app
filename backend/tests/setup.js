const { sequelize } = require('../src/models');

// This will run before all tests
beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }
});

// This will run after all tests
afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Database cleanup error:', error);
    throw error;
  }
});

beforeAll(async () => {
  try {
    // Sync database with force option to ensure clean state
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Database sync error:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close database connection
    await sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Database close error:', error);
    throw error;
  }
});