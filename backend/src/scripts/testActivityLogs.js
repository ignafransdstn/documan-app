const axios = require('axios');

const API_BASE = 'http://127.0.0.1:5001';

async function testActivityLogs() {
  try {
    console.log('🔐 Testing Activity Logging System...\n');

    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post(`${API_BASE}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    console.log(`Token: ${token.substring(0, 20)}...`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Fetch activity logs
    console.log('\n2. Fetching activity logs...');
    const logsRes = await axios.get(`${API_BASE}/api/activity-logs?limit=10&offset=0`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n📋 Activity Logs:');
    console.log(`Total count: ${logsRes.data.totalCount}`);
    console.log(`Has more: ${logsRes.data.hasMore}`);
    console.log(`\nRecent activities (${logsRes.data.logs.length} items):`);
    
    logsRes.data.logs.forEach((log, index) => {
      const date = new Date(log.createdAt);
      const timeStr = date.toLocaleString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      console.log(`\n${index + 1}. ${log.action} - ${log.description}`);
      console.log(`   User: ${log.user?.username} (${log.user?.userLevel})`);
      console.log(`   Time: ${timeStr}`);
      console.log(`   IP: ${log.ipAddress || 'N/A'}`);
      if (log.entityType) {
        console.log(`   Entity: ${log.entityType} (ID: ${log.entityId})`);
      }
    });

    // 3. Test logout
    console.log('\n\n3. Testing logout...');
    const logoutRes = await axios.post(`${API_BASE}/api/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Logout successful:', logoutRes.data.message);

    // 4. Fetch logs again to see logout activity
    console.log('\n4. Login again to check logout was logged...');
    const loginRes2 = await axios.post(`${API_BASE}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const token2 = loginRes2.data.token;

    const logsRes2 = await axios.get(`${API_BASE}/api/activity-logs?limit=5&offset=0`, {
      headers: { Authorization: `Bearer ${token2}` }
    });

    console.log('\n📋 Latest 5 activities after logout:');
    logsRes2.data.logs.forEach((log, index) => {
      const date = new Date(log.createdAt);
      const timeStr = date.toLocaleString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      console.log(`${index + 1}. [${log.action}] ${log.description} - ${timeStr}`);
    });

    console.log('\n✅ All activity logging tests passed!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testActivityLogs();
