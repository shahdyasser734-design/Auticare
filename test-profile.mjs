import axios from 'axios';
const API_BASE = 'https://auticare-production-828c.up.railway.app/api';
async function run() {
  try {
    const ts = Date.now();
    const res = await axios.post(API_BASE + '/auth/register', {
      fullName: 'Test Profile', email: 'prof' + ts + '@example.com', password: 'Password123!', role: 'Therapist', phone: '01012345678', nationalId: '30201012233445'
    });
    const token = res.data.token;
    const prof = await axios.get(API_BASE + '/profile', { headers: { Authorization: 'Bearer ' + token }});
    console.log('PROFILE:', prof.data);
  } catch(e) { console.error(e.response ? e.response.data : e.message); }
}
run();
