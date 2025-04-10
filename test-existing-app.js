const { spawn } = require('child_process');

console.log('Running Puppeteer tests on existing app...');
console.log('Make sure your app is already running on http://localhost:3000!');

// Run the Puppeteer test
const test = spawn('node', ['puppeteer-test.js'], {
  stdio: 'inherit',
  shell: true
});

test.on('close', (code) => {
  console.log(`Test exited with code ${code}`);
  process.exit(code);
}); 