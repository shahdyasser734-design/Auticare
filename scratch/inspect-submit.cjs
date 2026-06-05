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
    const loginRes = await request('POST', '/auth/login', { email, password: 'Password123!' });
    const token = loginRes.data?.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    const childRes = await request('POST', '/children', {
      firstName: 'TestChild',
      lastName: 'One',
      gender: 'Male',
      dateOfBirth: '2020-01-01',
      age: 5
    }, authHeaders);
    const childId = childRes.data?.id || childRes.data?.childId;

    console.log('--- Created child ID:', childId);

    // Let's test different submit payloads!
    const payloads = [
      {
        label: 'Payload A: Standard PascalCase, All 1s',
        body: {
          ChildId: Number(childId),
          Answers: Array.from({ length: 10 }, (_, i) => ({
            QuestionId: i + 1,
            Answer: 1,
            OptionId: `${i + 1}_yes`
          }))
        }
      },
      {
        label: 'Payload B: Standard PascalCase, All 0s',
        body: {
          ChildId: Number(childId),
          Answers: Array.from({ length: 10 }, (_, i) => ({
            QuestionId: i + 1,
            Answer: 0,
            OptionId: `${i + 1}_no`
          }))
        }
      },
      {
        label: 'Payload C: camelCase, All 1s',
        body: {
          childId: Number(childId),
          answers: Array.from({ length: 10 }, (_, i) => ({
            questionId: i + 1,
            answer: 1,
            optionId: `${i + 1}_yes`
          }))
        }
      },
      {
        label: 'Payload D: Flat answers array (if any)',
        body: {
          childId: Number(childId),
          answers: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        }
      },
      {
        label: 'Payload E: answers as stringified map',
        body: {
          childId: Number(childId),
          answers: {
            "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 1, "8": 1, "9": 1, "10": 1
          }
        }
      }
    ];

    for (const p of payloads) {
      console.log(`\nTesting: ${p.label}`);
      console.log('Sending body:', JSON.stringify(p.body));
      const res = await request('POST', '/screening/submit', p.body, authHeaders);
      console.log('Submit response status:', res.statusCode);
      console.log('Submit response data:', res.data);
      
      if (res.statusCode === 200) {
        // Query results
        const getRes = await request('GET', `/screening/results/${childId}`, null, authHeaders);
        console.log('Results response:', getRes.data);
      }
    }

  } catch (e) {
    console.error(e);
  }
}

run();
