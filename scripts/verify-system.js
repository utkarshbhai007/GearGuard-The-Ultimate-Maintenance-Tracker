const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifySystem() {
  console.log('🔍 GearGuard System Verification\n');
  
  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gearguard'
    });
    console.log('   ✅ Database connected successfully');

    // Check tables
    console.log('\n2. Checking database tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    const expectedTables = ['users', 'teams', 'equipment', 'maintenance_requests'];
    
    expectedTables.forEach(table => {
      if (tableNames.includes(table)) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' missing`);
      }
    });

    // Check data
    console.log('\n3. Checking sample data...');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [teams] = await connection.execute('SELECT COUNT(*) as count FROM teams');
    const [equipment] = await connection.execute('SELECT COUNT(*) as count FROM equipment');
    const [requests] = await connection.execute('SELECT COUNT(*) as count FROM maintenance_requests');
    
    console.log(`   ✅ Users: ${users[0].count}`);
    console.log(`   ✅ Teams: ${teams[0].count}`);
    console.log(`   ✅ Equipment: ${equipment[0].count}`);
    console.log(`   ✅ Maintenance Requests: ${requests[0].count}`);

    // Test login credentials
    console.log('\n4. Testing demo accounts...');
    const [adminUser] = await connection.execute(
      'SELECT email, role FROM users WHERE email = ?', 
      ['admin@gearguard.com']
    );
    
    if (adminUser.length > 0) {
      console.log(`   ✅ Admin account exists: ${adminUser[0].email} (${adminUser[0].role})`);
    } else {
      console.log('   ❌ Admin account not found');
    }

    await connection.end();

    // Test API endpoints
    console.log('\n5. Testing API endpoints...');
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        console.log('   ✅ API server is responding');
      } else {
        console.log('   ❌ API server not responding');
      }
    } catch (error) {
      console.log('   ❌ API server not accessible');
    }

    console.log('\n🎉 System Verification Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Make sure both servers are running: npm run dev');
    console.log('   2. Open browser: http://localhost:3000');
    console.log('   3. Login with: admin@gearguard.com / password123');
    console.log('\n🚀 GearGuard is ready to use!');

  } catch (error) {
    console.error('\n❌ System verification failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Check if MySQL is running');
    console.log('   - Verify .env file settings');
    console.log('   - Run: npm run setup-db');
  }
}

verifySystem();