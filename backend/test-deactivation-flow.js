const { sequelize, User } = require('./src/models');
const bcrypt = require('bcryptjs');
const http = require('http');

const TEST_PASSWORD = 'Test@1234';

async function httpRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const options = {
      hostname: '127.0.0.1',  // Use IPv4 explicitly
      port: 5001,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function loginUser(username, password) {
  try {
    const response = await httpRequest('POST', '/auth/login', { username, password });
    if (response.status === 200) {
      return { success: true, token: response.data.token, data: response.data };
    } else {
      return { success: false, status: response.status, message: response.data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

async function toggleUserActive(userId, active, adminToken) {
  try {
    const response = await httpRequest('PATCH', `/users/${userId}/activation`, { active }, adminToken);
    if (response.status === 200) {
      return { success: true, data: response.data };
    } else {
      return { success: false, status: response.status, message: response.data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

(async () => {
  try {
    console.log('=== DEACTIVATION FLOW TEST ===\n');
    
    // Step 1: Create or find test users
    console.log('Step 1: Creating test users...');
    
    let testUser1 = await User.findOne({ where: { username: 'testlevel1' } });
    if (!testUser1) {
      testUser1 = await User.create({
        username: 'testlevel1',
        email: 'testlevel1@test.com',
        password: TEST_PASSWORD,
        userLevel: 'level1',
        name: 'Test Level 1',
        isApproved: true,
        isActive: true
      });
      console.log('  ✅ Created testlevel1 (level1)');
    } else {
      await testUser1.update({ password: TEST_PASSWORD, isActive: true });
      console.log('  ✅ Updated testlevel1 (level1)');
    }
    
    let testUser2 = await User.findOne({ where: { username: 'testlevel2' } });
    if (!testUser2) {
      testUser2 = await User.create({
        username: 'testlevel2',
        email: 'testlevel2@test.com',
        password: TEST_PASSWORD,
        userLevel: 'level2',
        name: 'Test Level 2',
        isApproved: true,
        isActive: true
      });
      console.log('  ✅ Created testlevel2 (level2)');
    } else {
      await testUser2.update({ password: TEST_PASSWORD, isActive: true });
      console.log('  ✅ Updated testlevel2 (level2)');
    }
    
    console.log(`\n  User IDs: testlevel1=${testUser1.id}, testlevel2=${testUser2.id}\n`);
    
    // Step 2: Get admin token
    console.log('Step 2: Logging in as admin...');
    const adminLogin = await loginUser('admin', 'Admin@123');
    if (!adminLogin.success) {
      console.log('  ❌ Admin login failed:', adminLogin.message);
      process.exit(1);
    }
    console.log('  ✅ Admin logged in successfully\n');
    const adminToken = adminLogin.token;
    
    // Step 3: Test initial login for both users
    console.log('Step 3: Testing initial login for test users...');
    
    const user1Login1 = await loginUser('testlevel1', TEST_PASSWORD);
    console.log(`  testlevel1 login: ${user1Login1.success ? '✅ SUCCESS' : '❌ FAILED - ' + user1Login1.message}`);
    
    const user2Login1 = await loginUser('testlevel2', TEST_PASSWORD);
    console.log(`  testlevel2 login: ${user2Login1.success ? '✅ SUCCESS' : '❌ FAILED - ' + user2Login1.message}`);
    
    if (!user1Login1.success || !user2Login1.success) {
      console.log('\n❌ Initial login failed, stopping test');
      process.exit(1);
    }
    
    // Step 4: Deactivate testlevel1
    console.log('\nStep 4: Deactivating testlevel1...');
    const deactivate1 = await toggleUserActive(testUser1.id, false, adminToken);
    if (!deactivate1.success) {
      console.log('  ❌ Failed to deactivate:', deactivate1.message);
    } else {
      console.log(`  ✅ Deactivated - isActive: ${deactivate1.data.isActive}`);
    }
    
    // Step 5: Try to login as deactivated user
    console.log('\nStep 5: Attempting login as deactivated testlevel1...');
    const user1Login2 = await loginUser('testlevel1', TEST_PASSWORD);
    if (user1Login2.success) {
      console.log('  ❌ FAILED - User should not be able to login!');
    } else {
      console.log(`  ✅ Login blocked - Status: ${user1Login2.status}, Message: "${user1Login2.message}"`);
    }
    
    // Step 6: Deactivate testlevel2
    console.log('\nStep 6: Deactivating testlevel2...');
    const deactivate2 = await toggleUserActive(testUser2.id, false, adminToken);
    if (!deactivate2.success) {
      console.log('  ❌ Failed to deactivate:', deactivate2.message);
    } else {
      console.log(`  ✅ Deactivated - isActive: ${deactivate2.data.isActive}`);
    }
    
    // Step 7: Try to login as deactivated testlevel2
    console.log('\nStep 7: Attempting login as deactivated testlevel2...');
    const user2Login2 = await loginUser('testlevel2', TEST_PASSWORD);
    if (user2Login2.success) {
      console.log('  ❌ FAILED - User should not be able to login!');
    } else {
      console.log(`  ✅ Login blocked - Status: ${user2Login2.status}, Message: "${user2Login2.message}"`);
    }
    
    // Step 8: Reactivate testlevel1
    console.log('\nStep 8: Reactivating testlevel1...');
    const activate1 = await toggleUserActive(testUser1.id, true, adminToken);
    if (!activate1.success) {
      console.log('  ❌ Failed to activate:', activate1.message);
    } else {
      console.log(`  ✅ Activated - isActive: ${activate1.data.isActive}`);
    }
    
    // Step 9: Try to login as reactivated testlevel1
    console.log('\nStep 9: Attempting login as reactivated testlevel1...');
    const user1Login3 = await loginUser('testlevel1', TEST_PASSWORD);
    if (!user1Login3.success) {
      console.log(`  ❌ FAILED - User should be able to login! Message: ${user1Login3.message}`);
    } else {
      console.log('  ✅ Login successful');
    }
    
    // Step 10: Reactivate testlevel2
    console.log('\nStep 10: Reactivating testlevel2...');
    const activate2 = await toggleUserActive(testUser2.id, true, adminToken);
    if (!activate2.success) {
      console.log('  ❌ Failed to activate:', activate2.message);
    } else {
      console.log(`  ✅ Activated - isActive: ${activate2.data.isActive}`);
    }
    
    // Step 11: Try to login as reactivated testlevel2
    console.log('\nStep 11: Attempting login as reactivated testlevel2...');
    const user2Login3 = await loginUser('testlevel2', TEST_PASSWORD);
    if (!user2Login3.success) {
      console.log(`  ❌ FAILED - User should be able to login! Message: ${user2Login3.message}`);
    } else {
      console.log('  ✅ Login successful');
    }
    
    // Final summary
    console.log('\n=== TEST SUMMARY ===');
    const allPassed = 
      user1Login1.success && 
      user2Login1.success && 
      !user1Login2.success && 
      !user2Login2.success && 
      user1Login3.success && 
      user2Login3.success;
    
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED');
      console.log('\nDeactivation flow working correctly:');
      console.log('  - Users can login when active');
      console.log('  - Users CANNOT login when deactivated');
      console.log('  - Users can login again after reactivation');
      console.log('  - Password remains unchanged through toggles');
    } else {
      console.log('❌ SOME TESTS FAILED - Review output above');
    }
    
    await sequelize.close();
    process.exit(allPassed ? 0 : 1);
    
  } catch (err) {
    console.error('Error:', err);
    await sequelize.close();
    process.exit(1);
  }
})();
