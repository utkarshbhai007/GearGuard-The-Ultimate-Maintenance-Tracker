const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔄 Testing login API...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@gearguard.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔍 This suggests the password is incorrect or user not found');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔍 Server is not running on port 5000');
    }
  }
}

testLogin();