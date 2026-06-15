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
    console.log('[1] Logging in doctor...');
    const docLogin = await request('POST', '/auth/login', {
      email: docEmail,
      password: 'Password123!'
    });
    const docToken = docLogin.data.token;
    const docHeaders = { 'Authorization': `Bearer ${docToken}` };

    console.log('[2] Fetching specialist 80...');
    const res = await request('GET', '/specialists/80', null, docHeaders);
    console.log('Specialist response:', res.statusCode, JSON.stringify(res.data, null, 2));

  } catch (err) {
    console.error(err);
  }
}

run();
