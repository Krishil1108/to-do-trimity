# Firebase Push Notifications Setup Instructions

## 🔥 Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** or select existing project
3. Enter project name: **"Trido Task Management"**
4. Enable Google Analytics (optional)
5. Click **"Create project"**

## 📱 Step 2: Add Web App to Firebase

1. In Firebase Console, click the **web icon (</>)** to add a web app
2. Enter app nickname: **"Trido Web App"**
3. **Check** "Also set up Firebase Hosting" (optional)
4. Click **"Register app"**
5. **COPY the Firebase config object** - you'll need this!

```javascript
// Firebase config will look like this:
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXX"
};
```

## 🔔 Step 3: Enable Cloud Messaging

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **"Cloud Messaging"** tab
3. Scroll down to **"Web Push certificates"**
4. Click **"Generate key pair"**
5. **COPY the VAPID key** (starts with "B...")

## 🔑 Step 4: Get Service Account Key (Backend)

1. In Firebase Console, go to **Project Settings** > **Service accounts**
2. Click **"Generate new private key"**
3. Click **"Generate key"** - a JSON file will download
4. **Save this file as `firebase-service-account.json`** in `backend/` folder
5. **⚠️ IMPORTANT**: Add this file to `.gitignore` (already done)

## 📝 Step 5: Update Environment Variables

### Backend (.env file):
Add to `backend/.env`:
```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Remove old Twilio variables (already removed)
```

### Frontend:
Create `frontend/.env` file:
```env
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
REACT_APP_FIREBASE_VAPID_KEY=B...
```

## ✅ Step 6: Verification

After completing these steps:
1. Restart backend server: `cd backend && npm start`
2. Restart frontend: `cd frontend && npm start`
3. You should see: "🔥 Firebase initialized successfully"
4. Users will be prompted to allow notifications

## 📚 Features Enabled

✅ **Real-time push notifications**
✅ **Works when app is closed**
✅ **Cross-platform (Desktop/Mobile)**
✅ **Notification history in app**
✅ **Automatic token management**

## 🔧 Troubleshooting

**Notifications not appearing?**
- Check browser notifications permission
- Ensure HTTPS (required for push notifications)
- Check browser console for errors

**"Firebase not initialized"?**
- Verify all environment variables are set
- Check firebase-service-account.json exists
- Restart servers

---

**Once you've completed these steps, let me know and I'll finalize the implementation!** 🚀
