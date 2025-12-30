# Frontend Deployment Guide for Render

This guide will help you deploy your React Task Management frontend to Render.

## Prerequisites

- GitHub account with your repository: `Krishil1108/to-do-trimity`
- Render account (sign up at [render.com](https://render.com))
- Backend deployed on Render: `https://to-do-trimity-backend.onrender.com`

## Step 1: Prepare Your Frontend

### 1.1 Verify Configuration

Your frontend is already configured to use the Render backend:

**File: `frontend/src/config.js`**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://to-do-trimity-backend.onrender.com/api';
export default API_URL;
```

## Step 1: Prepare Your Frontend

### 1.1 Verify Configuration

Your frontend is already configured to use the Render backend:

**File: `frontend/src/config.js`**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://to-do-trimity-backend.onrender.com/api';
export default API_URL;
```

### 1.2 Verify package.json Scripts

Make sure your `frontend/package.json` has these scripts:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### 1.3 Update Backend CORS

Update your backend to allow requests from Render frontend.

**In `backend/server.js`:**

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://to-do-trimity-frontend.onrender.com',
    'https://*.onrender.com'  // Allows all Render preview deploys
  ],
  credentials: true
}));
```

Push this change to GitHub to trigger automatic Render deployment.

## Step 2: Deploy Frontend on Render

### 2.1 Create New Static Site

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" button
3. Select "Static Site"

### 2.2 Connect Repository

1. Click "Connect account" to link your GitHub
2. Find and select `Krishil1108/to-do-trimity`
3. Click "Connect"

### 2.3 Configure Static Site

Fill in the following details:

**Basic Settings:**
- **Name**: `to-do-trimity-frontend` (or your preferred name)
- **Region**: Choose same as backend (for better performance)
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`

**Advanced Settings:**
- **Auto-Deploy**: Yes (enabled by default)

### 2.4 Add Environment Variables

Click "Advanced" and add environment variables:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://to-do-trimity-backend.onrender.com/api` |
| `NODE_VERSION` | `18` |

### 2.5 Deploy

1. Click "Create Static Site"
2. Render will automatically build and deploy your frontend
3. Wait for deployment to complete (usually 3-5 minutes)
4. You'll see a URL like: `https://to-do-trimity-frontend.onrender.com`

## Step 3: Verify Deployment

### 3.1 Test All Features

After deployment, verify:

- [ ] Login/Register functionality
- [ ] Create new tasks
- [ ] Edit/Delete tasks
- [ ] Task assignment
- [ ] Notifications
- [ ] Admin reports
- [ ] Excel/PDF export
- [ ] Filtering and search
- [ ] Mobile responsiveness

### 3.2 Check API Connectivity

Open browser console and verify:
- No CORS errors
- API requests going to Render backend
- Successful authentication

### 3.3 Test on Multiple Devices

- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Android)
- Tablet devices

## Step 4: Configure Redirects for React Router

Render static sites need special handling for client-side routing.

### 4.1 Add Redirects Configuration

Create `frontend/public/_redirects`:

```
/*    /index.html   200
```

This ensures React Router works properly when users refresh pages or access URLs directly.

### 4.2 Alternative: Add render.yaml (Optional)

Create `render.yaml` in project root for infrastructure-as-code:

```yaml
services:
  - type: web
    name: to-do-trimity-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: NODE_ENV
        value: production

  - type: static
    name: to-do-trimity-frontend
    env: static
    region: oregon
    plan: free
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/build
    envVars:
      - key: REACT_APP_API_URL
        value: https://to-do-trimity-backend.onrender.com/api
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

## Common Issues & Solutions

### Issue: "Failed to build"

**Solution:**
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version is 18 or compatible
- Check for missing environment variables

### Issue: "404 on page refresh"

**Solution:**
- Ensure `_redirects` file exists in `frontend/public/` folder
- Content should be: `/*    /index.html   200`
- Redeploy after adding the file

### Issue: "API calls failing with CORS error"

**Solution:**
- Add Render frontend URL to CORS allowed origins in backend
- Redeploy backend on Render
- Check browser console for exact error
- Verify backend URL in `config.js` is correct

### Issue: "Environment variables not working"

**Solution:**
- Ensure variables start with `REACT_APP_`
- Rebuild site after adding env variables
- Clear build cache and redeploy

### Issue: "White screen / blank page"

**Solution:**
- Check browser console for errors
- Verify `homepage` in `package.json` (should be "/" or omitted)
- Check build logs for compilation errors
- Ensure all routes are properly configured

## Automatic Deployments

Render automatically deploys when you push to GitHub:

1. Make changes to your code
2. Commit and push:
   ```powershell
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```
3. Render automatically detects changes and rebuilds
4. Check deployment status in Render Dashboard

## Build Optimization

### Disable Source Maps (Optional)

For faster builds and smaller bundle size:

**In `frontend/package.json`:**

```json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

For Windows (during local builds):

```json
{
  "scripts": {
    "build": "set \"GENERATE_SOURCEMAP=false\" && react-scripts build",
    "build:prod": "react-scripts build"
  }
}
```

Note: Render uses Linux, so the first format works on Render.

## Monitoring & Maintenance

### View Logs
- Dashboard → Your Static Site → Logs
- Shows build output and any errors

### Manually Redeploy
- Dashboard → Your Static Site → Manual Deploy
- Click "Clear build cache & deploy" if issues persist

### Environment Variables
- Dashboard → Your Static Site → Environment
- Can update anytime (triggers rebuild)

### Check Deployment Status
- Dashboard shows deploy status
- Green = successful
- Red = failed (click for logs)

## Free Tier Limitations

**Render Free Tier for Static Sites:**
- Free forever
- 100GB bandwidth/month
- Automatic HTTPS
- Custom domains supported
- Global CDN included

**Combined with Free Backend:**
- Both frontend and backend can run on free tier
- Backend spins down after 15 minutes inactivity
- First request after spin-down takes 30-60 seconds

## Custom Domain (Optional)

### Add Custom Domain

1. Go to Render Dashboard → Your Static Site
2. Click "Settings"
3. Scroll to "Custom Domain"
4. Click "Add Custom Domain"
5. Enter your domain name
6. Follow DNS configuration instructions

### DNS Configuration

Add CNAME record to your domain:
- **Type**: CNAME
- **Name**: www (or @)
- **Value**: Your Render URL

Render automatically provisions SSL certificates.

## Performance Tips

### 1. Enable Compression
Render automatically enables gzip compression for static files.

### 2. Optimize Images
- Use WebP format where possible
- Compress images before uploading
- Use lazy loading for images

### 3. Code Splitting
React automatically code-splits with dynamic imports:

```javascript
const AdminReports = React.lazy(() => import('./components/AdminReports'));
```

### 4. Caching
Render automatically sets cache headers for static assets.

## Deployment Checklist

**Pre-Deployment:**
- [ ] Backend deployed and working on Render
- [ ] Backend CORS configured with frontend URL
- [ ] Frontend `config.js` points to Render backend
- [ ] `_redirects` file added to `frontend/public/` folder
- [ ] All changes committed and pushed to GitHub

**Render Setup:**
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Build settings configured correctly
- [ ] Environment variables added
- [ ] Initial deployment successful

**Post-Deployment:**
- [ ] Site accessible via Render URL
- [ ] All features tested and working
- [ ] No console errors
- [ ] API connectivity verified
- [ ] Mobile responsiveness checked
- [ ] Page routing works on refresh

**Your Deployment URLs:**
- **Frontend**: `https://to-do-trimity-frontend.onrender.com`
- **Backend**: `https://to-do-trimity-backend.onrender.com`

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment)
- [Render Status Page](https://status.render.com)

## Rollback Deployment

If a deployment fails:

1. Go to Render Dashboard → Your Static Site
2. Click "Deploys" tab
3. Find a working deployment
4. Click "⋮" menu → "Redeploy"
5. Confirm rollback

## Quick Reference Commands

```powershell
# Test build locally
cd frontend
npm run build

# Serve build locally to test
npx serve -s build

# Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Deploy to Render"
git push origin main
```

---

*Last Updated: November 24, 2025*

Make sure your `frontend/package.json` has these scripts:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### 1.4 Create _redirects File (Alternative Method)

Create `frontend/public/_redirects`:

```
/*    /index.html   200
```

This ensures React Router works properly with page refreshes.

## Step 2: Update Backend CORS

Before deploying, update your backend to allow requests from Netlify.

**In `backend/server.js`:**

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://to-do-trimity.netlify.app',
    'https://*.netlify.app'  // Allows all Netlify preview deploys
  ],
  credentials: true
}));
```

Push this change to GitHub to trigger automatic Render deployment.

## Step 3: Deploy on Netlify

### Method 1: Deploy via Netlify Dashboard (Recommended)

#### 3.1 Create New Site

1. Log in to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Click "Deploy with GitHub"

#### 3.2 Authorize GitHub

1. Click "Authorize Netlify"
2. Grant access to your repositories
3. Search for and select `Krishil1108/to-do-trimity`

#### 3.3 Configure Build Settings

Fill in the following:

**Site Configuration:**
- **Site name**: `to-do-trimity` (or your preferred name)
- **Branch to deploy**: `main`
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/build`

**Advanced build settings** (Click "Show advanced"):

Add environment variables:
| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://to-do-trimity-backend.onrender.com/api` |

#### 3.4 Deploy

1. Click "Deploy site"
2. Wait for build to complete (usually 2-4 minutes)
3. Your site will be live at: `https://to-do-trimity.netlify.app`

### Method 2: Deploy via Netlify CLI

#### 3.1 Install Netlify CLI

```powershell
npm install -g netlify-cli
```

#### 3.2 Login to Netlify

```powershell
netlify login
```

This opens a browser window for authentication.

#### 3.3 Initialize and Deploy

```powershell
cd frontend
netlify init
```

Follow the prompts:
- Create & configure a new site
- Choose your team
- Enter site name: `to-do-trimity`
- Build command: `npm run build`
- Directory to deploy: `build`

#### 3.4 Deploy

```powershell
netlify deploy --prod
```

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain

1. Go to Netlify Dashboard → Your Site
2. Click "Domain settings"
3. Click "Add custom domain"
4. Enter your domain name
5. Follow DNS configuration instructions

### 4.2 Enable HTTPS

Netlify automatically provisions SSL certificates via Let's Encrypt.

## Step 5: Environment Variables

### 5.1 Add Environment Variables

1. Go to Site Settings → Environment Variables
2. Click "Add a variable"
3. Add:
   - Key: `REACT_APP_API_URL`
   - Value: `https://to-do-trimity-backend.onrender.com/api`

### 5.2 Using Environment Variables Locally

Create `frontend/.env` for local development:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Create `frontend/.env.production` for production:

```env
REACT_APP_API_URL=https://to-do-trimity-backend.onrender.com/api
```

**Important:** Add `.env` to `.gitignore`!

## Step 6: Continuous Deployment

Netlify automatically deploys when you push to GitHub:

1. Make changes to your code
2. Commit and push:
   ```powershell
   git add . 
   git commit -m "Update frontend"
   git push origin main
   ```
3. Netlify detects the push and builds automatically
4. Check deployment status in Netlify Dashboard

### 6.1 Deploy Previews

Netlify creates preview deployments for pull requests automatically.

### 6.2 Branch Deploys

Configure specific branches for deployment:
1. Site Settings → Build & Deploy → Deploy contexts
2. Add production/staging branches

## Step 7: Build Optimization

### 7.1 Optimize Build Performance

**In `frontend/package.json`:**

```json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

For Windows PowerShell:

```json
{
  "scripts": {
    "build": "set \"GENERATE_SOURCEMAP=false\" && react-scripts build"
  }
}
```

### 7.2 Enable Build Plugins

1. Go to Site Settings → Build & Deploy → Build plugins
2. Add useful plugins:
   - **Lighthouse**: Performance monitoring
   - **Checklinks**: Check for broken links
   - **A11y**: Accessibility testing

## Step 8: Performance & SEO

### 8.1 Add Headers for Security

Create `frontend/public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

/static/*
  Cache-Control: public, max-age=31536000, immutable
```

### 8.2 Configure Caching

In `netlify.toml`:

```toml
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

## Step 9: Monitoring & Analytics

### 9.1 Enable Netlify Analytics

1. Go to Site Settings → Analytics
2. Enable Netlify Analytics ($9/month)
3. View traffic, top pages, and sources

### 9.2 Add Google Analytics (Free Alternative)

**In `frontend/public/index.html`:**

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Step 10: Testing Deployment

### 10.1 Test All Features

After deployment, verify:

- [ ] Login/Register functionality
- [ ] Create new tasks
- [ ] Edit/Delete tasks
- [ ] Task assignment
- [ ] Notifications
- [ ] Admin reports
- [ ] Excel/PDF export
- [ ] Filtering and search
- [ ] Mobile responsiveness

### 10.2 Check API Connectivity

Open browser console and verify:
- No CORS errors
- API requests going to Render backend
- Successful authentication

### 10.3 Test on Multiple Devices

- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Android)
- Tablet devices

## Common Issues & Solutions

### Issue: "Failed to compile"

**Solution:**
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility (use Node 18)

### Issue: "404 on page refresh"

**Solution:**
- Ensure `_redirects` file exists in `public/` folder
- Or configure redirects in `netlify.toml`

### Issue: "API calls failing with CORS error"

**Solution:**
- Add Netlify URL to CORS allowed origins in backend
- Redeploy backend on Render
- Check browser console for exact error

### Issue: "Environment variables not working"

**Solution:**
- Ensure variables start with `REACT_APP_`
- Rebuild site after adding env variables
- Clear build cache and redeploy

### Issue: "Build timeout"

**Solution:**
- Optimize dependencies (remove unused packages)
- Disable source maps: `GENERATE_SOURCEMAP=false`
- Upgrade to paid Netlify plan for longer build times

## Netlify Features

### Free Tier Includes:
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Automatic HTTPS
- ✅ Continuous deployment
- ✅ Deploy previews
- ✅ Form handling
- ✅ Split testing
- ✅ Serverless functions

### Useful Commands

```powershell
# Check deployment status
netlify status

# View site in browser
netlify open

# View build logs
netlify watch

# Deploy manually
netlify deploy --prod

# List all sites
netlify sites:list

# Set environment variable
netlify env:set REACT_APP_API_URL "https://your-backend.onrender.com/api"
```

## Rollback Deployment

If a deployment fails:

1. Go to Netlify Dashboard → Deploys
2. Find a working deployment
3. Click "Publish deploy"
4. Confirm rollback

## Advanced Configuration

### Enable Build Hooks

Create webhook for triggering builds:

1. Site Settings → Build & Deploy → Build hooks
2. Click "Add build hook"
3. Name: "Rebuild Frontend"
4. Copy webhook URL
5. Use in CI/CD or manual triggers

### Configure Split Testing

Test different versions:

1. Go to Site Settings → Split Testing
2. Select branches to test
3. Set traffic distribution
4. Monitor performance

### Serverless Functions (Optional)

Create API endpoints on Netlify:

**Create `frontend/netlify/functions/hello.js`:**

```javascript
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from Netlify Functions!" })
  };
}
```

Access at: `https://your-site.netlify.app/.netlify/functions/hello`

## Deployment Checklist

**Pre-Deployment:**
- [ ] Backend deployed and working on Render
- [ ] Backend CORS configured with Netlify URL
- [ ] Frontend `config.js` points to Render backend
- [ ] `netlify.toml` created with build settings
- [ ] `_redirects` file added to `public/` folder
- [ ] All changes committed and pushed to GitHub

**Render Setup:**
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Build settings configured correctly
- [ ] Environment variables added
- [ ] Initial deployment successful

**Post-Deployment:**
- [ ] Site accessible via Render URL
- [ ] All features tested and working
- [ ] No console errors
- [ ] API connectivity verified
- [ ] Mobile responsiveness checked
- [ ] Page routing works on refresh

**Your Deployment URLs:**
- **Frontend**: `https://to-do-trimity-frontend.onrender.com`
- **Backend**: `https://to-do-trimity-backend.onrender.com`

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment)
- [Render Status Page](https://status.render.com)

## Rollback Deployment

If a deployment fails:

1. Go to Render Dashboard → Your Static Site
2. Click "Deploys" tab
3. Find a working deployment
4. Click "⋮" menu → "Redeploy"
5. Confirm rollback

## Quick Reference Commands

```powershell
# Test build locally
cd frontend
npm run build

# Serve build locally to test
npx serve -s build

# Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Deploy to Render"
git push origin main
```

---

*Last Updated: November 24, 2025*
