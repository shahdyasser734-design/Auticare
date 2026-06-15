const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  const matches = Object.keys(data.components.schemas).filter(s => s.toLowerCase().includes('dash') || s.toLowerCase().includes('specialist'));
  console.log('Matching Schemas:', matches);
  matches.forEach(m => {
    console.log(`Schema [${m}]:`, JSON.stringify(data.components.schemas[m], null, 2));
  });
} catch (err) {
  console.error(err);
}
