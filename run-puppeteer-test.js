const { spawn } = require('child_process');
const path = require('path');

// Start the server directly rather than using npm script
console.log('Starting API server...');
const server = spawn('node', ['api/server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start the client
console.log('Starting React client...');
const client = spawn('npm', ['run', 'client'], {
  stdio: 'inherit',
  shell: true
});

// Wait for both to be ready
console.log('Waiting for servers to start...');
setTimeout(() => {
  console.log('Running Puppeteer tests...');
  const test = spawn('node', ['puppeteer-test.js'], {
    stdio: 'inherit',
    shell: true
  });

  test.on('close', (code) => {
    console.log(`Test exited with code ${code}`);
    
    // Kill the servers
    console.log('Shutting down servers...');
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', server.pid, '/f', '/t'], { stdio: 'inherit' });
      spawn('taskkill', ['/pid', client.pid, '/f', '/t'], { stdio: 'inherit' });
    } else {
      server.kill();
      client.kill();
    }
    
    process.exit(code);
  });
}, 15000); // Give 15 seconds for the servers to start

// Handle process termination
process.on('SIGINT', () => {
  console.log('Process interrupted, shutting down...');
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', server.pid, '/f', '/t'], { stdio: 'inherit' });
    spawn('taskkill', ['/pid', client.pid, '/f', '/t'], { stdio: 'inherit' });
  } else {
    server.kill();
    client.kill();
  }
  process.exit(0);
}); 