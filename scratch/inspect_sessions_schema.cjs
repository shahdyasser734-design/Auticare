const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  console.log('--- GET /api/sessions/treatment/{treatmentId} Response Schema ---');
  const sessionGet = data.paths['/api/sessions/treatment/{treatmentId}']?.get;
  if (sessionGet) {
    const responseSchemaRef = sessionGet.responses['200']?.content?.['application/json']?.schema?.['$ref'] || 
                               sessionGet.responses['200']?.content?.['application/json']?.schema?.items?.['$ref'];
    console.log('Schema Reference:', responseSchemaRef);
    if (responseSchemaRef) {
      const schemaName = responseSchemaRef.split('/').pop();
      console.log(`Component Schema [${schemaName}]:`, JSON.stringify(data.components.schemas[schemaName], null, 2));
    }
  }
} catch (err) {
  console.error(err);
}
