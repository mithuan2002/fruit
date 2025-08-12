#!/usr/bin/env node

// Simple build script for Vercel deployment
// This ensures only the frontend is built
import { execSync } from 'child_process';

try {
  console.log('Building frontend only for Vercel...');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('Frontend build complete!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}