const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  console.log('Schema [SendZoomLinkRequest]:');
  console.log(JSON.stringify(data.components.schemas['SendZoomLinkRequest'], null, 2));
} catch (err) {
  console.error(err);
}
