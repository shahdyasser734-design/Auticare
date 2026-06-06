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

    const testFormat = async (label, payload) => {
      const childRes = await request('POST', '/children', {
        firstName: `Child`,
        lastName: label.replace(/\s+/g, ''),
        gender: 'Male',
        dateOfBirth: '2020-01-01',
        age: 5
      }, authHeaders);
      const childId = childRes.data?.id || childRes.data?.childId;
      
      const body = {
        childId: Number(childId),
        ...payload
      };
      
      const submitRes = await request('POST', '/screening/submit', body, authHeaders);
      const getRes = await request('GET', `/screening/results/${childId}`, null, authHeaders);
      
      console.log(`\n=== FORMAT TEST: ${label} ===`);
      console.log('Payload sent:', JSON.stringify(body, null, 2));
      console.log('Submit response:', submitRes.data);
      console.log('Results response:', getRes.data);
    };

    // Scenario A: Autism indicating answers (where aqScore should be high, riskLevel high)
    // Q1-Q9: 0 (No), Q10: 1 (Yes)
    // Using correct keys: questionId, answerValue
    console.log('Testing Scenario A...');
    await testFormat('Scenario A (Autism indicating)', {
      answers: Array.from({ length: 10 }, (_, i) => ({
        questionId: i + 1,
        answerValue: i === 9 ? 1 : 0
      }))
    });

    // Scenario B: Non-autism indicating answers (where aqScore should be 0, riskLevel low)
    // Q1-Q9: 1 (Yes), Q10: 0 (No)
    // Using correct keys: questionId, answerValue
    console.log('Testing Scenario B...');
    await testFormat('Scenario B (Non-Autism indicating)', {
      answers: Array.from({ length: 10 }, (_, i) => ({
        questionId: i + 1,
        answerValue: i === 9 ? 0 : 1
      }))
    });

  } catch (err) {
    console.error('Error in test:', err);
  }
}

run();
