const { spawn } = require('child_process');
const path = require('path');

// Start the client only
const client = spawn('npm', ['run', 'client'], {
  stdio: 'inherit',
  shell: true
});

// Wait for client to be ready
setTimeout(() => {
  const test = spawn('node', ['debetter-test.js'], {
    stdio: 'inherit',
    shell: true
  });

  test.on('close', (code) => {
    
    // Kill the client
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', client.pid, '/f', '/t'], { stdio: 'inherit' });
    } else {
      client.kill();
    }
    
    process.exit(code);
  });
}, 10000); // Give 10 seconds for the client to start

// Handle process termination
process.on('SIGINT', () => {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', client.pid, '/f', '/t'], { stdio: 'inherit' });
  } else {
    client.kill();
  }
  process.exit(0);
}); 