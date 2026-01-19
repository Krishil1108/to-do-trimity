# 🔔 Notification Setup Guide

## Overview
This task management system uses Firebase Cloud Messaging (FCM) to send real-time push notifications to all users when tasks are assigned, updated, or completed.

## How Notifications Work

### For All Users (test1, test2, and everyone else)
The notification system uses the **exact same logic and functionality** for all users. There is no special configuration for test1 or test2.

### Automatic Setup
1. **On Login**: When you log in, the system automatically attempts to register your device for push notifications
2. **FCM Token**: A unique token is generated for your device and saved to the backend
3. **Instant Notifications**: Once registered, you'll receive notifications immediately when:
   - A task is assigned to you
   - Someone updates a task you're involved with
   - A task status changes
   - Tasks are marked complete or overdue

## Enabling Notifications

### First Time Setup
1. Log in to the application
2. Your browser will show a permission prompt asking to allow notifications
3. Click **"Allow"** or **"Yes"**
4. Your device is now registered and ready to receive notifications!

### Manual Setup (if auto-setup didn't work)
1. Click the menu icon (☰) in the top navigation
2. Select **"Settings"** from the menu
3. In the Push Notifications section, click **"🔔 Enable Now"**
4. Allow permissions when prompted
5. Click **"🔄 Re-enable"** to force re-registration

### If Notifications Were Blocked
If you accidentally denied notification permission:

1. Look for the lock icon (🔒) or info icon (ⓘ) in your browser's address bar
2. Click it to open the site settings
3. Find "Notifications" in the permissions list
4. Change from "Block" to "Allow"
5. Refresh the page
6. Go to Settings → Push Notifications
7. Click **"🔔 Enable Now"**

## Troubleshooting

### Check Notification Status
1. Go to Settings (from the menu)
2. Look at the notification status banner:
   - ✅ **Green**: Notifications are working perfectly
   - ⚠️ **Yellow**: Notifications not set up yet
   - ❌ **Red**: Notifications are blocked

### Run Diagnostics
1. Go to Settings → Push Notifications
2. Click the **"🔍 Run Check"** button
3. A diagnostic report will show:
   - Browser permission status
   - Backend token registration status
   - Current token info
   - Specific issues (if any)

### Common Issues

**Problem**: "I'm not receiving notifications"
**Solution**: 
1. Run the diagnostic check
2. If backend token shows "NOT Registered", click "Re-enable"
3. Make sure browser permission is "granted"

**Problem**: "Notifications worked before but stopped"
**Solution**:
1. Go to Settings
2. Click "🔄 Re-enable" to refresh your FCM token
3. This re-registers your device with the backend

**Problem**: "I can't allow notifications in my browser"
**Solution**:
- Some browsers/devices don't support push notifications
- Check if you're using incognito/private mode (notifications don't work there)
- Try a different browser (Chrome, Firefox, Edge all support notifications)

## Test Notifications

### Send Test to Yourself
1. Go to Settings → Push Notifications
2. Click **"💥 Test Burst"** to send test notifications
3. You should receive 3 attention-grabbing notifications

### How to Know It's Working
When notifications are properly set up:
- You'll see "✓ Active" next to the Re-enable button
- The status banner will be green with ✅
- Test notifications will appear instantly
- Real task notifications will arrive in real-time

## Technical Details

### What Happens Behind the Scenes
1. **Service Worker**: Registers in your browser to listen for notifications
2. **FCM Token**: Generated uniquely for your device/browser combination
3. **Backend Registration**: Token is saved to your user profile in the database
4. **Notification Delivery**: When a task event happens, the backend sends a notification to your FCM token
5. **Display**: Your browser shows the notification even when the app isn't open

### Notification Types
- **Task Assigned**: When someone assigns a task to you
- **Task Updated**: When someone changes a task you're involved with
- **Task Completed**: When someone marks a task as complete
- **Task Overdue**: When a task becomes overdue
- **Status Changed**: When task status is updated

### Privacy & Security
- Notifications are end-to-end encrypted by Firebase
- Only you receive notifications for tasks assigned to you
- FCM tokens are securely stored in the database
- Tokens can be revoked/refreshed at any time

## For Developers

### Checking User Token Status
```javascript
// In browser console
const userId = 'user_id_here';
fetch(`/api/users/${userId}`)
  .then(r => r.json())
  .then(data => console.log('FCM Token:', data.fcmToken ? 'Registered ✓' : 'Not Registered ✗'));
```

### Force Token Refresh
1. Go to Settings
2. Click "🔄 Re-enable" - this forces a new token generation and backend save
3. Check console logs for confirmation

### Notification Service Logs
The system logs extensively to the browser console:
- `🔔` - Initialization events
- `✅` - Success messages
- `❌` - Errors
- `⚠️` - Warnings
- `📊` - Diagnostic information

## Summary

**The notification system works identically for ALL users.** If notifications are working for test1 and test2, they will work for everyone else who:
1. Allows browser notification permissions
2. Has their FCM token registered in the backend
3. Is using a compatible browser

If notifications aren't working, use the diagnostic tool in Settings to identify and fix the issue. The "Re-enable" button will force re-registration and fix most issues.
