const { User } = require('../models');
const { Op } = require('sequelize');

async function check() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    console.log('🔍 Cek Semua User yang Login dalam 1 Jam Terakhir\n');
    console.log('Waktu sekarang:', new Date().toLocaleString('id-ID'));
    console.log('Batas waktu (1 jam lalu):', oneHourAgo.toLocaleString('id-ID'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'userLevel', 'lastLogin', 'lastLogout'],
      where: {
        lastLogin: { [Op.gte]: oneHourAgo }
      },
      order: [['lastLogin', 'DESC']]
    });
    
    console.log('Total users yang pernah login dalam 1 jam:', allUsers.length, '\n');
    
    let activeCount = 0;
    allUsers.forEach(u => {
      const isActive = !u.lastLogout || (u.lastLogout < u.lastLogin);
      const status = isActive ? '🟢 ACTIVE' : '🔴 LOGGED OUT';
      
      if (isActive) activeCount++;
      
      console.log(status, u.username, '(' + u.userLevel + ')');
      console.log('  ID:', u.id);
      console.log('  Last Login: ', u.lastLogin ? u.lastLogin.toLocaleString('id-ID') : 'Never');
      console.log('  Last Logout:', u.lastLogout ? u.lastLogout.toLocaleString('id-ID') : 'Never');
      
      if (u.lastLogout && u.lastLogin) {
        const diff = u.lastLogout - u.lastLogin;
        if (diff > 0) {
          console.log('  ⚠️  Logout SETELAH login → User sudah LOGOUT');
        } else {
          console.log('  ✅ Logout SEBELUM login → User masih LOGIN');
        }
      } else if (!u.lastLogout) {
        console.log('  ✅ Belum pernah logout → User masih LOGIN');
      }
      console.log('');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TOTAL ACTIVE SESSIONS:', activeCount);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Rekomendasi
    if (activeCount > 1) {
      console.log('\n💡 Saran:');
      console.log('   Jika hanya admin yang seharusnya login saat ini,');
      console.log('   user lain mungkin lupa logout atau browser masih terbuka.');
      console.log('   User akan otomatis logout setelah 1 jam tidak aktif.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
