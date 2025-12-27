const axios = require('axios');

async function testAuth() {
  try {
    console.log('🔍 Testing authentication flow...');
    
    // Test 1: Login
    console.log('\n1. Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@gearguard.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('User:', loginResponse.data.user.name);
    
    const token = loginResponse.data.token;
    
    // Test 2: Verify token
    console.log('\n2. Testing token verification...');
    const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Token verification successful!');
    console.log('Valid:', verifyResponse.data.valid);
    
    // Test 3: Get dashboard data
    console.log('\n3. Testing dashboard API...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/overview', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Dashboard API successful!');
    console.log('Total Equipment:', dashboardResponse.data.overview.totalEquipment);
    console.log('Total Requests:', dashboardResponse.data.overview.totalRequests);
    
    // Test 4: Get equipment
    console.log('\n4. Testing equipment API...');
    const equipmentResponse = await axios.get('http://localhost:5000/api/equipment', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Equipment API successful!');
    console.log('Equipment count:', equipmentResponse.data.equipment.length);
    
    console.log('\n🎉 All API tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuth();