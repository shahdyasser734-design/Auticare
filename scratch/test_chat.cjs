const axios = require('axios');

async function testChat() {
  const api = axios.create({ baseURL: 'http://localhost:5000/api' });

  // 1. Login
  const loginRes = await api.post('/auth/login', {
    email: 'sssh020aahhdddd@example.com',
    password: 'Shahd123'
  });
  
  const token = loginRes.data.token || loginRes.data.data?.token || loginRes.data.accessToken;
  const userId = loginRes.data.user?.id || loginRes.data.data?.user?.id;
  console.log('Logged in as Parent:', userId);
  
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // 2. Get my chats
  try {
    const chatsRes = await api.get('/chat/my-chats');
    console.log('My Chats:', JSON.stringify(chatsRes.data, null, 2));
    
    // 3. Try to start a chat or get care team
    const bookingsRes = await api.get('/bookings/my-bookings');
    console.log('My Bookings:', bookingsRes.data.length);
    if (bookingsRes.data.length > 0) {
      console.log('First booking specialist:', bookingsRes.data[0].specialistName, bookingsRes.data[0].specialistId);
    }
  } catch (e) {
    console.error('API Error:', e.response?.data || e.message);
  }
}

testChat();
