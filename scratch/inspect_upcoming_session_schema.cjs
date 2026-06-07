const fs = require('fs');
const path = require('path');

try {
  const swaggerPath = path.join(__dirname, 'swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const data = JSON.parse(content);
  
  console.log('Schema [UpcomingSession]:');
  console.log(JSON.stringify(data.components.schemas['UpcomingSession'] || data.components.schemas['UpcomingSessionResponse'], null, 2));
  console.log('Schema [DashboardSpecialistResponse]:');
  console.log(JSON.stringify(data.components.schemas['DashboardSpecialistResponse'], null, 2));
} catch (err) {
  console.error(err);
}
