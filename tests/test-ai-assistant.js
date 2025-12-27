const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:5000/api';

// Test AI Assistant API
async function testAIAssistant() {
  console.log('🤖 Testing AI Assistant API...\n');

  try {
    // First, login to get a token
    console.log('1. Logging in to get authentication token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@gearguard.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test AI chat endpoint
    console.log('\n2. Testing AI chat endpoint...');
    const chatResponse = await axios.post(
      `${API_BASE_URL}/ai-assistant/chat`,
      {
        message: 'Hello, can you help me with equipment maintenance?',
        context: 'Testing the AI assistant functionality'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ AI Chat Response:');
    console.log('Response:', chatResponse.data.response);
    console.log('Timestamp:', chatResponse.data.timestamp);

    // Test AI suggestions endpoint
    console.log('\n3. Testing AI suggestions endpoint...');
    const suggestionsResponse = await axios.post(
      `${API_BASE_URL}/ai-assistant/suggestions`,
      {
        equipmentType: 'CNC Machine',
        issue: 'Strange noise during operation',
        urgency: 'High'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ AI Suggestions Response:');
    console.log('Suggestions:', suggestionsResponse.data.suggestions);
    console.log('Timestamp:', suggestionsResponse.data.timestamp);

    console.log('\n🎉 All AI Assistant tests passed!');

  } catch (error) {
    console.error('❌ AI Assistant test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testAIAssistant();