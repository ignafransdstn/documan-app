const { User } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.findOne({ where: { username: 'admin' } });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }
    
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('✅ Admin password reset to: admin123');
    console.log('Username: admin');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
