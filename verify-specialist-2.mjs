import axios from 'axios';

const API_BASE = 'https://auticare-production-828c.up.railway.app/api';

async function run() {
  const timestamp = Date.now();
  const doctorEmail = `testdoc2_${timestamp}@example.com`;
  const parentEmail = `testparent2_${timestamp}@example.com`;

  try {
    console.log(`[1] Registering Doctor with yearsExperience...`);
    const docRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: `Test Doctor Two ${timestamp}`,
      email: doctorEmail,
      password: 'Password123!',
      role: 'Doctor',
      phone: '01012345678',
      nationalId: '30201012233445',
      yearsExperience: 5,
      qualification: 'PhD in Neurology',
      specialization: 'Neurology',
      licenseNumber: 'LIC-12345'
    });

    console.log(`[2] Registering Parent...`);
    const parentRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: `Test Parent Two ${timestamp}`,
      email: parentEmail,
      password: 'Password123!',
      role: 'Parent',
      phone: '01012345678',
      nationalId: '30201012233445',
    });

    const authToken = parentRes.data.token || (await axios.post(`${API_BASE}/auth/login`, {email: parentEmail, password: 'Password123!'})).data.token;

    console.log(`[3] Fetching Specialists...`);
    const specRes = await axios.get(`${API_BASE}/specialists`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const specialists = Array.isArray(specRes.data) ? specRes.data : specRes.data.data || specRes.data.specialists || [];
    const ourDoc = specialists.find(s => s.email === doctorEmail || s.name === `Test Doctor Two ${timestamp}`);
    if (ourDoc) {
      console.log('✅ NEW DOCTOR FOUND IN LIST:', ourDoc);
    } else {
      console.log('❌ NEW DOCTOR NOT FOUND IN LIST.');
    }
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

run();
