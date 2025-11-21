const { sequelize, User } = require('./src/models');
const http = require('http');

const TEST_PASSWORD = 'Test@1234';

async function httpRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const options = {
      hostname: '127.0.0.1',
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
    console.log('=== LEVEL 3 USER DEACTIVATION TEST ===\n');
    
    // Step 1: Create or update test user
    console.log('Step 1: Creating test user level3...');
    
    let testUser3 = await User.findOne({ where: { username: 'testlevel3' } });
    if (!testUser3) {
      testUser3 = await User.create({
        username: 'testlevel3',
        email: 'testlevel3@test.com',
        password: TEST_PASSWORD,
        userLevel: 'level3',
        name: 'Test Level 3',
        isApproved: true,
        isActive: true
      });
      console.log('  ✅ Created testlevel3 (level3)');
    } else {
      await testUser3.update({ password: TEST_PASSWORD, isActive: true });
      console.log('  ✅ Updated testlevel3 (level3)');
    }
    
    console.log(`  User ID: ${testUser3.id}\n`);
    
    // Small delay to ensure DB is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 2: Get admin token
    console.log('Step 2: Logging in as admin...');
    const adminLogin = await loginUser('admin', 'Admin@123');
    if (!adminLogin.success) {
      console.log('  ❌ Admin login failed:', adminLogin.message);
      process.exit(1);
    }
    console.log('  ✅ Admin logged in successfully\n');
    const adminToken = adminLogin.token;
    
    // Step 3: Test initial login
    console.log('Step 3: Testing initial login for testlevel3...');
    const user3Login1 = await loginUser('testlevel3', TEST_PASSWORD);
    console.log(`  testlevel3 login: ${user3Login1.success ? '✅ SUCCESS' : '❌ FAILED - ' + user3Login1.message}`);
    
    if (!user3Login1.success) {
      console.log('\n❌ Initial login failed, stopping test');
      process.exit(1);
    }
    
    // Step 4: Deactivate testlevel3
    console.log('\nStep 4: Deactivating testlevel3...');
    const deactivate = await toggleUserActive(testUser3.id, false, adminToken);
    if (!deactivate.success) {
      console.log('  ❌ Failed to deactivate:', deactivate.message);
    } else {
      console.log(`  ✅ Deactivated - isActive: ${deactivate.data.isActive}`);
    }
    
    // Step 5: Verify database state
    console.log('\nStep 5: Verifying database state...');
    await testUser3.reload();
    console.log(`  Database isActive: ${testUser3.isActive}`);
    
    // Step 6: Try to login as deactivated user
    console.log('\nStep 6: Attempting login as deactivated testlevel3...');
    const user3Login2 = await loginUser('testlevel3', TEST_PASSWORD);
    if (user3Login2.success) {
      console.log('  ❌ FAILED - User should not be able to login!');
    } else {
      console.log(`  ✅ Login blocked - Status: ${user3Login2.status}, Message: "${user3Login2.message}"`);
    }
    
    // Step 7: Reactivate testlevel3
    console.log('\nStep 7: Reactivating testlevel3...');
    const activate = await toggleUserActive(testUser3.id, true, adminToken);
    if (!activate.success) {
      console.log('  ❌ Failed to activate:', activate.message);
    } else {
      console.log(`  ✅ Activated - isActive: ${activate.data.isActive}`);
    }
    
    // Step 8: Verify database state after activation
    console.log('\nStep 8: Verifying database state after reactivation...');
    await testUser3.reload();
    console.log(`  Database isActive: ${testUser3.isActive}`);
    
    // Step 9: Try to login as reactivated user
    console.log('\nStep 9: Attempting login as reactivated testlevel3...');
    const user3Login3 = await loginUser('testlevel3', TEST_PASSWORD);
    if (!user3Login3.success) {
      console.log(`  ❌ FAILED - User should be able to login! Message: ${user3Login3.message}`);
    } else {
      console.log('  ✅ Login successful');
    }
    
    // Final summary
    console.log('\n=== TEST SUMMARY ===');
    const allPassed = 
      user3Login1.success && 
      !user3Login2.success && 
      user3Login3.success;
    
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED FOR LEVEL 3 USER');
      console.log('\nLevel 3 deactivation flow working correctly:');
      console.log('  - User can login when active');
      console.log('  - User CANNOT login when deactivated (403: Account is deactivated)');
      console.log('  - User can login again after reactivation');
      console.log('  - Password remains unchanged through toggles');
      console.log('\nTest credentials:');
      console.log(`  Username: testlevel3`);
      console.log(`  Password: ${TEST_PASSWORD}`);
      console.log(`  Level: level3`);
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
