const axios = require('axios');

async function test() {
  const email = 'parent@example.com';
  const password = 'Password123';
  const baseURL = 'https://auticare-production-828c.up.railway.app/api';

  try {
    console.log('Logging in...');
    const loginRes = await axios.post(`${baseURL}/auth/login`, { email, password });
    const token = loginRes.data.token;
    console.log('Logged in successfully. Token:', token);

    const headers = { Authorization: `Bearer ${token}` };

    const candidates = [
      { method: 'delete', url: '/profile' },
      { method: 'delete', url: '/profile/delete' },
      { method: 'delete', url: '/auth/delete' },
      { method: 'delete', url: '/users/delete' },
      { method: 'post', url: '/profile/delete' },
      { method: 'post', url: '/auth/delete' },
      { method: 'delete', url: '/auth/delete-account' },
      { method: 'post', url: '/auth/delete-account' },
    ];

    for (const c of candidates) {
      try {
        console.log(`Trying ${c.method.toUpperCase()} ${c.url}...`);
        const res = await axios({
          method: c.method,
          url: `${baseURL}${c.url}`,
          headers
        });
        console.log(`SUCCESS: ${c.method.toUpperCase()} ${c.url} -> Status: ${res.status}`);
      } catch (err) {
        console.log(`FAILED: ${c.method.toUpperCase()} ${c.url} -> Status: ${err.response?.status || err.message}`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
