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
    // 1. Register a temporary doctor
    const email = `doc-${Math.floor(Math.random() * 1000000)}@example.com`;
    const reg = await request('POST', '/auth/register', {
      email,
      password: 'Password123!',
      fullName: 'Test Doctor',
      phone: '01012345678',
      role: 'Doctor'
    });
    const token = reg.data.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // 2. Fetch plans
    console.log('Fetching plans...');
    const plansRes = await request('GET', '/treatment-plans/my-plans', null, authHeaders);
    console.log('Plans status:', plansRes.statusCode);
    console.log('Plans data:', JSON.stringify(plansRes.data, null, 2));

    // If plans exist, query sessions for the first plan
    if (Array.isArray(plansRes.data) && plansRes.data.length > 0) {
      const planId = plansRes.data[0].treatmentId || plansRes.data[0].id;
      console.log(`Fetching sessions for plan ${planId}...`);
      const sessionsRes = await request('GET', `/sessions/treatment/${planId}`, null, authHeaders);
      console.log('Sessions status:', sessionsRes.statusCode);
      console.log('Sessions data:', JSON.stringify(sessionsRes.data, null, 2));
    } else {
      console.log('No plans found.');
    }
  } catch (err) {
    console.error(err);
  }
}

run();
