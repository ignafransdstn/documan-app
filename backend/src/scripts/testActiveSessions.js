const axios = require('axios');
const { User } = require('../models');

async function test() {
  try {
    console.log('🔐 Test Active Sessions Counting Logic\n');
    
    // Login admin untuk ambil summary
    const admin = await axios.post('http://127.0.0.1:5001/api/auth/login', { 
      username: 'admin', 
      password: 'admin123' 
    });
    
    // Cek data langsung dari database
    const { Op } = require('sequelize');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const allUsers = await User.findAll({
      attributes: ['username', 'lastLogin', 'lastLogout'],
      where: {
        lastLogin: { [Op.gte]: oneHourAgo }
      }
    });
    
    console.log('👥 Users yang login dalam 1 jam terakhir:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let activeCount = 0;
    allUsers.forEach(u => {
      const isActive = !u.lastLogout || (u.lastLogout < u.lastLogin);
      if (isActive) activeCount++;
      
      console.log(`${isActive ? '✅' : '❌'} ${u.username}`);
      console.log(`   Login:  ${u.lastLogin?.toLocaleString('id-ID') || 'Never'}`);
      console.log(`   Logout: ${u.lastLogout?.toLocaleString('id-ID') || 'Never'}`);
      console.log(`   Status: ${isActive ? 'ACTIVE' : 'LOGGED OUT'}`);
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total Active Sessions (DB count): ${activeCount}`);
    
    // Verify dengan API
    const summary = await axios.get('http://127.0.0.1:5001/api/users/summary', {
      headers: { 'Authorization': 'Bearer ' + admin.data.token }
    });
    console.log(`📊 API Active Sessions: ${summary.data.activeSessions}`);
    
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

test();
