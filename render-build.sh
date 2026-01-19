#!/usr/bin/env bash
# Render build script

echo "Installing root dependencies..."
npm install

echo "Installing client dependencies..."
cd client
npm install

echo "Building client..."
npm run build

echo "Build complete!"
