const axios = require('axios');

async function checkSystemStatus() {
  console.log('🔍 GearGuard System Status Check\n');
  
  const results = {
    backend: false,
    frontend: false,
    database: false,
    auth: false,
    apis: false
  };
  
  try {
    // Check Backend Server
    console.log('1. Checking Backend Server (Port 5000)...');
    const backendHealth = await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
    results.backend = backendHealth.status === 200;
    console.log(`   ✅ Backend: ${results.backend ? 'RUNNING' : 'DOWN'}`);
  } catch (error) {
    console.log('   ❌ Backend: DOWN');
  }
  
  try {
    // Check Frontend Server
    console.log('\n2. Checking Frontend Server (Port 3000)...');
    const frontendHealth = await axios.get('http://localhost:3000', { timeout: 5000 });
    results.frontend = frontendHealth.status === 200;
    console.log(`   ✅ Frontend: ${results.frontend ? 'RUNNING' : 'DOWN'}`);
  } catch (error) {
    console.log('   ❌ Frontend: DOWN');
  }
  
  if (results.backend) {
    try {
      // Check Database Connection (via a protected endpoint with auth)
      console.log('\n3. Checking Database Connection...');
      const authTest = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@gearguard.com',
        password: 'password123'
      }, { timeout: 5000 });
      
      if (authTest.status === 200 && authTest.data.token) {
        const dbTest = await axios.get('http://localhost:5000/api/equipment', {
          headers: { 'Authorization': `Bearer ${authTest.data.token}` },
          timeout: 5000
        });
        results.database = dbTest.status === 200;
        console.log(`   ✅ Database: ${results.database ? 'CONNECTED' : 'DISCONNECTED'}`);
      }
    } catch (error) {
      console.log('   ❌ Database: DISCONNECTED');
    }
    
    try {
      // Check Authentication
      console.log('\n4. Checking Authentication System...');
      const authTest = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@gearguard.com',
        password: 'password123'
      }, { timeout: 5000 });
      results.auth = authTest.status === 200 && authTest.data.token;
      console.log(`   ✅ Authentication: ${results.auth ? 'WORKING' : 'FAILED'}`);
      
      if (results.auth) {
        // Check Protected APIs
        console.log('\n5. Checking Protected APIs...');
        const token = authTest.data.token;
        const apiTests = [
          '/dashboard/overview',
          '/equipment',
          '/teams',
          '/requests'
        ];
        
        let apiSuccess = 0;
        for (const endpoint of apiTests) {
          try {
            const response = await axios.get(`http://localhost:5000/api${endpoint}`, {
              headers: { 'Authorization': `Bearer ${token}` },
              timeout: 5000
            });
            if (response.status === 200) apiSuccess++;
            console.log(`   ✅ ${endpoint}: WORKING`);
          } catch (error) {
            console.log(`   ❌ ${endpoint}: FAILED`);
          }
        }
        results.apis = apiSuccess === apiTests.length;
      }
    } catch (error) {
      console.log('   ❌ Authentication: FAILED');
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SYSTEM STATUS SUMMARY');
  console.log('='.repeat(50));
  console.log(`🖥️  Backend Server:     ${results.backend ? '✅ RUNNING' : '❌ DOWN'}`);
  console.log(`🌐 Frontend Server:    ${results.frontend ? '✅ RUNNING' : '❌ DOWN'}`);
  console.log(`🗄️  Database:          ${results.database ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
  console.log(`🔐 Authentication:     ${results.auth ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`🔌 Protected APIs:     ${results.apis ? '✅ ALL WORKING' : '❌ SOME FAILED'}`);
  
  const allWorking = Object.values(results).every(status => status);
  console.log('\n' + '='.repeat(50));
  if (allWorking) {
    console.log('🎉 SYSTEM STATUS: ALL SYSTEMS OPERATIONAL!');
    console.log('🚀 Ready for demo and testing!');
    console.log('\n📱 Access your application at: http://localhost:3000');
    console.log('🔑 Demo credentials: admin@gearguard.com / password123');
  } else {
    console.log('⚠️  SYSTEM STATUS: SOME ISSUES DETECTED');
    console.log('🔧 Please check the failed components above');
  }
  console.log('='.repeat(50));
}

checkSystemStatus().catch(console.error);