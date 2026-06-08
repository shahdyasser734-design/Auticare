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
    const docEmail = 'testdoc_1780884576432@example.com';
    const childId = 292; // Emma Johnson from our confirmed booking

    console.log('[1] Logging in doctor...');
    const docLogin = await request('POST', '/auth/login', {
      email: docEmail,
      password: 'Password123!'
    });
    const docToken = docLogin.data.token;
    const docHeaders = { 'Authorization': `Bearer ${docToken}` };

    console.log(`[2] Querying GET /api/children/${childId} as Doctor...`);
    const childRes = await request('GET', `/children/${childId}`, null, docHeaders);
    console.log('GET child response:', childRes.statusCode, childRes.data);

    console.log(`[3] Querying GET /api/children as Doctor...`);
    const allChildrenRes = await request('GET', '/children', null, docHeaders);
    console.log('GET all children response:', allChildrenRes.statusCode, allChildrenRes.data);

  } catch (err) {
    console.error(err);
  }
}

run();
