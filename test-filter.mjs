import axios from 'axios';
const API_BASE = 'https://auticare-production-828c.up.railway.app/api';
async function run() {
  try {
    const ts = Date.now();
    const res = await axios.post(API_BASE + '/auth/register', {
      fullName: 'Test Filter', email: 'filter' + ts + '@example.com', password: 'Password123!', role: 'Parent', phone: '01012345678', nationalId: '30201012233445'
    });
    const token = res.data.token;
    const specDoc = await axios.get(API_BASE + '/specialists?type=Doctor', { headers: { Authorization: 'Bearer ' + token }});
    const specTher = await axios.get(API_BASE + '/specialists?type=Therapist', { headers: { Authorization: 'Bearer ' + token }});
    const all = await axios.get(API_BASE + '/specialists', { headers: { Authorization: 'Bearer ' + token }});
    const getLen = (d) => Array.isArray(d) ? d.length : (d.data ? d.data.length : d.specialists.length);
    console.log('Docs:', getLen(specDoc.data), 'Therapists:', getLen(specTher.data), 'All:', getLen(all.data));
  } catch(e) { console.error(e.response ? e.response.data : e.message); }
}
run();
