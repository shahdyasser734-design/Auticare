const https = require('https');

const API_BASE = 'https://auticare-production-828c.up.railway.app/api';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const urlObj = new URL(url);
    const options = {
      method,
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    const email = `doctor-profile-${Math.floor(Math.random() * 1000000)}@example.com`;
    console.log('Registering doctor...');
    const regRes = await request('POST', '/auth/register', {
      email,
      password: 'Password123!',
      fullName: 'Inspect Doctor Profile',
      phone: '01012345678',
      role: 'Doctor'
    });
    console.log('Register Response:', regRes.statusCode, regRes.data);

    const token = regRes.data?.token;
    if (!token) return;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    console.log('Trying GET /profile...');
    const getProfileRes = await request('GET', '/profile', null, authHeaders);
    console.log('GET /profile Response:', getProfileRes.statusCode, JSON.stringify(getProfileRes.data, null, 2));

  } catch (err) {
    console.error('Inspect failed:', err);
  }
}

run();
