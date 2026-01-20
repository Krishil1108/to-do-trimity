// Firebase Cloud Messaging Notification Service
import { messaging, getToken, onMessage } from '../firebase';
import API_URL from '../config';

class NotificationService {
  constructor() {
    this.vapidKey = 'BCJeQvXBjsMvFPQ9VJsoxrSIPbmAv89pstsnbd7Y0Ld2tQ-wSQG1QKir4bHiqvZx22JpIYjn52oOa5nOXHL634U';
    this.currentToken = null;
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return await this.getFCMToken();
      } else {
        console.log('❌ Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  /**
   * Get FCM token for this device
   */
  async getFCMToken() {
    try {
      // Make sure service worker is ready before getting token
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
      
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
      });

      if (token) {
        console.log('✅ FCM Token:', token);
        this.currentToken = token;
        return token;
      } else {
        console.log('❌ No registration token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Listen for foreground messages
   */
  onMessageListener() {
    return new Promise((resolve) => {
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        resolve(payload);
      });
    });
  }

  /**
   * Save FCM token to backend with retry logic
   */
  async saveFCMToken(userId, token, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📤 Saving FCM token to backend (attempt ${attempt}/${retries}) for user: ${userId}`);
        
        const response = await fetch(`${API_URL}/users/fcm-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            fcmToken: token
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ FCM token saved to backend successfully:', data);
          return { success: true, data };
        } else {
          // Try to get error details
          let errorData = {};
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            try {
              errorData = await response.json();
            } catch (e) {
              console.warn('Could not parse error response as JSON');
            }
          } else {
            const errorText = await response.text();
            errorData = { message: errorText || 'Unknown error' };
          }
          
          console.error(`❌ Failed to save FCM token (HTTP ${response.status}):`, errorData);
          
          // If not the last attempt, wait before retrying
          if (attempt < retries) {
            console.log(`⏳ Retrying in ${attempt} second(s)...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          }
        }
      } catch (error) {
        console.error(`❌ Error saving FCM token (attempt ${attempt}/${retries}):`, error);
        
        // If not the last attempt, wait before retrying
        if (attempt < retries) {
          console.log(`⏳ Retrying in ${attempt} second(s)...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }
    
    console.error('❌ Failed to save FCM token after all retry attempts');
    return { success: false, error: 'Failed after all retries' };
  }

  /**
   * Initialize notification service
   */
  async initialize(userId) {
    try {
      console.log(`🔔 Initializing notification service for user: ${userId}`);
      
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('❌ This browser does not support notifications');
        return { success: false, error: 'Browser does not support notifications' };
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.log('❌ Service Worker not supported');
        return { success: false, error: 'Service Worker not supported' };
      }

      // Check current permission status
      console.log(`📋 Current notification permission: ${Notification.permission}`);
      
      // Request permission and get token
      const token = await this.requestPermission();
      
      if (!token) {
        console.warn('⚠️ Could not get FCM token - user may have denied permission');
        return { success: false, error: 'Could not get FCM token' };
      }
      
      console.log(`🎫 FCM Token obtained: ${token.substring(0, 20)}...`);
      
      // Save token to backend with retry logic
      if (userId) {
        const saveResult = await this.saveFCMToken(userId, token);
        if (!saveResult.success) {
          console.error('⚠️ Failed to save FCM token to backend, but notifications may still work locally');
        }
      } else {
        console.warn('⚠️ No userId provided, skipping token save to backend');
      }

      // Listen for foreground messages and display them INSTANTLY
      onMessage(messaging, (payload) => {
        console.log('📬 Foreground message received (INSTANT):', payload);
        
        // Extract from data payload (we send data-only messages)
        const title = payload.data?.title || 'New Notification';
        const body = payload.data?.body || '';
        
        if (Notification.permission === 'granted') {
          const options = {
            body: body,
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: `task-${Date.now()}`, // Unique tag for instant display without grouping
            requireInteraction: false, // Don't require interaction for faster display
            silent: false, // Ensure notification makes sound
            vibrate: [200, 100, 200], // Vibration pattern for mobile
            data: payload.data
          };
          
          console.log('🔔 Showing foreground notification instantly:', title);
          new Notification(title, options);
        }
      });

      console.log('✅ Notification service initialized successfully');
      return { success: true, token };
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken() {
    return this.currentToken;
  }

  /**
   * Verify if user has FCM token registered in backend
   */
  async verifyUserToken(userId) {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('📋 User FCM token status:', {
          userId,
          hasToken: !!userData.fcmToken,
          tokenPreview: userData.fcmToken ? userData.fcmToken.substring(0, 20) + '...' : 'none'
        });
        return {
          success: true,
          hasToken: !!userData.fcmToken,
          token: userData.fcmToken
        };
      } else {
        console.error('❌ Failed to verify user token');
        return { success: false, hasToken: false };
      }
    } catch (error) {
      console.error('Error verifying user token:', error);
      return { success: false, hasToken: false, error: error.message };
    }
  }
}

export default new NotificationService();
