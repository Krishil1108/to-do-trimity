// Notification Service for PWA Push Notifications
import API_URL from '../config';

class NotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Initialize the notification service
  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      console.log('Registering service worker...');
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', this.registration);
      
      // Wait for service worker to be ready
      console.log('Waiting for service worker to be ready...');
      const registration = await navigator.serviceWorker.ready;
      this.registration = registration;
      console.log('Service Worker is ready:', registration);
      
      // Wait a bit for the service worker to fully activate
      if (registration.active) {
        console.log('Service Worker is active and ready for push notifications');
        return true;
      } else {
        console.log('Waiting for Service Worker to activate...');
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn('Service Worker activation timeout');
            resolve(true); // Still resolve to allow push functionality
          }, 5000);
          
          const checkActivation = () => {
            if (registration.active) {
              clearTimeout(timeout);
              console.log('Service Worker activated successfully');
              resolve(true);
            }
          };
          
          // Check immediately
          checkActivation();
          
          // Listen for state changes
          registration.addEventListener('statechange', checkActivation);
        });
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      // Still return true to allow basic notification functionality
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      return false;
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    return permission === 'granted';
  }

  // Check if notifications are supported and permitted
  isNotificationSupported() {
    return this.isSupported && Notification.permission === 'granted';
  }

  // Subscribe to push notifications
  async subscribeToPush() {
    if (!this.registration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      // Ensure service worker is ready and active
      await navigator.serviceWorker.ready;
      
      // Wait a bit more to ensure the service worker is fully active
      if (!this.registration.active) {
        console.log('Waiting for service worker to activate...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        this.subscription = existingSubscription;
        console.log('Using existing subscription:', existingSubscription);
        return existingSubscription;
      }

      // Create new subscription
      const vapidPublicKey = 'BFNVI-J2_zF_ZzZtk49ZwfFfq-HiePDgJRzXm2vP-ar2ABnfVI-wJmSKJTAyWKKZkRH-Og77s4_1ER-7fAES3xU';
      
      console.log('Creating new push subscription...');
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });

      this.subscription = subscription;
      console.log('Push subscription created successfully:', subscription);
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      
      // If it's an AbortError, try once more after a delay
      if (error.name === 'AbortError') {
        console.log('Retrying subscription after service worker activation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const retrySubscription = await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array('BFNVI-J2_zF_ZzZtk49ZwfFfq-HiePDgJRzXm2vP-ar2ABnfVI-wJmSKJTAyWKKZkRH-Og77s4_1ER-7fAES3xU')
          });
          
          this.subscription = retrySubscription;
          await this.sendSubscriptionToServer(retrySubscription);
          return retrySubscription;
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      }
      
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush() {
    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromServer();
      this.subscription = null;
      console.log('Unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (!user) {
        console.error('No user logged in');
        return;
      }

      console.log('Subscribing user to push notifications:', {
        username: user.username,
        _id: user._id,
        name: user.name
      });

      // Subscribe with both username and _id to ensure compatibility
      const subscriptionRequests = [];
      
      // Primary subscription with username
      subscriptionRequests.push(
        fetch(`${API_URL}/notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userId: user.username,
            userAgent: navigator.userAgent
          })
        })
      );
      
      // Secondary subscription with _id if available
      if (user._id && user._id !== user.username) {
        subscriptionRequests.push(
          fetch(`${API_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              subscription: subscription.toJSON(),
              userId: user._id,
              userAgent: navigator.userAgent
            })
          })
        );
      }
      
      const results = await Promise.allSettled(subscriptionRequests);
      console.log('Subscription results:', results);
      
      // Check if at least one succeeded
      const hasSuccess = results.some(result => result.status === 'fulfilled' && result.value.ok);
      if (!hasSuccess) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (!user) return;

      await fetch(`${API_URL}/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user._id || user.username
        })
      });
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  // Show local notification using service worker
  async showLocalNotification(title, options = {}) {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      if (this.registration) {
        // Use service worker to show notification (recommended when SW is active)
        console.log('Showing notification via service worker:', title);
        return await this.registration.showNotification(title, {
          body: options.body || 'Task Management notification',
          icon: options.icon || '/favicon.ico',
          badge: options.badge || '/favicon.ico',
          tag: options.tag || 'task-notification',
          requireInteraction: false,
          silent: false,
          vibrate: [200, 100, 200],
          data: options.data || {},
          ...options
        });
      } else {
        // Fallback to direct notification (when SW not available)
        console.log('Showing notification directly (no SW):', title);
        const notification = new Notification(title, {
          body: options.body || 'Task Management notification',
          icon: options.icon || '/favicon.ico',
          tag: options.tag || 'task-notification',
          ...options
        });

        // Auto close after 5 seconds if not clicked
        setTimeout(() => {
          notification.close();
        }, 5000);

        return notification;
      }
    } catch (error) {
      console.error('Error showing local notification:', error);
      return null;
    }
  }

  // Test notification
  async testNotification() {
    if (!this.isNotificationSupported()) {
      alert('Notifications are not supported or not permitted');
      return;
    }

    console.log('🧪 Testing notification system...');
    
    // Check notification permission status
    console.log('📋 Notification permission:', Notification.permission);
    
    // Check if browser supports notifications
    console.log('🌐 Browser support check:', {
      notificationSupport: 'Notification' in window,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      pushManagerSupport: 'PushManager' in window
    });
    
    // Check current visible notifications
    if (this.registration) {
      try {
        const notifications = await this.registration.getNotifications();
        console.log('📱 Currently visible notifications:', notifications.length);
        notifications.forEach((notification, index) => {
          console.log(`📌 Visible notification ${index + 1}:`, {
            title: notification.title,
            body: notification.body,
            tag: notification.tag
          });
        });
      } catch (error) {
        console.log('❌ Could not get visible notifications:', error);
      }
    }

    console.log('🚀 Showing test notification...');
    const result = await this.showLocalNotification('🧪 Test Notification', {
      body: 'This is a test notification from Task Manager! If you can see this, notifications are working.',
      requireInteraction: true, // Force it to stay visible
      silent: false,
      vibrate: [200, 100, 200, 100, 200]
    });
    
    if (result) {
      console.log('✅ Test notification API call successful');
      
      // Wait a moment and check if notification is visible
      setTimeout(async () => {
        if (this.registration) {
          try {
            const notifications = await this.registration.getNotifications();
            console.log('📊 Notifications after test:', notifications.length);
            if (notifications.length === 0) {
              console.warn('⚠️ Notification was created but is not visible - likely suppressed by browser/device settings');
              alert('🔔 Notification was sent but may be suppressed by your device settings. Please check:\n\n1. Browser notification settings for this site\n2. Device "Do Not Disturb" mode\n3. System notification settings');
            } else {
              console.log('✅ Notification is visible in the system');
            }
          } catch (error) {
            console.log('Could not check notification visibility:', error);
          }
        }
      }, 1000);
    } else {
      console.error('❌ Failed to show test notification');
    }
  }

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Re-register existing subscription with backend (for server restarts)
  async reRegisterSubscription() {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        console.log('Found existing subscription, re-registering with backend...');
        await this.sendSubscriptionToServer(subscription);
        return true;
      } else {
        console.log('No existing subscription found');
        return false;
      }
    } catch (error) {
      console.error('Error re-registering subscription:', error);
      return false;
    }
  }

  // Get subscription status
  async getSubscriptionStatus() {
    if (!this.registration) {
      return { subscribed: false, supported: this.isSupported };
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return {
        subscribed: !!subscription,
        supported: this.isSupported,
        permission: Notification.permission
      };
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { subscribed: false, supported: this.isSupported };
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;