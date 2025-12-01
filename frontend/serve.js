const express = require('express');
const path = require('path');
const app = express();

// Serve static files with aggressive no-cache headers for service worker
app.use((req, res, next) => {
  // Don't cache service worker file or index.html
  if (req.url === '/sw.js' || req.url === '/service-worker.js' || req.url === '/index.html' || req.url === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    console.log(`🚫 No-cache headers set for: ${req.url}`);
  } else {
    // Cache other assets for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'build')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Frontend server running on port ${PORT}`);
  console.log(`📦 Serving from: ${path.join(__dirname, 'build')}`);
});
