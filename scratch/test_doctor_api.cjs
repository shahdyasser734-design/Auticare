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
      email: 'testdoc_1780884576432@example.com',
      password: 'Password123!'
    });
    const docToken = docLogin.data.token;
    const docHeaders = { 'Authorization': `Bearer ${docToken}` };
    
    console.log('[1] GET /dashboard/specialist/patients');
    const d1 = await request('GET', '/dashboard/specialist/patients', null, docHeaders);
    console.log(d1.statusCode, d1.data);
    
    console.log('[2] GET /notes/my-notes');
    const d2 = await request('GET', '/notes/my-notes', null, docHeaders);
    console.log(d2.statusCode, d2.data);
    
  } catch (err) {
    console.error(err);
  }
}

run();
