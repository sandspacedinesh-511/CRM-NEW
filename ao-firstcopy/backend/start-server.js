#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

server.on('close', (code) => {  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {  server.kill('SIGINT');
});

process.on('SIGTERM', () => {  server.kill('SIGTERM');
});
