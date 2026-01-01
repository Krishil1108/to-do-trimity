# Puppeteer Configuration for Render.com

## Problem
Puppeteer requires Chrome/Chromium to generate PDFs, but Render.com's default environment doesn't include it.

## Solution Options

### Option 1: Use Render's Native Build (Recommended for Free Tier)

1. **Add Chromium Buildpack** (Only available on paid plans)
   - Not available on free tier

### Option 2: Use Docker Deployment (Recommended)

Create a `Dockerfile` in the backend directory:

```dockerfile
FROM node:22-bookworm

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 5000

CMD ["npm", "start"]
```

Then in Render:
1. Go to your service settings
2. Change "Environment" from "Node" to "Docker"
3. Save and redeploy

### Option 3: Use Alternative PDF Library (Fallback)

If Docker deployment is not desired, revert to PDFKit-based PDF generation.

## Current Configuration

The `puppeteerPdfService.js` is configured to:
- Use system Chrome if `PUPPETEER_EXECUTABLE_PATH` environment variable is set
- Fall back to bundled Chromium if available
- Use production-safe flags: `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`

## Setting Environment Variables on Render

If using Docker:
1. Go to Render Dashboard → Your Service → Environment
2. Add: `PUPPETEER_EXECUTABLE_PATH` = `/usr/bin/chromium`
3. Save changes

## Testing Locally

The PDF generation works locally because:
- Puppeteer downloads Chromium automatically during `npm install`
- Your local machine has the necessary libraries

## Deployment Steps

1. **Commit Dockerfile** (if using Option 2):
   ```bash
   git add backend/Dockerfile
   git commit -m "feat: Add Docker support for Puppeteer on Render"
   git push origin main
   ```

2. **Update Render Service**:
   - Change environment to Docker
   - Render will auto-deploy

3. **Verify**:
   - Check deployment logs for "Chromium installed"
   - Test PDF generation endpoint

## Troubleshooting

**Error**: "Failed to launch the browser process"
- **Cause**: Chrome/Chromium not found
- **Fix**: Use Docker deployment or add PUPPETEER_EXECUTABLE_PATH

**Error**: "Could not find Chrome"
- **Cause**: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD was set to true
- **Fix**: Remove or set to false

**Error**: "Running as root without --no-sandbox"
- **Cause**: Security restriction
- **Fix**: Already handled with `--no-sandbox` flag in config
