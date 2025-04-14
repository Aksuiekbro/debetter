#!/usr/bin/env node
require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');


const scripts = [
  'createKazakhJudges.js',
  'createKazakhTeams.js',
  'createTournament.js'
];

// Run each script in sequence
scripts.forEach(script => {
  const scriptPath = path.join(__dirname, script);
  
  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Error running ${script}: ${error.message}`);
    process.exit(1);
  }
});
