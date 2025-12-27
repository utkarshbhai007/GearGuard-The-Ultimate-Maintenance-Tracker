const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkUsers() {
  try {
    console.log('🔄 Checking database users...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gearguard'
    });

    // Check if users exist
    const [users] = await connection.execute('SELECT id, email, password FROM users LIMIT 5');
    
    console.log('📋 Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}`);
      console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
    });

    // Test password verification
    const adminUser = users.find(u => u.email === 'admin@gearguard.com');
    if (adminUser) {
      console.log('\n🔐 Testing password verification...');
      const isValid = await bcrypt.compare('password123', adminUser.password);
      console.log(`Password 'password123' is ${isValid ? 'VALID' : 'INVALID'} for admin user`);
      
      if (!isValid) {
        console.log('🔧 Fixing password hash...');
        const newHash = await bcrypt.hash('password123', 12);
        await connection.execute('UPDATE users SET password = ? WHERE email = ?', [newHash, 'admin@gearguard.com']);
        console.log('✅ Password hash updated for admin user');
      }
    }

    await connection.end();
    console.log('✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

checkUsers();