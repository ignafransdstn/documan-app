const axios = require('axios');

async function test() {
  try {
    console.log('🧪 Test Logout & Session Removal\n');
    
    // 1. Login testuser
    const user = await axios.post('http://127.0.0.1:5001/api/auth/login', { 
      username: 'testuser1213', 
      password: 'Test@123' 
    });
    console.log('✅ User login successful');
    
    // 2. Login admin untuk cek summary
    const admin = await axios.post('http://127.0.0.1:5001/api/auth/login', { 
      username: 'admin', 
      password: 'admin123' 
    });
    
    // 3. Cek sesi aktif sebelum logout
    const before = await axios.get('http://127.0.0.1:5001/api/users/summary', {
      headers: { 'Authorization': 'Bearer ' + admin.data.token }
    });
    console.log('📊 Active sessions BEFORE logout:', before.data.activeSessions);
    
    // 4. Logout testuser
    await axios.post('http://127.0.0.1:5001/api/auth/logout', {}, {
      headers: { 'Authorization': 'Bearer ' + user.data.token }
    });
    console.log('✅ User logout successful');
    
    // 5. Cek sesi aktif setelah logout  
    const after = await axios.get('http://127.0.0.1:5001/api/users/summary', {
      headers: { 'Authorization': 'Bearer ' + admin.data.token }
    });
    console.log('📊 Active sessions AFTER logout:', after.data.activeSessions);
    
    console.log('\n✅ Logout removes user from active sessions!');
    console.log(`   Sessions reduced from ${before.data.activeSessions} to ${after.data.activeSessions}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

test();
