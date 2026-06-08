import axios from 'axios';

const API_BASE = 'https://auticare-production-828c.up.railway.app/api';

async function run() {
  const timestamp = Date.now();
  const doctorEmail = `testdoc_${timestamp}@example.com`;

  try {
    const docRes = await axios.post(`${API_BASE}/auth/register`, {
      fullName: `Test Doctor ${timestamp}`,
      email: doctorEmail,
      password: 'Password123!',
      role: 'Doctor',
      phone: '01012345678',
      nationalId: '30201012233445',
      yearsOfExperience: 5,
      qualification: 'PhD in Neurology',
      specialization: 'Neurology',
      licenseNumber: 'LIC-12345'
    });
    const docToken = docRes.data.token;

    console.log(`[1] Fetching Doctor Profile with token...`);
    const profileRes = await axios.get(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${docToken}` }
    });
    console.log('Profile:', profileRes.data);

    console.log(`[2] Can the Doctor see themselves in /api/specialists?`);
    const specRes = await axios.get(`${API_BASE}/specialists`, {
      headers: { Authorization: `Bearer ${docToken}` }
    });
    const specialists = Array.isArray(specRes.data) ? specRes.data : specRes.data.data || specRes.data.specialists || [];
    const ourDoc = specialists.find(s => s.email === doctorEmail);
    if (ourDoc) {
      console.log('✅ YES, found in /api/specialists');
    } else {
      console.log('❌ NO, not found in /api/specialists');
      console.log('Checking if backend expects file uploads to create a specialist profile...');
      console.log('Trying with multipart/form-data...');
    }

  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

run();
