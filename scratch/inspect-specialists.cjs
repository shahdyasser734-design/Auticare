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
    const email = `test-${Math.floor(Math.random() * 1000000)}@example.com`;
    await request('POST', '/auth/register', {
      email,
      password: 'Password123!',
      fullName: 'Test Parent',
      phone: '01012345678',
      role: 'Parent',
      nationalId: '30201012233445'
    });
    
    const loginRes = await request('POST', '/auth/login', {
      email,
      password: 'Password123!'
    });
    const token = loginRes.data?.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    console.log('Fetching doctors (?type=doctor)...');
    const docRes = await request('GET', '/specialists?type=doctor', null, authHeaders);
    const docs = Array.isArray(docRes.data) ? docRes.data : (docRes.data?.data || []);

    console.log('Fetching therapists (?type=therapist)...');
    const thRes = await request('GET', '/specialists?type=therapist', null, authHeaders);
    const ths = Array.isArray(thRes.data) ? thRes.data : (thRes.data?.data || []);

    console.log('\n--- DOCTORS LIST ---');
    docs.forEach(d => console.log(`ID: ${d.specialistId} | Name: ${d.name} | Specialization: ${d.specialization} | Casing keys: ${Object.keys(d).join(', ')}`));

    console.log('\n--- THERAPISTS LIST ---');
    ths.forEach(t => console.log(`ID: ${t.specialistId} | Name: ${t.name} | Specialization: ${t.specialization}`));

  } catch (err) {
    console.error(err);
  }
}

run();
