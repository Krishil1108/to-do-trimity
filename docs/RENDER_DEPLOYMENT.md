# Backend Deployment Guide for Render

This guide will help you deploy your MERN Task Management backend to Render.

## Prerequisites

- GitHub account with your repository: `Krishil1108/to-do-trimity`
- Render account (sign up at [render.com](https://render.com))
- MongoDB Atlas account for cloud database

## Step 1: Prepare Your Backend

### 1.1 Verify Environment Variables

Ensure your `backend/.env` file has these variables (don't commit this file):

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key
```

### 1.2 Update package.json

Make sure your `backend/package.json` has a start script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 1.3 Add Production-Ready Code

Ensure your `server.js` uses the PORT from environment variables:

```javascript
const PORT = process.env.PORT || 5000;
```

## Step 2: Set Up MongoDB Atlas (Cloud Database)

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up or log in

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select a cloud provider and region (choose one close to your Render region)
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Set username and password (save these!)
   - Select "Read and write to any database"
   - Click "Add User"

4. **Whitelist IP Addresses**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string (looks like `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
   - Replace `<password>` with your actual password
   - Add your database name after `.net/`: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority`

## Step 3: Deploy Backend on Render

### 3.1 Create New Web Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" button
3. Select "Web Service"

### 3.2 Connect Repository

1. Click "Connect account" to link your GitHub
2. Find and select `Krishil1108/to-do-trimity`
3. Click "Connect"

### 3.3 Configure Web Service

Fill in the following details:

**Basic Settings:**
- **Name**: `todo-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select **Free** tier

### 3.4 Add Environment Variables

Click "Advanced" and add environment variables:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Your JWT secret (create a random string) |
| `PORT` | `5000` |

**Important:** Don't include quotes around the values!

### 3.5 Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your backend
3. Wait for deployment to complete (usually 2-5 minutes)
4. You'll see a URL like: `https://todo-backend.onrender.com`

## Step 4: Verify Deployment

### 4.1 Test API Endpoints

Use your browser or Postman to test:

```
GET https://todo-backend.onrender.com/api/health
GET https://todo-backend.onrender.com/api/tasks
```

### 4.2 Check Logs

- Go to your service in Render Dashboard
- Click "Logs" tab to see server output
- Look for "Server running on port 5000" message

## Step 5: Update Frontend Configuration

Update your frontend to use the Render backend URL:

**In `frontend/src/App.js` or API configuration file:**

```javascript
// Change from:
const API_BASE_URL = 'http://localhost:5000';

// To:
const API_BASE_URL = 'https://todo-backend.onrender.com';
```

Or use environment variables:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

## Step 6: Configure CORS

Ensure your backend allows requests from your frontend domain.

**In `backend/server.js`:**

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.netlify.app',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true
}));
```

After making changes, push to GitHub and Render will auto-deploy.

## Common Issues & Solutions

### Issue: "Application failed to respond"

**Solution:**
- Check your start command is `npm start`
- Verify `server.js` uses `process.env.PORT`
- Check logs for errors

### Issue: "Cannot connect to MongoDB"

**Solution:**
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check MONGO_URI is correct (no extra spaces)
- Ensure database user has proper permissions

### Issue: "Module not found"

**Solution:**
- Ensure all dependencies are in `package.json`
- Check build command is `npm install`
- Try manual redeploy in Render dashboard

### Issue: "CORS errors"

**Solution:**
- Add frontend URL to CORS allowed origins
- Ensure credentials: true if using cookies
- Redeploy after changes

## Free Tier Limitations

**Render Free Tier:**
- Spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month (enough for one service 24/7)

**Tip:** To keep service alive, use a service like [UptimeRobot](https://uptimerobot.com) to ping your API every 10 minutes.

## Automatic Deployments

Render automatically deploys when you push to the `main` branch:

1. Make changes to backend code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update backend"
   git push
   ```
3. Render automatically detects changes and redeploys
4. Check deployment status in Render Dashboard

## Monitoring & Maintenance

### View Logs
- Dashboard → Your Service → Logs
- Shows real-time server output
- Useful for debugging

### Manually Redeploy
- Dashboard → Your Service → Manual Deploy → Deploy latest commit

### Environment Variables
- Dashboard → Your Service → Environment
- Can update anytime (requires redeploy)

### Metrics
- Dashboard → Your Service → Metrics
- Shows CPU, Memory, Request count

## Next Steps

1. **Deploy Frontend**: Deploy your React frontend on Netlify or Vercel
2. **Custom Domain**: Add custom domain in Render settings (paid plans)
3. **Database Backups**: Set up automated backups in MongoDB Atlas
4. **Monitoring**: Set up error tracking with Sentry or LogRocket
5. **Upgrade Plan**: Consider paid plans for better performance and no spin-down

## Support Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Render Community Forum](https://community.render.com)

---

**Deployment Checklist:**

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string obtained
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Web service configured
- [ ] Environment variables added
- [ ] Service deployed successfully
- [ ] API endpoints tested
- [ ] Frontend updated with backend URL
- [ ] CORS configured properly

**Your Backend URL:** `https://todo-backend.onrender.com` (replace with your actual URL)

---

*Last Updated: November 24, 2025*
