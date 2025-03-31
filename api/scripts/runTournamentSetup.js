#!/usr/bin/env node
require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

console.log('🏆 Starting tournament setup process...');

const scripts = [
  'createKazakhJudges.js',
  'createKazakhTeams.js',
  'createTournament.js'
];

// Run each script in sequence
scripts.forEach(script => {
  const scriptPath = path.join(__dirname, script);
  console.log(`\n🚀 Running ${script}...`);
  
  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    console.log(`✅ Successfully completed ${script}`);
  } catch (error) {
    console.error(`❌ Error running ${script}: ${error.message}`);
    process.exit(1);
  }
});

console.log('\n🎉 Tournament setup completed successfully!');
console.log('You can now view the tournament in the web interface.'); 