const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  console.log('Available API Paths:');
  Object.keys(data.paths).forEach(p => {
    console.log(`- ${p} (${Object.keys(data.paths[p]).join(', ')})`);
  });
} catch (err) {
  console.error(err);
}
