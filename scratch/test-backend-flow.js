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
    console.log('--- TEST 1: Register and login ---');
    const randomEmail = `test-${Math.floor(Math.random() * 1000000)}@example.com`;
    console.log(`Registering with email: ${randomEmail}`);
    const regRes = await request('POST', '/auth/register', {
      email: randomEmail,
      password: 'Password123!',
      fullName: 'Test Parent',
      phone: '1234567890',
      role: 'parent'
    });
    console.log('Register status:', regRes.statusCode);
    
    // Log in
    const loginRes = await request('POST', '/auth/login', {
      email: randomEmail,
      password: 'Password123!'
    });
    console.log('Login status:', loginRes.statusCode);
    const token = loginRes.data?.token || regRes.data?.token;
    if (!token) {
      console.error('No token received!', loginRes.data || regRes.data);
      return;
    }
    console.log('Token received:', token.substring(0, 20) + '...');
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    console.log('\n--- TEST 2: Add a child ---');
    const childRes = await request('POST', '/children', {
      firstName: 'Alex',
      lastName: 'Test',
      gender: 'Male',
      dateOfBirth: '2020-01-01',
      age: 6
    }, authHeaders);
    console.log('Add Child status:', childRes.statusCode);
    console.log('Child data:', childRes.data);
    const childId = childRes.data?.id || childRes.data?.childId;
    if (!childId) {
      console.error('No child ID received!');
      return;
    }

    console.log('\n--- TEST 3: Get specialists list ---');
    const specRes = await request('GET', '/specialists', null, authHeaders);
    console.log('Specialists status:', specRes.statusCode);
    console.log('Specialists count:', Array.isArray(specRes.data) ? specRes.data.length : Array.isArray(specRes.data?.data) ? specRes.data.data.length : 'Unknown');
    const rawList = Array.isArray(specRes.data) ? specRes.data : (specRes.data?.data || []);
    console.log('Sample specialists details (first 2):', JSON.stringify(rawList.slice(0, 2), null, 2));

    console.log('\n--- TEST 4: Get specialists list filtered by doctor ---');
    const docRes = await request('GET', '/specialists?type=doctor', null, authHeaders);
    console.log('Doctors endpoint status:', docRes.statusCode);
    const docList = Array.isArray(docRes.data) ? docRes.data : (docRes.data?.data || []);
    console.log('Doctors count from API:', docList.length);
    console.log('Doctor types in response:', docList.map(s => s.type || s.role || 'no-type'));

    console.log('\n--- TEST 5: Get specialists list filtered by therapist ---');
    const therapistRes = await request('GET', '/specialists?type=therapist', null, authHeaders);
    console.log('Therapists endpoint status:', therapistRes.statusCode);
    const therapistList = Array.isArray(therapistRes.data) ? therapistRes.data : (therapistRes.data?.data || []);
    console.log('Therapists count from API:', therapistList.length);
    console.log('Therapist types in response:', therapistList.map(s => s.type || s.role || 'no-type'));

    console.log('\n--- TEST 6: Get Screening Questions ---');
    const qRes = await request('GET', '/screening/questions', null, authHeaders);
    console.log('Get Questions status:', qRes.statusCode);
    console.log('Questions count:', Array.isArray(qRes.data) ? qRes.data.length : 'Not an array');
    if (Array.isArray(qRes.data) && qRes.data.length > 0) {
      console.log('Sample question options:', JSON.stringify(qRes.data[0], null, 2));
    }

    console.log('\n--- TEST 7: Start Screening ---');
    const startRes = await request('POST', '/screening/start', { childId }, authHeaders);
    console.log('Start Screening status:', startRes.statusCode);
    console.log('Start Screening response:', startRes.data);
    const sessionId = startRes.data?.sessionId;

    console.log('\n--- TEST 8: Submit Answers (Scenario A: All Low/No) ---');
    // We map answers. Let's check what QuestionId format is expected.
    // If the questions were retrieved, let's use their actual IDs. If not, fallback to 1-10.
    const questionsList = Array.isArray(qRes.data) ? qRes.data : [];
    const lowAnswers = questionsList.map((q, i) => {
      // Typically OptionId is option ID, let's look at options
      const opt = q.options && q.options.find(o => o.value === 0 || o.label.toLowerCase() === 'no') || q.options?.[0];
      return {
        QuestionId: q.id,
        Answer: 0,
        OptionId: opt?.id || `${q.id}_no`
      };
    });
    console.log('Submitting low answers:', lowAnswers);
    const submitLowRes = await request('POST', '/screening/submit', {
      ChildId: Number(childId),
      Answers: lowAnswers
    }, authHeaders);
    console.log('Submit Low status:', submitLowRes.statusCode);
    console.log('Submit Low response:', submitLowRes.data);

    console.log('\n--- TEST 9: Get Results (Scenario A) ---');
    const resultsLowRes = await request('GET', `/screening/results/${childId}`, null, authHeaders);
    console.log('Get Results Low status:', resultsLowRes.statusCode);
    console.log('Get Results Low data:', resultsLowRes.data);

    console.log('\n--- TEST 10: Get Analytics (Scenario A) ---');
    const analyticsLowRes = await request('GET', `/screening/analytics/${childId}`, null, authHeaders);
    console.log('Get Analytics Low status:', analyticsLowRes.statusCode);
    console.log('Get Analytics Low data:', analyticsLowRes.data);

    console.log('\n--- TEST 11: Submit Answers (Scenario B: All High/Yes) ---');
    const highAnswers = questionsList.map((q, i) => {
      const opt = q.options && q.options.find(o => o.value === 1 || o.label.toLowerCase() === 'yes') || q.options?.[0];
      return {
        QuestionId: q.id,
        Answer: 1,
        OptionId: opt?.id || `${q.id}_yes`
      };
    });
    console.log('Submitting high answers:', highAnswers);
    // Create new child to avoid mixing history if needed, or submit on same child
    const child2Res = await request('POST', '/children', {
      firstName: 'Jordan',
      lastName: 'Test',
      gender: 'Female',
      dateOfBirth: '2019-05-05',
      age: 7
    }, authHeaders);
    const childId2 = child2Res.data?.id || child2Res.data?.childId;
    console.log('Created second child, ID:', childId2);
    
    const submitHighRes = await request('POST', '/screening/submit', {
      ChildId: Number(childId2),
      Answers: highAnswers
    }, authHeaders);
    console.log('Submit High status:', submitHighRes.statusCode);
    console.log('Submit High response:', submitHighRes.data);

    console.log('\n--- TEST 12: Get Results (Scenario B) ---');
    const resultsHighRes = await request('GET', `/screening/results/${childId2}`, null, authHeaders);
    console.log('Get Results High status:', resultsHighRes.statusCode);
    console.log('Get Results High data:', resultsHighRes.data);

  } catch (err) {
    console.error('ERROR running test:', err);
  }
}

run();
