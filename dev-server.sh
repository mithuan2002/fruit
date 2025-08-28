#!/bin/bash

# Kill any existing processes
pkill -f "tsx server/index.ts" || true
pkill -f "vite --host" || true
pkill -f "concurrently" || true

# Wait a moment for processes to terminate
sleep 2

echo "Starting unified Express + Vite development server..."

# Set environment variables and start the server
export NODE_ENV=development
export PORT=5000

# Start the Express server with integrated Vite middleware
exec tsx server/index.ts