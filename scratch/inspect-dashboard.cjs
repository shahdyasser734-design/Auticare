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
    const docEmail = `doctor-dash-${Math.floor(Math.random() * 1000000)}@example.com`;
    console.log('Registering doctor...');
    const regRes = await request('POST', '/auth/register', {
      email: docEmail,
      password: 'Password123!',
      fullName: 'Dash Doctor',
      phone: '01012345678',
      role: 'Doctor'
    });
    const token = regRes.data?.token;
    if (!token) return;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    console.log('Getting specialist dashboard...');
    const getDashRes = await request('GET', '/dashboard/specialist', null, authHeaders);
    console.log('GET /dashboard/specialist Response:', getDashRes.statusCode, JSON.stringify(getDashRes.data, null, 2));

  } catch (err) {
    console.error('Inspect failed:', err);
  }
}

run();
