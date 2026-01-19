#!/usr/bin/env bash
# Render build script

echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
cd client
npm install

echo "Building client..."
npx vite build

echo "Build complete!"
