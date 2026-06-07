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
    const docEmail = `doc-${Math.floor(Math.random() * 1000000)}@example.com`;
    const parentEmail = `parent-${Math.floor(Math.random() * 1000000)}@example.com`;
    const password = 'Password123!';

    console.log('Registering Doctor...');
    const regDoc = await request('POST', '/auth/register', {
      email: docEmail,
      password,
      fullName: 'Dr. Test',
      phone: '01012345678',
      role: 'Doctor'
    });
    const docToken = regDoc.data.token;
    const docUserId = regDoc.data.userId || regDoc.data.user?.id;
    const docHeaders = { 'Authorization': `Bearer ${docToken}` };
    console.log(`Doctor ID: ${docUserId}`);

    console.log('Registering Parent...');
    const regParent = await request('POST', '/auth/register', {
      email: parentEmail,
      password,
      fullName: 'Parent Test',
      phone: '01098765432',
      role: 'Parent'
    });
    const parentToken = regParent.data.token;
    const parentUserId = regParent.data.userId || regParent.data.user?.id;
    const parentHeaders = { 'Authorization': `Bearer ${parentToken}` };
    console.log(`Parent ID: ${parentUserId}`);

    console.log('Adding Child...');
    const childRes = await request('POST', '/children', {
      firstName: 'Child',
      lastName: 'Test',
      gender: 'Male',
      dateOfBirth: '2020-01-01',
      age: 5
    }, parentHeaders);
    const childId = childRes.data.id || childRes.data.childId;
    console.log(`Child created: ${childId}`);

    console.log('Creating Treatment Plan...');
    const planRes = await request('POST', '/treatment-plans', {
      childId: Number(childId),
      specialistId: Number(docUserId),
      startDate: new Date().toISOString(),
      goal: 'Test Goals',
      notes: 'Test Notes'
    }, docHeaders);
    const treatmentPlanId = planRes.data.treatmentId;
    console.log(`Plan created: ${treatmentPlanId}`);

    console.log('Creating Session...');
    const sessionRes = await request('POST', '/sessions', {
      treatmentId: Number(treatmentPlanId),
      parentId: Number(parentUserId),
      specialistId: Number(docUserId),
      sessionDate: new Date().toISOString(),
      duration: 60,
      meetingLink: 'https://zoom.us/j/1234567890',
      sessionNotes: 'Test Session notes'
    }, docHeaders);
    console.log('POST /sessions Response:', JSON.stringify(sessionRes.data, null, 2));

    console.log('Fetching Sessions by Treatment...');
    const getSessionsRes = await request('GET', `/sessions/treatment/${treatmentPlanId}`, null, docHeaders);
    console.log('GET /sessions/treatment/{id} Response:', JSON.stringify(getSessionsRes.data, null, 2));

  } catch (err) {
    console.error(err);
  }
}

run();
