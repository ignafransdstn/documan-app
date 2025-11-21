const { sequelize, User } = require('./src/models');

(async () => {
  try {
    const test2 = await User.findOne({ where: { username: 'test2' } });
    console.log('test2 isActive:', test2.isActive);
    
    if (!test2.isActive) {
      await test2.update({ isActive: true });
      console.log('✅ Re-activated test2');
    } else {
      console.log('Already active');
    }
    
    await sequelize.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
