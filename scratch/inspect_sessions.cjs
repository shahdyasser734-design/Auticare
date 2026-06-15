const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  console.log('--- /api/sessions POST Schema ---');
  const sessionPost = data.paths['/api/sessions']?.post;
  if (sessionPost) {
    console.log('Parameters:', JSON.stringify(sessionPost.parameters, null, 2));
    console.log('RequestBody Content:', JSON.stringify(sessionPost.requestBody?.content, null, 2));
    
    // Let's resolve the schema if it points to components
    const schemaRef = sessionPost.requestBody?.content?.['application/json']?.schema?.['$ref'];
    if (schemaRef) {
      console.log('Schema Reference:', schemaRef);
      const schemaName = schemaRef.split('/').pop();
      console.log(`Component Schema [${schemaName}]:`, JSON.stringify(data.components.schemas[schemaName], null, 2));
    }
  } else {
    console.log('/api/sessions POST not found in paths.');
  }
} catch (err) {
  console.error(err);
}
