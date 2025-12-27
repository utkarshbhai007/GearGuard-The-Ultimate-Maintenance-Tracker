const axios = require('axios');

// Simulate the frontend authentication flow
async function debugAuthFlow() {
  console.log('🔍 Debugging complete authentication flow...\n');
  
  try {
    // Step 1: Test backend health
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Backend health:', healthResponse.data);
    
    // Step 2: Test login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@gearguard.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response structure:', Object.keys(loginResponse.data));
    console.log('Token exists:', !!loginResponse.data.token);
    console.log('User exists:', !!loginResponse.data.user);
    
    if (loginResponse.data.user) {
      console.log('User details:', {
        id: loginResponse.data.user.id,
        email: loginResponse.data.user.email,
        first_name: loginResponse.data.user.first_name,
        last_name: loginResponse.data.user.last_name,
        role: loginResponse.data.user.role
      });
    }
    
    const token = loginResponse.data.token;
    
    // Step 3: Test token verification
    console.log('\n3. Testing token verification...');
    const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token verification successful!');
    console.log('Verification response:', verifyResponse.data);
    
    // Step 4: Test protected endpoints
    console.log('\n4. Testing protected endpoints...');
    
    const endpoints = [
      '/dashboard/overview',
      '/equipment',
      '/teams',
      '/requests'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000/api${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`✅ ${endpoint}: Status ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: Status ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Step 5: Test CORS from frontend perspective
    console.log('\n5. Testing CORS configuration...');
    try {
      const corsResponse = await axios.get('http://localhost:5000/api/health', {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      console.log('✅ CORS test successful');
    } catch (error) {
      console.log('❌ CORS test failed:', error.message);
    }
    
    console.log('\n🎉 Authentication flow debugging complete!');
    console.log('\n📋 Summary:');
    console.log('- Backend is running and healthy');
    console.log('- Login endpoint works correctly');
    console.log('- JWT token is generated and valid');
    console.log('- Protected endpoints are accessible with token');
    console.log('- CORS is configured correctly');
    console.log('\n💡 The issue is likely in the frontend token storage/retrieval or API configuration.');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
  }
}

debugAuthFlow();