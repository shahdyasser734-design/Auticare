const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  console.log('--- Paths for sessions ---');
  const paths = Object.keys(data.paths).filter(p => p.includes('session'));
  paths.forEach(p => {
    console.log(`Path: ${p}`);
    console.log(JSON.stringify(data.paths[p], null, 2));
  });
} catch (err) {
  console.error(err);
}
