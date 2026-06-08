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

async function tryLogin(email, password) {
  console.log(`Trying ${email} with ${password}...`);
  const res = await request('POST', '/auth/login', { email, password });
  console.log('Status:', res.statusCode, res.data);
  return res.data;
}

async function run() {
  const emails = [
    'omar.ahmed@auticare.com',
    'ahmed.ali@auticare.com',
    'sara.mohamed@auticare.com'
  ];
  const passwords = [
    'Password123!',
    'password',
    'password123',
    '12345678',
    'Omar123!'
  ];

  for (const email of emails) {
    for (const password of passwords) {
      const data = await tryLogin(email, password);
      if (data && data.token) {
        console.log(`🎉 SUCCESS! Email: ${email}, Password: ${password}`);
        
        console.log('Fetching bookings...');
        const bRes = await request('GET', '/bookings/my-bookings', null, { Authorization: `Bearer ${data.token}` });
        console.log('Bookings:', JSON.stringify(bRes.data, null, 2));

        console.log('Fetching dashboard...');
        const dRes = await request('GET', '/dashboard/specialist', null, { Authorization: `Bearer ${data.token}` });
        console.log('Dashboard:', JSON.stringify(dRes.data, null, 2));

        return;
      }
    }
  }
}

run().catch(console.error);
