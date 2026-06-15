const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function run() {
  const baseURL = 'https://auticare-production-828c.up.railway.app/api';
  const docEmail = `doc-${Date.now()}@example.com`;
  const parentEmail = `parent-${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('Registering doctor...');
  const regDoc = await axios.post(`${baseURL}/auth/register`, {
    email: docEmail,
    password: password,
    fullName: 'Dr. Browser Test',
    phone: '01011112222',
    role: 'Doctor'
  });
  const docToken = regDoc.data.token;
  console.log(`Doctor registered: ${docEmail}`);

  // Update profile specialization so doctor dashboard works
  await axios.put(`${baseURL}/profile/update`, {
    name: 'Dr. Browser Test',
    phone: '01011112222',
    specialization: 'Clinical Psychologist',
    yearsOfExperience: 10,
    bio: 'Specialist clinical assessment.'
  }, { headers: { Authorization: `Bearer ${docToken}` } });

  // Update doctor license
  await axios.put(`${baseURL}/profile/license`, JSON.stringify("http://example.com/license.pdf"), {
    headers: { Authorization: `Bearer ${docToken}`, 'Content-Type': 'application/json' }
  });

  console.log('Registering parent...');
  const regParent = await axios.post(`${baseURL}/auth/register`, {
    email: parentEmail,
    password: password,
    fullName: 'Mary Parent',
    phone: '01033334444',
    role: 'Parent'
  });
  const parentToken = regParent.data.token;
  console.log(`Parent registered: ${parentEmail}`);

  console.log('Adding child...');
  const childRes = await axios.post(`${baseURL}/children`, {
    firstName: 'Billy',
    lastName: 'Test',
    gender: 'Male',
    dateOfBirth: '2020-01-01',
    age: 6
  }, { headers: { Authorization: `Bearer ${parentToken}` } });
  
  const childId = childRes.data?.id || childRes.data?.childId;
  console.log(`Child created with ID: ${childId}`);

  // Approve a booking request so we have a session to start/join
  console.log('Booking specialist...');
  const bookingRes = await axios.post(`${baseURL}/bookings`, {
    specialistId: regDoc.data.user?.id || 1,
    SpecialistId: regDoc.data.user?.id || 1,
    childId: childId,
    ChildId: childId,
    bookingDate: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
    BookingDate: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
    preferredTime: '10:00',
    PreferredTime: '10:00',
    reason: 'Screening evaluation session',
    Reason: 'Screening evaluation session'
  }, { headers: { Authorization: `Bearer ${parentToken}` } });
  const bookingId = bookingRes.data?.id || bookingRes.data?.bookingId;
  console.log(`Booking created with ID: ${bookingId}`);

  // Doctor approves the booking to confirm/schedule it
  console.log('Doctor approving booking...');
  await axios.patch(`${baseURL}/bookings/${bookingId}/status`, { status: 'confirmed' }, {
    headers: { Authorization: `Bearer ${docToken}` }
  });
  console.log('Booking confirmed.');

  const testSession = {
    docEmail,
    parentEmail,
    password,
    childId,
    bookingId
  };

  const jsonPath = path.join(__dirname, 'test_session.json');
  fs.writeFileSync(jsonPath, JSON.stringify(testSession, null, 2), 'utf8');
  console.log(`Saved credentials to ${jsonPath}`);
}

run().catch(console.error);
