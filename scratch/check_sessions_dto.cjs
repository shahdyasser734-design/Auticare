const axios = require('axios');

async function test() {
  const baseURL = 'https://auticare-production-828c.up.railway.app/api';
  // Use treatmentId 19 from the previous test run
  try {
    const res = await axios.get(`${baseURL}/sessions/treatment/19`);
    console.log("SESSIONS DTO RESPONSE:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.log("Error:", err.message);
  }
}
test();
