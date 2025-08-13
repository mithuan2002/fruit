#!/usr/bin/env node

// Vercel build script for full-stack deployment
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function build() {
  try {
    console.log('🏗️  Starting Vercel build process...');
    
    // Build the frontend
    console.log('📦 Building frontend...');
    await execAsync('npx vite build');
    console.log('✅ Frontend build completed');
    
    // Build the backend
    console.log('🚀 Building backend...');
    await execAsync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist');
    console.log('✅ Backend build completed');
    
    console.log('🎉 Build process completed successfully!');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();