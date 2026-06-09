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
    const docLogin = await request('POST', '/auth/login', {
      email: 'doctor@example.com',
      password: 'Password123'
    });
    console.log('Login Response:', JSON.stringify(docLogin.data, null, 2));
    
    // Also try to login using testdoc
    const docLogin2 = await request('POST', '/auth/login', {
      email: 'testdoc_1780884576432@example.com',
      password: 'Password123!'
    });
    console.log('Login2 Response:', JSON.stringify(docLogin2.data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
