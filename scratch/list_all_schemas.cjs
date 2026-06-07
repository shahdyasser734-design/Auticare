const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  console.log('All schemas keys:');
  console.log(Object.keys(data.components.schemas));
} catch (err) {
  console.error(err);
}
