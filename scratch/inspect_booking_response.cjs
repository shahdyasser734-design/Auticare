const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  console.log('--- GET /api/bookings/upcoming Response Schema ---');
  const upcomingGet = data.paths['/api/bookings/upcoming']?.get;
  if (upcomingGet) {
    const responseSchemaRef = upcomingGet.responses['200']?.content?.['application/json']?.schema?.['$ref'] || 
                               upcomingGet.responses['200']?.content?.['application/json']?.schema?.items?.['$ref'];
    console.log('Schema Reference:', responseSchemaRef);
    if (responseSchemaRef) {
      const schemaName = responseSchemaRef.split('/').pop();
      console.log(`Component Schema [${schemaName}]:`, JSON.stringify(data.components.schemas[schemaName], null, 2));
    } else {
      console.log('Response schema:', JSON.stringify(upcomingGet.responses['200']?.content, null, 2));
    }
  }
} catch (err) {
  console.error(err);
}
