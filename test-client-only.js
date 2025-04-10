const { spawn } = require('child_process');
const path = require('path');

// Start the client only
console.log('Starting React client...');
const client = spawn('npm', ['run', 'client'], {
  stdio: 'inherit',
  shell: true
});

// Wait for client to be ready
console.log('Waiting for client to start...');
setTimeout(() => {
  console.log('Running simplified Puppeteer test...');
  const test = spawn('node', ['simple-puppeteer-test.js'], {
    stdio: 'inherit',
    shell: true
  });

  test.on('close', (code) => {
    console.log(`Test exited with code ${code}`);
    
    // Kill the client
    console.log('Shutting down client...');
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
  console.log('Process interrupted, shutting down...');
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', client.pid, '/f', '/t'], { stdio: 'inherit' });
  } else {
    client.kill();
  }
  process.exit(0);
}); 