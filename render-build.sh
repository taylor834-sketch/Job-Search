#!/usr/bin/env bash
# Render build script
set -e

echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
cd client
npm install --include=dev

echo "Building client..."
./node_modules/.bin/vite build

echo "Build complete!"
