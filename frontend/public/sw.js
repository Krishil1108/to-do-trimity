// Service Worker for Task Management System with Firebase Messaging
// AUTO-VERSIONED - Updates automatically on every deployment
const CACHE_VERSION = 'v6.2.0-' + Date.now(); // Removed WhatsApp notifications feature
const CACHE_NAME = 'task-manager-' + CACHE_VERSION;
const urlsToCache = [
  '/'
];

// Import Firebase scripts for messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBmVWT4dd3m-H9Wf5ksBSmGA6AKiqk1Nkg",
  authDomain: "trido-11.firebaseapp.com",
  projectId: "trido-11",
  storageBucket: "trido-11.firebasestorage.app",
  messagingSenderId: "543027789224",
  appId: "1:543027789224:web:17b690b2db897268e7319d",
  measurementId: "G-K7ZTLYGQGC"
});

const messaging = firebase.messaging();

// Handle background messages from Firebase
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.taskId || 'default',
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

console.log('🚀 Service Worker starting with cache version:', CACHE_NAME);
console.log('⏰ Timestamp:', Date.now());

// IMMEDIATELY skip waiting - don't wait for old SW to close
self.skipWaiting();

// Force clear all old caches on startup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    console.log('🔄 Force cache update requested');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        console.log('✅ All old caches cleared');
        return self.clients.claim();
      })
    );
  }
});

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('⬇️ Service Worker installing...', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('📦 Opened cache:', CACHE_NAME);
        
        // Cache essential resources one by one with error handling
        const cachePromises = urlsToCache.map(async (url) => {
          try {
            await cache.add(url);
            console.log(`✅ Cached: ${url}`);
          } catch (error) {
            console.warn(`⚠️ Failed to cache ${url}:`, error);
            // Continue with other resources even if one fails
          }
        });
        
        await Promise.all(cachePromises);
        console.log('✅ Service Worker installed successfully:', CACHE_VERSION);
        
        // Force the waiting service worker to become the active service worker IMMEDIATELY
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
        // Still proceed with SW installation for push notifications
        return self.skipWaiting();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API calls for caching
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        // Fetch from network and cache for future use
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response for caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch((error) => {
              console.warn('Failed to cache response:', error);
            });
          
          return response;
        });
      })
      .catch((error) => {
        console.warn('Fetch failed:', error);
        // Return a fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating with version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('📦 Found caches:', cacheNames);
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ All old caches cleared');
      console.log('✅ Service Worker activated with latest version');
      // Claim all clients immediately to apply updates
      return self.clients.claim();
    }).then(() => {
      // Notify all clients about the update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: CACHE_VERSION,
            message: 'New version available - page will reload'
          });
        });
      });
    })
  );
});

// Push event listener for notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push event received in service worker:', event);
  console.log('Push data available:', !!event.data);
  
  // Notify clients that a push notification was received
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PUSH_NOTIFICATION_RECEIVED',
          timestamp: Date.now()
        });
      });
    })
  );
  
  let notificationData = {
    title: 'TriDo - Task Management',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'task-notification_' + Date.now(), // Force unique tags
    requireInteraction: true, // FORCE interaction like WhatsApp
    silent: false, // NEVER silent  
    vibrate: [500, 200, 500, 200, 500, 200, 500], // Strong vibration like WhatsApp
    renotify: true, // Always renotify
    sticky: true // Try to make persistent
  };

  // Parse push data
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('Parsed push data:', pushData);
      notificationData = { ...notificationData, ...pushData };
    } catch (e) {
      console.error('Failed to parse push data as JSON:', e);
      try {
        const textData = event.data.text();
        console.log('Push data as text:', textData);
        notificationData.body = textData;
      } catch (textError) {
        console.error('Failed to parse push data as text:', textError);
      }
    }
  } else {
    console.log('No push data received, using default notification');
  }

  console.log('Final notification data:', notificationData);

  // Log the exact notification options being used
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || '/favicon.ico',
    badge: notificationData.badge || '/favicon.ico',
    tag: notificationData.tag + '_' + Date.now(), // Unique tag to avoid replacement
    requireInteraction: true, // Force user interaction like WhatsApp
    silent: false, // Never silent
    vibrate: [300, 100, 300, 100, 300, 100, 300], // Strong vibration pattern
    renotify: true, // Re-alert even if notification exists
    persistent: true, // Stay visible
    actions: [
      { action: 'view', title: '👁️ Open Task', icon: '/favicon.ico' },
      { action: 'mark_read', title: '✅ Mark Read', icon: '/favicon.ico' },
      { action: 'dismiss', title: '❌ Dismiss', icon: '/favicon.ico' }
    ],
    data: {
      ...notificationData.data,
      url: '/', // URL to open when clicked
      timestamp: Date.now(),
      urgent: true
    },
    timestamp: Date.now(),
    // Make it more attention-grabbing
    dir: 'auto',
    lang: 'en'
  };
  
  console.log('🔔 About to show notification with options:', notificationOptions);

  const showNotificationPromise = self.registration.showNotification(
    notificationData.title,
    notificationOptions
  ).then((result) => {
    console.log('✅ AGGRESSIVE notification displayed successfully via service worker');
    console.log('📱 Notification result:', result);
    
    // Immediate verification that notification is actually visible
    setTimeout(() => {
      self.registration.getNotifications().then(notifications => {
        console.log('📋 VERIFICATION: Currently visible notifications:', notifications.length);
        
        // Auto-cleanup: Keep only the 5 most recent notifications
        if (notifications.length > 5) {
          console.log('🧹 Cleaning up old notifications (keeping 5 most recent)');
          
          // Sort by timestamp (most recent first)
          const sortedNotifications = notifications.sort((a, b) => {
            const timeA = a.data?.timestamp || a.timestamp || 0;
            const timeB = b.data?.timestamp || b.timestamp || 0;
            return timeB - timeA;
          });
          
          // Close older notifications
          for (let i = 5; i < sortedNotifications.length; i++) {
            sortedNotifications[i].close();
            console.log('🗑️ Closed old notification:', sortedNotifications[i].title);
          }
        }
        
        if (notifications.length === 0) {
          console.error('🚨 CRITICAL ISSUE: NO NOTIFICATIONS ARE VISIBLE TO USER!');
          console.error('🔧 BROWSER IS BLOCKING NOTIFICATIONS');
          console.error('💡 User must check:');
          console.error('   1. Browser Settings > Notifications > Allow');
          console.error('   2. Disable Do Not Disturb mode');
          console.error('   3. Check site permissions');
          console.error('   4. Try different browser or incognito mode');
          
        } else {
          console.log('🎉 SUCCESS: Notifications are VISIBLE to user!');
          const recentNotifications = Math.min(notifications.length, 5);
          for (let i = 0; i < recentNotifications; i++) {
            const notification = notifications[i];
            console.log(`📌 Visible notification ${i + 1}:`, {
              title: notification.title,
              body: notification.body,
              tag: notification.tag,
              timestamp: notification.timestamp
            });
          }
        }
      }).catch(err => console.error('❌ Failed to check notifications:', err));
    }, 1000);
    
    return true;
  }).catch((error) => {
    console.error('❌ AGGRESSIVE notification failed:', error);
    
    // Fallback: try showing a very basic notification
    console.log('🔄 Attempting fallback notification...');
    return self.registration.showNotification(
      'TriDo Notification',
      {
        body: 'You have a new notification',
        icon: '/favicon.ico',
        tag: 'fallback-notification',
        requireInteraction: false
      }
    ).then(() => {
      console.log('✅ Fallback notification displayed');
      return true;
    }).catch((fallbackError) => {
      console.error('❌ Even fallback notification failed:', fallbackError);
      return false;
    });
  });

  event.waitUntil(showNotificationPromise);
});

// Enhanced notification click event with focus and action handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action || 'default', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';
  
  if (event.action === 'view' || !event.action) {
    // Open the app and focus on it (like WhatsApp)
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Try to focus existing window first
          for (const client of clientList) {
            if (client.url.includes('trido-pm78.onrender.com') || client.url.includes('localhost')) {
              console.log('🎯 Focusing existing window');
              return client.focus();
            }
          }
          // If no existing window, open new one
          console.log('🆕 Opening new window');
          return clients.openWindow(urlToOpen).then(client => {
            if (client) {
              // Send message to the client about the notification
              client.postMessage({
                type: 'NOTIFICATION_CLICKED',
                data: notificationData
              });
            }
            return client;
          });
        })
    );
  } else if (event.action === 'mark_read') {
    // Mark as read without opening
    console.log('📖 Marking notification as read');
    // Could send API call here to mark as read
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('❌ Notification dismissed');
    return;
  }
});

// Handle notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification closed:', event.notification.tag);
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync data when back online
      fetch('/api/sync')
        .then(response => response.json())
        .then(data => console.log('Background sync completed:', data))
        .catch(err => console.log('Background sync failed:', err))
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Skipping waiting - activating new service worker immediately');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Clearing all caches on demand');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('✅ All caches cleared');
        // Notify client that cache is cleared
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});