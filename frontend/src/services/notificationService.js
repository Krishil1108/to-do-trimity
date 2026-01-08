// Firebase Cloud Messaging Notification Service
import { messaging, getToken, onMessage } from '../firebase';

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
   * Save FCM token to backend
   */
  async saveFCMToken(userId, token) {
    try {
      const response = await fetch('/api/users/fcm-token', {
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
        console.log('✅ FCM token saved to backend');
        return true;
      } else {
        console.error('❌ Failed to save FCM token');
        return false;
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }

  /**
   * Initialize notification service
   */
  async initialize(userId) {
    try {
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('❌ This browser does not support notifications');
        return false;
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.log('❌ Service Worker not supported');
        return false;
      }

      // Request permission and get token
      const token = await this.requestPermission();
      
      if (token && userId) {
        await this.saveFCMToken(userId, token);
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

      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  }

  /**
   * Get current FCM token
   */
  getCurrentToken() {
    return this.currentToken;
  }
}

export default new NotificationService();
