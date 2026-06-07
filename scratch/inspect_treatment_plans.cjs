const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  const getChildPlans = data.paths['/api/treatment-plans/child/{childId}']?.get;
  console.log('GET /api/treatment-plans/child/{childId} Responses:');
  console.log(JSON.stringify(getChildPlans?.responses, null, 2));

  const getMyPlans = data.paths['/api/treatment-plans/my-plans']?.get;
  console.log('GET /api/treatment-plans/my-plans Responses:');
  console.log(JSON.stringify(getMyPlans?.responses, null, 2));
} catch (err) {
  console.error(err);
}
