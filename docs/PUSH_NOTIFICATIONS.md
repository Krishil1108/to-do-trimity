# Push Notifications Setup Guide

## Production Deployment

### Environment Variables Required

Add these environment variables to your production environment (Render, Heroku, etc.):

```bash
# Push Notification VAPID Keys
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=your-email@domain.com

# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# Server Configuration  
PORT=5000
NODE_ENV=production
```

### Generating New VAPID Keys

If you need to generate new VAPID keys:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the key generator:
   ```bash
   node generate-vapid-keys.js
   ```

3. Copy the generated keys to your environment variables

### Frontend Configuration

Update the VAPID public key in `frontend/src/services/notificationService.js`:

```javascript
const vapidPublicKey = 'YOUR_PUBLIC_KEY_HERE';
```

**Note:** The public key can be committed to version control, but NEVER commit the private key!

### Browser Support

The PWA push notifications work on:
- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 16.4+, macOS 13+)
- ✅ Edge (Desktop & Mobile)
- ✅ Opera (Desktop & Mobile)

### Testing Notifications

1. Deploy your application
2. Navigate to "Notification Settings" in the app
3. Click "Enable" to request permission
4. Use "Send Test" to verify notifications work
5. Assign a task to test automatic notifications

### Security Notes

- VAPID private keys should be kept secret
- Use environment variables for all sensitive keys
- Rotate keys periodically for enhanced security
- Monitor subscription endpoints for validity

### Troubleshooting

**Error: "Vapid private key should be 32 bytes long"**
- Generate new keys using the provided script
- Ensure no extra spaces or characters in environment variables

**Notifications not appearing:**
- Check browser notification permissions
- Verify VAPID keys match between frontend and backend
- Check browser console for errors
- Test on supported browsers

**PWA not installing:**
- Ensure HTTPS is enabled in production
- Check manifest.json is accessible
- Verify service worker is registered properly