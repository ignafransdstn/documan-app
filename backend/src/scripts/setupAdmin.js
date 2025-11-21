const { User } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createOrUpdateAdmin() {
  try {
    console.log('🔍 Checking admin user...\n');
    
    let admin = await User.findOne({ where: { username: 'admin' } });
    
    // Don't hash here - model hook will do it
    const plainPassword = 'admin123';
    
    if (admin) {
      console.log('📝 Admin user found. Updating...');
      admin.password = plainPassword;
      admin.userLevel = 'admin';
      admin.isApproved = true;
      admin.isActive = true;
      admin.email = 'admin@example.com';
      admin.name = 'System Administrator';
      await admin.save();
      console.log('✅ Admin user updated!');
    } else {
      console.log('📝 Creating new admin user...');
      admin = await User.create({
        username: 'admin',
        password: plainPassword,
        email: 'admin@example.com',
        name: 'System Administrator',
        userLevel: 'admin',
        isApproved: true,
        isActive: true
      });
      console.log('✅ Admin user created!');
    }
    
    console.log('\n📊 Admin Details:');
    console.log('- Username:', admin.username);
    console.log('- Email:', admin.email);
    console.log('- User Level:', admin.userLevel);
    console.log('- Is Approved:', admin.isApproved);
    console.log('- Is Active:', admin.isActive);
    console.log('\n🔑 Login Credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    // Test password
    const isMatch = await bcrypt.compare('admin123', admin.password);
    console.log('\n🧪 Password verification test:', isMatch ? '✅ PASS' : '❌ FAIL');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createOrUpdateAdmin();
