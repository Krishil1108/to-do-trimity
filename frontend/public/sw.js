// Service Worker for Task Management System with Firebase Messaging and Background Keep-Alive
// AUTO-VERSIONED - Updates automatically on every deployment
const CACHE_VERSION = 'v7.5.0-' + Date.now(); // Added automatic browser-based background service
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

// Handle background messages from Firebase (SINGLE SOURCE OF TRUTH for notifications)
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Received background message:', payload);
  
  // Notify clients that a push notification was received
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PUSH_NOTIFICATION_RECEIVED',
        timestamp: Date.now()
      });
    });
  });

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: payload.data?.taskId || 'default',
    requireInteraction: true,
    vibrate: [300, 100, 300],
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

console.log('🚀 Service Worker starting with cache version:', CACHE_NAME);
console.log('⏰ Timestamp:', Date.now());

// IMMEDIATELY skip waiting - don't wait for old SW to close
self.skipWaiting();

// Force clear all old caches on startup and handle background keep-alive
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
  } else if (event.data && event.data.type === 'ENABLE_KEEP_ALIVE') {
    console.log('🚀 Enabling background keep-alive service');
    
    // Store keep-alive configuration
    self.keepAliveConfig = {
      serverUrl: event.data.serverUrl,
      interval: event.data.interval || 8 * 60 * 1000, // 8 minutes default
      enabled: true
    };
    
    // Start background keep-alive
    startBackgroundKeepAlive();
    
    event.ports[0]?.postMessage({ success: true });
  } else if (event.data && event.data.type === 'DISABLE_KEEP_ALIVE') {
    console.log('🛑 Disabling background keep-alive service');
    
    if (self.keepAliveConfig) {
      self.keepAliveConfig.enabled = false;
    }
    
    if (self.keepAliveIntervalId) {
      clearInterval(self.keepAliveIntervalId);
      self.keepAliveIntervalId = null;
    }
    
    event.ports[0]?.postMessage({ success: true });
  }
});

// Background Keep-Alive Service Implementation
function startBackgroundKeepAlive() {
  if (!self.keepAliveConfig || !self.keepAliveConfig.enabled) {
    return;
  }
  
  // Clear existing interval if any
  if (self.keepAliveIntervalId) {
    clearInterval(self.keepAliveIntervalId);
  }
  
  const performKeepAlive = async () => {
    if (!self.keepAliveConfig || !self.keepAliveConfig.enabled) {
      return;
    }
    
    try {
      console.log('🔄 Service Worker Keep-Alive: Pinging server...');
      
      const response = await fetch(`${self.keepAliveConfig.serverUrl}/api/health`, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        console.log('✅ SW Keep-Alive: Server ping successful');
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
    } catch (error) {
      console.warn('⚠️ SW Keep-Alive: Health check failed, trying wake-up ping:', error.message);
      
      try {
        const wakeResponse = await fetch(self.keepAliveConfig.serverUrl, {
          method: 'GET',
          cache: 'no-cache'
        });
        console.log('🔄 SW Keep-Alive: Wake-up ping sent');
      } catch (wakeError) {
        console.error('❌ SW Keep-Alive: All ping attempts failed:', wakeError.message);
      }
    }
  };
  
  // Immediate ping
  performKeepAlive();
  
  // Set up interval
  self.keepAliveIntervalId = setInterval(performKeepAlive, self.keepAliveConfig.interval);
  
  console.log(`⏰ SW Keep-Alive: Started with ${self.keepAliveConfig.interval / 60000} minute interval`);
}

// Handle background sync for mobile devices
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-keep-alive') {
    console.log('📱 Background sync: keep-alive triggered');
    event.waitUntil(
      (async () => {
        if (self.keepAliveConfig && self.keepAliveConfig.enabled) {
          try {
            const response = await fetch(`${self.keepAliveConfig.serverUrl}/api/health`);
            console.log('📱 Background sync keep-alive successful');
          } catch (error) {
            console.warn('📱 Background sync keep-alive failed:', error);
          }
        }
      })()
    );
  }
});

// Auto-start keep-alive if configuration exists
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated:', CACHE_VERSION);
  
  // Try to restore keep-alive configuration from storage
  event.waitUntil(
    (async () => {
      // Check if keep-alive should be restored
      try {
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
        }
      } catch (error) {
        console.warn('Failed to communicate with clients:', error);
      }
    })()
  );
  
  return self.clients.claim();
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