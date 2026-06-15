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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  try {
    const timestamp = Date.now();
    const parentEmail = `parent_${timestamp}@example.com`;
    const docEmail = `doctor_${timestamp}@example.com`;
    const docName = `Dr. Ahmed ${timestamp}`;

    console.log('[1] Registering parent...');
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

    console.log('[2] Adding child with age 5, Male, DOB 2021-03-15...');
    const childRes = await request('POST', '/children', {
      firstName: 'Emma',
      lastName: 'Johnson',
      gender: 'Male',
      dateOfBirth: '2021-03-15',
      age: 5
    }, parentHeaders);
    const childId = childRes.data.id || childRes.data.childId;
    console.log('Child created with ID:', childId, childRes.data);

    console.log('[3] Registering doctor...');
    const docReg = await request('POST', '/auth/register', {
      email: docEmail,
      password: 'Password123!',
      fullName: docName,
      phone: '01012345678',
      role: 'Doctor',
      nationalId: '30201012233445'
    });
    const docToken = docReg.data.token;
    const docHeaders = { 'Authorization': `Bearer ${docToken}` };

    console.log('[3.1] Updating doctor profile...');
    await request('PUT', '/profile/update', {
      name: docName,
      phone: '01012345678',
      specialization: 'Pediatric Neurologist',
      yearsOfExperience: 10,
      bio: 'Experienced pediatric neurologist.'
    }, docHeaders);

    console.log('[3.2] Setting doctor license...');
    await request('PUT', '/profile/license', 'http://example.com/license.pdf', docHeaders);

    // Get specialistId for the doctor with retry
    let spec = null;
    console.log('[3.3] Querying specialists list (waiting for indexing)...');
    for (let attempt = 1; attempt <= 10; attempt++) {
      const specsRes = await request('GET', '/specialists?PageSize=100', null, parentHeaders);
      const specsData = specsRes.data;
      const specialists = Array.isArray(specsData) ? specsData : specsData.data || specsData.specialists || [];
      spec = specialists.find(s => s.name === docName);
      if (spec) {
        console.log(`Found doctor on attempt ${attempt}!`);
        break;
      }
      console.log(`Attempt ${attempt}: Doctor not found yet, retrying in 2s...`);
      await sleep(2000);
    }

    if (!spec) {
      throw new Error(`Doctor not found in specialists list after 10 attempts: ${docName}`);
    }
    const specialistId = spec.id || spec.specialistId;
    console.log('Doctor Specialist ID:', specialistId);

    console.log('[4] Creating booking from parent...');
    const bookingRes = await request('POST', '/bookings', {
      specialistId: Number(specialistId),
      childId: Number(childId),
      bookingDate: '2026-06-15T10:00:00Z',
      bookingTime: '10:00 AM',
      reason: 'Consultation'
    }, parentHeaders);
    console.log('Booking response:', JSON.stringify(bookingRes.data, null, 2));

    console.log('[5] Fetching bookings as Doctor...');
    const myBookings = await request('GET', '/bookings/my-bookings', null, docHeaders);
    console.log('Doctor My Bookings response:', JSON.stringify(myBookings.data, null, 2));

    console.log('[6] Fetching dashboard as Doctor...');
    const dashboardRes = await request('GET', '/dashboard/specialist', null, docHeaders);
    console.log('Doctor Dashboard response:', JSON.stringify(dashboardRes.data, null, 2));

  } catch (err) {
    console.error('Workflow failed:', err);
  }
}

run();
