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
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBody: data
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
    const reg = await request('POST', '/auth/register', {
      email,
      password: 'Password123!',
      fullName: 'Test Parent',
      phone: '01012345678',
      role: 'Parent',
      nationalId: '30201012233445'
    });
    
    const regData = JSON.parse(reg.rawBody);
    const token = regData.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // SCENARIO 1: High Answers on Child 1
    const child1 = await request('POST', '/children', {
      firstName: 'HighRisk',
      lastName: 'Child',
      gender: 'Male',
      dateOfBirth: '2020-01-01',
      age: 5
    }, authHeaders);
    const child1Id = JSON.parse(child1.rawBody).childId;

    const highAnswers = Array.from({ length: 10 }, (_, i) => ({
      QuestionId: i + 1,
      Answer: 1,
      OptionId: `${i + 1}_yes`
    }));

    const submit1 = await request('POST', '/screening/submit', {
      ChildId: Number(child1Id),
      Answers: highAnswers
    }, authHeaders);

    const results1 = await request('GET', `/screening/results/${child1Id}`, null, authHeaders);
    const analytics1 = await request('GET', `/screening/analytics/${child1Id}`, null, authHeaders);

    // SCENARIO 2: Low Answers on Child 2
    const child2 = await request('POST', '/children', {
      firstName: 'LowRisk',
      lastName: 'Child',
      gender: 'Female',
      dateOfBirth: '2021-02-02',
      age: 4
    }, authHeaders);
    const child2Id = JSON.parse(child2.rawBody).childId;

    const lowAnswers = Array.from({ length: 10 }, (_, i) => ({
      QuestionId: i + 1,
      Answer: 0,
      OptionId: `${i + 1}_no`
    }));

    const submit2 = await request('POST', '/screening/submit', {
      ChildId: Number(child2Id),
      Answers: lowAnswers
    }, authHeaders);

    const results2 = await request('GET', `/screening/results/${child2Id}`, null, authHeaders);
    const analytics2 = await request('GET', `/screening/analytics/${child2Id}`, null, authHeaders);

    console.log('=== SCENARIO 1: HIGH ANSWERS ===');
    console.log('POST /api/screening/submit response (RAW):');
    console.log(submit1.rawBody);
    console.log('\nGET /api/screening/results/' + child1Id + ' response (RAW):');
    console.log(results1.rawBody);
    console.log('\nGET /api/screening/analytics/' + child1Id + ' response (RAW):');
    console.log(analytics1.rawBody);

    console.log('\n\n=== SCENARIO 2: LOW ANSWERS ===');
    console.log('POST /api/screening/submit response (RAW):');
    console.log(submit2.rawBody);
    console.log('\nGET /api/screening/results/' + child2Id + ' response (RAW):');
    console.log(results2.rawBody);
    console.log('\nGET /api/screening/analytics/' + child2Id + ' response (RAW):');
    console.log(analytics2.rawBody);

  } catch (err) {
    console.error(err);
  }
}

run();
