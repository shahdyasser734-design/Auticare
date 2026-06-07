const axios = require('axios');

async function runTest() {
  const baseURL = 'https://auticare-production-828c.up.railway.app/api';
  const docEmail = `doctor-${Math.floor(Math.random() * 1000000)}@example.com`;
  const parentEmail = `parent-${Math.floor(Math.random() * 1000000)}@example.com`;
  const password = 'Password123!';

  try {
    console.log('Registering Doctor...');
    const regDoc = await axios.post(`${baseURL}/auth/register`, {
      email: docEmail, password, fullName: 'Dr. Test', phone: '01012345678', role: 'Doctor'
    });
    const docToken = regDoc.data.token;

    console.log('Registering Parent...');
    const regParent = await axios.post(`${baseURL}/auth/register`, {
      email: parentEmail, password, fullName: 'Emily', phone: '01087654321', role: 'Parent'
    });
    const parentToken = regParent.data.token;

    console.log('Adding Child...');
    const childRes = await axios.post(`${baseURL}/children`, {
      firstName: 'Tommy', lastName: 'Watson', gender: 'Male', dateOfBirth: '2019-08-15', age: 6
    }, { headers: { Authorization: `Bearer ${parentToken}` } });
    const childId = childRes.data.id || childRes.data.childId;

    const payload = {
      childId: Number(childId),
      specialistId: 1,
      startDate: new Date().toISOString(),
      endDate: null,
      goal: 'Development Plan',
      notes: 'Initial clinical assessment'
    };

    console.log('Sending Payload:', JSON.stringify(payload, null, 2));

    const planRes = await axios.post(`${baseURL}/treatment-plans`, payload, { 
      headers: { Authorization: `Bearer ${docToken}` } 
    });

    console.log('Success! Response:', planRes.data);
  } catch (err) {
    console.log('FAILED!');
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', err.response.data);
    } else {
      console.log(err.message);
    }
  }
}

runTest();
