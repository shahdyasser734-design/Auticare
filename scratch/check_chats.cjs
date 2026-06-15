const axios = require('axios');

const API_BASE = 'https://auticare-production-828c.up.railway.app/api';

async function checkChats() {
  try {
    // Login parent
    console.log('[1] Logging in parent...');
    const parentLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'parent@test.com',
      password: 'Password123!'
    });
    const parentToken = parentLogin.data.token;

    console.log('[2] Fetching /chat/my-chats...');
    const chats = await axios.get(`${API_BASE}/chat/my-chats`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    console.log('Chats:', JSON.stringify(chats.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

checkChats();
