const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { sequelize } = require('../models');

async function createAdminUser() {
  try {
    await sequelize.sync();

    const adminData = {
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      userLevel: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [admin, created] = await User.findOrCreate({
      where: { username: adminData.username },
      defaults: adminData
    });

    if (created) {
      console.log('Admin user created successfully!');
      console.log('Username:', adminData.username);
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists!');
    }

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();