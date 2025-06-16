#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting LLM Podcast Application...\n');

// Start backend
console.log('📦 Starting backend server...');
const backendProcess = spawn('dotnet', ['run'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Start frontend after a short delay
setTimeout(() => {
  console.log('🌐 Starting frontend server...');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  // Handle process cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit();
  });
}, 3000);

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backendProcess.kill();
  process.exit();
});
