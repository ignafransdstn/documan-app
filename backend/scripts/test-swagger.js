const http = require('http');

// Test if Swagger UI is accessible
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api-docs',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  if (res.statusCode === 200) {
    console.log('✅ Swagger UI is accessible at http://localhost:5000/api-docs');
  } else {
    console.log('❌ Swagger UI is not accessible');
  }
});

req.on('error', (e) => {
  console.error(`❌ Problem with request: ${e.message}`);
});

req.end();