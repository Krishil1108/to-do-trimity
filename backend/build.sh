#!/bin/bash

# Render build script for Puppeteer support

echo "📦 Installing dependencies..."
npm install

echo "🎨 Downloading Chromium for Puppeteer..."
# Force Puppeteer to download Chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false npm install puppeteer

echo "✅ Build complete!"
