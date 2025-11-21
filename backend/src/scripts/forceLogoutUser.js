const { User } = require('../models');

async function forceLogout() {
  try {
    const username = 'testuser1213';
    
    const result = await User.update(
      { lastLogout: new Date() },
      { where: { username } }
    );
    
    console.log(`✅ User ${username} berhasil di-logout secara paksa`);
    console.log('   Sesi aktif sekarang seharusnya hanya admin');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

forceLogout();
