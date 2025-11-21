const { sequelize, User } = require('./src/models');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('=== Activation Toggle Test ===\n');
    
    const test2 = await User.findOne({ where: { username: 'test2' } });
    const passwordHashBefore = test2.password;
    
    console.log('INITIAL STATE:');
    console.log('  isActive:', test2.isActive);
    console.log('  password hash:', passwordHashBefore.substring(0, 30) + '...');
    
    // Test password
    const testPassword = 'Test@1234';
    const match1 = await bcrypt.compare(testPassword, passwordHashBefore);
    console.log(`  Password '${testPassword}' matches:`, match1 ? '✅' : '❌');
    
    // Toggle 1: Deactivate
    console.log('\n--- Toggle 1: DEACTIVATE ---');
    test2.isActive = false;
    await test2.save();
    await test2.reload();
    console.log('  isActive:', test2.isActive);
    console.log('  password changed?', test2.password !== passwordHashBefore ? '❌ YES (BUG!)' : '✅ NO');
    
    // Toggle 2: Activate
    console.log('\n--- Toggle 2: ACTIVATE ---');
    test2.isActive = true;
    await test2.save();
    await test2.reload();
    console.log('  isActive:', test2.isActive);
    console.log('  password changed?', test2.password !== passwordHashBefore ? '❌ YES (BUG!)' : '✅ NO');
    
    // Final password test
    const match2 = await bcrypt.compare(testPassword, test2.password);
    console.log(`\nFINAL: Password '${testPassword}' matches:`, match2 ? '✅' : '❌');
    
    await sequelize.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
