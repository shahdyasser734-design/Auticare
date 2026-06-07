const axios = require('axios');

async function runTest() {
  const baseURL = 'https://auticare-production-828c.up.railway.app/api';
  const docEmail = `doctor-${Math.floor(Math.random() * 1000000)}@example.com`;
  const parentEmail = `parent-${Math.floor(Math.random() * 1000000)}@example.com`;
  const password = 'Password123!';

  console.log('====================================');
  console.log('VERIFYING TREATMENT PLAN WORKFLOW');
  console.log('====================================');

  try {
    // 1. Doctor Registration
    console.log('\n[STEP 1] Registering Doctor...');
    const regDoc = await axios.post(`${baseURL}/auth/register`, {
      email: docEmail,
      password: password,
      fullName: 'Dr. Sarah Jenkins',
      phone: '01012345678',
      role: 'Doctor'
    });
    const docToken = regDoc.data.token;
    console.log('Doctor registered successfully.');

    // 2. Parent Registration
    console.log('\n[STEP 2] Registering Parent...');
    const regParent = await axios.post(`${baseURL}/auth/register`, {
      email: parentEmail,
      password: password,
      fullName: 'Emily Watson',
      phone: '01087654321',
      role: 'Parent'
    });
    const parentToken = regParent.data.token;
    console.log('Parent registered successfully.');

    // 3. Add a Child
    console.log('\n[STEP 3] Registering Child under Parent...');
    const childRes = await axios.post(`${baseURL}/children`, {
      firstName: 'Tommy',
      lastName: 'Watson',
      gender: 'Male',
      dateOfBirth: '2019-08-15',
      age: 6
    }, { headers: { Authorization: `Bearer ${parentToken}` } });
    const childId = childRes.data?.id || childRes.data?.childId;
    console.log(`Child created with ID: ${childId}`);

    // 4. Publish Treatment Plan
    console.log('\n[STEP 4] Doctor publishes Treatment Plan...');
    const docHeaders = { Authorization: `Bearer ${docToken}` };
    const planRes = await axios.post(`${baseURL}/treatment-plans`, {
      childId: Number(childId),
      specialistId: 1, // dummy value greater than 0
      startDate: new Date().toISOString(),
      goal: 'Improve verbal communication\nEnhance fine motor skills\nDevelop social engagement',
      notes: 'Initial clinical assessment for sensory integration.'
    }, { headers: docHeaders });

    console.log('POST /api/treatment-plans status:', planRes.status);
    console.log('Response body:', planRes.data);
    const treatmentPlanId = planRes.data.treatmentId;
    const assignedDoctorId = planRes.data.specialistId;
    
    if (!treatmentPlanId) {
      throw new Error('FAILED: No treatmentPlanId returned in response.');
    }
    console.log(`Treatment plan published successfully with ID: ${treatmentPlanId}`);

    // 5. Parent Views Treatment Plan
    console.log('\n[STEP 5] Parent retrieves the Treatment Plan...');
    const parentHeaders = { Authorization: `Bearer ${parentToken}` };
    const parentPlanRes = await axios.get(`${baseURL}/treatment-plans/child/${childId}`, { headers: parentHeaders });
    
    console.log('GET /api/treatment-plans/child/{childId} status:', parentPlanRes.status);
    console.log('Returned plans:', parentPlanRes.data);
    
    const parentPlansList = parentPlanRes.data;
    if (!Array.isArray(parentPlansList) || parentPlansList.length === 0) {
      throw new Error('FAILED: Parent cannot see the treatment plan.');
    }
    
    const foundPlan = parentPlansList.find(p => p.treatmentId === treatmentPlanId);
    if (!foundPlan) {
      throw new Error('FAILED: Newly created plan not found in parent plans list.');
    }
    console.log('Parent verified: Found the published treatment plan successfully!');

    // 6. Specialist/Therapist Views Treatment Plan
    console.log('\n[STEP 6] Specialist retrieves their Treatment Plans...');
    const specialistPlansRes = await axios.get(`${baseURL}/treatment-plans/my-plans`, { headers: docHeaders });
    
    console.log('GET /api/treatment-plans/my-plans status:', specialistPlansRes.status);
    console.log('Returned plans:', specialistPlansRes.data);
    
    const specPlansList = specialistPlansRes.data;
    if (!Array.isArray(specPlansList) || specPlansList.length === 0) {
      throw new Error('FAILED: Specialist cannot see the treatment plan in my-plans.');
    }
    
    const foundSpecPlan = specPlansList.find(p => p.treatmentId === treatmentPlanId);
    if (!foundSpecPlan) {
      throw new Error('FAILED: Newly created plan not found in specialist plans list.');
    }
    console.log('Specialist/Therapist verified: Found the plan in my-plans successfully!');

    // 7. Session Creation Linkage
    console.log('\n[STEP 7] Creating a Session against the Treatment Plan...');
    const sessionRes = await axios.post(`${baseURL}/sessions`, {
      treatmentId: Number(treatmentPlanId),
      parentId: 1, // dummy
      specialistId: Number(assignedDoctorId),
      sessionDate: new Date().toISOString(),
      duration: 45,
      meetingLink: 'https://zoom.us/test-meeting-101',
      sessionNotes: 'Speech therapy session.'
    }, { headers: docHeaders });

    console.log('POST /api/sessions status:', sessionRes.status);
    console.log('Response body:', sessionRes.data);
    
    if (sessionRes.data?.treatmentId !== treatmentPlanId) {
      throw new Error(`FAILED: Session was not linked correctly. Expected treatmentId ${treatmentPlanId}, got ${sessionRes.data?.treatmentId}`);
    }
    console.log('Session linkage verified successfully!');
    
    console.log('\n====================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! ✅');
    console.log('====================================');
    
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    process.exit(1);
  }
}

runTest();
