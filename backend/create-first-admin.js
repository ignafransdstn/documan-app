/**
 * Script to create the first admin user with default documented credentials
 * Username: admin
 * Password: admin123
 * Email: admin@example.com
 */

const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize('doc_management_dev', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

async function createFirstAdmin() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');

    // Hash the default password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert admin user directly via SQL
    const [results, metadata] = await sequelize.query(`
      INSERT INTO "Users" (username, email, password, "userLevel", "isActive", "isApproved", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, username, email, "userLevel", "isActive", "isApproved";
    `, {
      bind: ['admin', 'admin@example.com', hashedPassword, 'admin', true, true]
    });

    console.log('\n✅ First admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@example.com');
    console.log('\n👤 User Details:');
    console.log('   ID:', results[0].id);
    console.log('   Level:', results[0].userLevel);
    console.log('   Active:', results[0].isActive);
    console.log('   Approved:', results[0].isApproved);
    
    console.log('\n🌐 You can now login at:');
    console.log('   Frontend: http://localhost:5175');
    console.log('   Backend: http://localhost:5001');
    
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('\n❌ Admin user already exists!');
      console.log('   Use credentials: admin / admin123');
    } else {
      console.error('\n❌ Error creating admin user:', error.message);
    }
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

createFirstAdmin();
