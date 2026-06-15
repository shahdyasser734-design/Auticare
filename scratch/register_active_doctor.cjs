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
  const timestamp = Date.now();
  const email = `doc_${timestamp}@example.com`;
  const name = `Dr. Active Test ${timestamp}`;

  console.log('[1] Registering doctor...');
  const reg = await request('POST', '/auth/register', {
    email,
    password: 'Password123!',
    fullName: name,
    phone: '01011112222',
    role: 'Doctor'
  });
  console.log('Register response:', reg.statusCode, reg.data);
  const token = reg.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  console.log('[2] Updating profile...');
  const profileRes = await request('PUT', '/profile/update', {
    name,
    phone: '01011112222',
    specialization: 'Pediatric Neurologist',
    yearsOfExperience: 12,
    bio: 'Clinical specialist.'
  }, headers);
  console.log('Profile update response:', profileRes.statusCode, profileRes.data);

  console.log('[3] Updating license...');
  const licenseRes = await request('PUT', '/profile/license', 'http://example.com/license.pdf', headers);
  console.log('License update response:', licenseRes.statusCode, licenseRes.data);

  console.log('[4] Querying specialists...');
  const specRes = await request('GET', '/specialists', null, headers);
  const list = Array.isArray(specRes.data) ? specRes.data : specRes.data?.data || [];
  console.log('Specialists list count:', list.length);
  const found = list.find(s => s.name === name || s.email === email);
  console.log('Found our doctor in specialists:', found);
}

run().catch(console.error);
