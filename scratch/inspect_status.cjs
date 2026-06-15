const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  const statusPatch = data.paths['/api/bookings/{id}/status']?.patch;
  console.log('PATCH /api/bookings/{id}/status Schema:');
  console.log(JSON.stringify(statusPatch, null, 2));
} catch (err) {
  console.error(err);
}
