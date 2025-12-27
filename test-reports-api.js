const axios = require('axios');

async function testReportsAPI() {
  console.log('🔍 Testing Reports API endpoints...\n');
  
  try {
    // First, login to get a token
    console.log('1. Getting authentication token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@gearguard.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtained successfully');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test each reports endpoint
    const endpoints = [
      '/dashboard/team-performance?date_range=30',
      '/dashboard/equipment-utilization?date_range=30',
      '/dashboard/cost-analysis?date_range=30'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n2. Testing ${endpoint}...`);
        const response = await axios.get(`http://localhost:5000/api${endpoint}`, { headers });
        
        console.log(`✅ ${endpoint}: Status ${response.status}`);
        console.log(`   Response keys:`, Object.keys(response.data));
        
        // Show sample data structure
        if (endpoint.includes('team-performance')) {
          console.log(`   Team performance data:`, response.data.teamPerformance?.length || 0, 'teams');
          if (response.data.teamPerformance?.length > 0) {
            console.log(`   Sample team:`, {
              name: response.data.teamPerformance[0].name,
              totalRequests: response.data.teamPerformance[0].totalRequests,
              completionRate: response.data.teamPerformance[0].completionRate
            });
          }
        }
        
        if (endpoint.includes('equipment-utilization')) {
          console.log(`   Equipment utilization data:`, response.data.equipmentUtilization?.length || 0, 'equipment');
          if (response.data.equipmentUtilization?.length > 0) {
            console.log(`   Sample equipment:`, {
              name: response.data.equipmentUtilization[0].name,
              totalRequests: response.data.equipmentUtilization[0].totalRequests,
              reliability: response.data.equipmentUtilization[0].reliability
            });
          }
        }
        
        if (endpoint.includes('cost-analysis')) {
          console.log(`   Cost analysis data:`, {
            totalCost: response.data.totalCost,
            costByType: Object.keys(response.data.costByType || {}),
            costByCategory: response.data.costByCategory?.length || 0,
            monthlyCosts: response.data.monthlyCosts?.length || 0
          });
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint}: Status ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
          console.log(`   Error details:`, error.response.data);
        }
      }
    }
    
    console.log('\n🎉 Reports API testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testReportsAPI();