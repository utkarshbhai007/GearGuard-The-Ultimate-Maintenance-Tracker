const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPasswords() {
  try {
    console.log('🔄 Fixing all user passwords...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gearguard'
    });

    // Hash the password correctly
    const hashedPassword = await bcrypt.hash('password123', 12);
    console.log('🔐 Generated new password hash');

    // Update all users with the correct password hash
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email IN (?, ?, ?, ?, ?)',
      [
        hashedPassword,
        'admin@gearguard.com',
        'manager@gearguard.com', 
        'tech@gearguard.com',
        'tech2@gearguard.com',
        'tech3@gearguard.com'
      ]
    );

    console.log(`✅ Updated ${result.affectedRows} user passwords`);

    // Verify the fix
    const [users] = await connection.execute('SELECT email FROM users WHERE password = ?', [hashedPassword]);
    console.log('📋 Users with updated passwords:');
    users.forEach(user => console.log(`- ${user.email}`));

    await connection.end();
    console.log('✅ Password fix completed');
    
  } catch (error) {
    console.error('❌ Password fix failed:', error.message);
  }
}

fixPasswords();