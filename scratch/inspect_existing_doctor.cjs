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
    const timestamp = Date.now();
    const parentEmail = `parent_${timestamp}@example.com`;
    const docEmail = 'testdoc_1780884576432@example.com';
    const specialistId = 80;

    console.log('[1] Logging in doctor...');
    const docLogin = await request('POST', '/auth/login', {
      email: docEmail,
      password: 'Password123!'
    });
    const docToken = docLogin.data.token;
    const docHeaders = { 'Authorization': `Bearer ${docToken}` };

    console.log('[2] Registering parent...');
    const parentReg = await request('POST', '/auth/register', {
      email: parentEmail,
      password: 'Password123!',
      fullName: 'Sarah Johnson',
      phone: '01012345678',
      role: 'Parent',
      nationalId: '30201012233445'
    });
    const parentToken = parentReg.data.token;
    const parentHeaders = { 'Authorization': `Bearer ${parentToken}` };

    console.log('[3] Adding child with age 5, Male, DOB 2021-03-15...');
    const childRes = await request('POST', '/children', {
      firstName: 'Emma',
      lastName: 'Johnson',
      gender: 'Male',
      dateOfBirth: '2021-03-15T00:00:00Z',
      age: 5
    }, parentHeaders);
    const childId = childRes.data.id || childRes.data.childId;

    console.log('[3.1] Completing screening for child...');
    const qRes = await request('GET', '/screening/questions', null, parentHeaders);
    const answers = qRes.data.map((q, i) => ({
      questionId: q.questionId || (i + 1),
      answer: 1,
      optionId: `${q.questionId || (i + 1)}_yes`
    }));
    await request('POST', '/screening/submit', {
      childId: Number(childId),
      answers
    }, parentHeaders);

    console.log('[4] Creating booking from parent...');
    const bookingRes = await request('POST', '/bookings', {
      specialistId: Number(specialistId),
      childId: Number(childId),
      bookingDate: new Date('2026-06-15T00:00:00Z').toISOString(),
      bookingTime: '10:00:00',
      reason: 'Consultation'
    }, parentHeaders);
    const bookingId = bookingRes.data.bookingId || bookingRes.data.id;

    console.log('[5] Confirming booking as Doctor...');
    await request('PATCH', `/bookings/${bookingId}/status`, { status: 'Confirmed' }, docHeaders);

    console.log('[6] Fetching dashboard as Doctor...');
    const dashboardRes = await request('GET', '/dashboard/specialist', null, docHeaders);
    console.log('Doctor Dashboard response (RAW):', JSON.stringify(dashboardRes.data, null, 2));

  } catch (err) {
    console.error('Workflow failed:', err);
  }
}

run();
