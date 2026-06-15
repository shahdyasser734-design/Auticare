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

    // Helper to test a payload structure
    const testFormat = async (label, payload) => {
      const childRes = await request('POST', '/children', {
        firstName: `Test-${label.replace(/\s+/g, '')}`,
        lastName: 'Child',
        gender: 'Male',
        dateOfBirth: '2020-01-01',
        age: 5
      }, authHeaders);
      const childId = childRes.data?.id || childRes.data?.childId;
      
      // Submit with specific payload
      const body = {
        childId: Number(childId),
        ...payload
      };
      
      const submitRes = await request('POST', '/screening/submit', body, authHeaders);
      const getRes = await request('GET', `/screening/results/${childId}`, null, authHeaders);
      
      console.log(`\n=== FORMAT TEST: ${label} ===`);
      console.log('Submit response:', submitRes.data);
      console.log('Results response:', getRes.data);
    };

    // Format 1: camelCase, Answer as numbers (0)
    await testFormat('camelCase Numbers 0', {
      answers: Array.from({ length: 10 }, (_, i) => ({
        questionId: i + 1,
        answer: 0,
        optionId: `${i + 1}_no`
      }))
    });

    // Format 2: camelCase, Answer as numbers (1)
    await testFormat('camelCase Numbers 1', {
      answers: Array.from({ length: 10 }, (_, i) => ({
        questionId: i + 1,
        answer: 1,
        optionId: `${i + 1}_yes`
      }))
    });

    // Format 3: PascalCase, Answer as numbers (0)
    await testFormat('PascalCase Numbers 0', {
      Answers: Array.from({ length: 10 }, (_, i) => ({
        QuestionId: i + 1,
        Answer: 0,
        OptionId: `${i + 1}_no`
      }))
    });

    // Format 4: PascalCase, Answer as numbers (1)
    await testFormat('PascalCase Numbers 1', {
      Answers: Array.from({ length: 10 }, (_, i) => ({
        QuestionId: i + 1,
        Answer: 1,
        OptionId: `${i + 1}_yes`
      }))
    });

    // Format 5: PascalCase, Answer as strings "0"/"1"
    await testFormat('PascalCase Strings "0"/"1"', {
      Answers: Array.from({ length: 10 }, (_, i) => ({
        QuestionId: i + 1,
        Answer: i === 7 ? "NO" : "0", // q8 typical words
        OptionId: `${i + 1}_no`
      }))
    });

    // Format 6: PascalCase, Answer as strings "YES"/"NO"
    await testFormat('PascalCase Strings "YES"/"NO" (All High)', {
      Answers: Array.from({ length: 10 }, (_, i) => ({
        QuestionId: i + 1,
        Answer: i === 7 ? "YES" : "1",
        OptionId: `${i + 1}_yes`
      }))
    });

  } catch (err) {
    console.error('Error in format run:', err);
  }
}

run();
