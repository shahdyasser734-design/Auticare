const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  const licensePut = data.paths['/api/profile/license']?.put;
  console.log('PUT /api/profile/license schema:');
  console.log(JSON.stringify(licensePut?.requestBody?.content?.['application/json']?.schema, null, 2));
  
  const schemaRef = licensePut?.requestBody?.content?.['application/json']?.schema?.['$ref'];
  if (schemaRef) {
    const schemaName = schemaRef.split('/').pop();
    console.log(`Schema [${schemaName}]:`, JSON.stringify(data.components.schemas[schemaName], null, 2));
  }
} catch (err) {
  console.error(err);
}
