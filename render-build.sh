#!/usr/bin/env bash
# Render build script

echo "Installing root dependencies..."
npm install --legacy-peer-deps

echo "Installing client dependencies..."
cd client
npm install --legacy-peer-deps

echo "Building client..."
npm run build

echo "Build complete!"
