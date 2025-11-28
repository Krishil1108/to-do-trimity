// Service Worker for Task Management System
const CACHE_NAME = 'task-manager-v5';
const urlsToCache = [
  '/'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Opened cache');
        
        // Cache essential resources one by one with error handling
        const cachePromises = urlsToCache.map(async (url) => {
          try {
            await cache.add(url);
            console.log(`Cached: ${url}`);
          } catch (error) {
            console.warn(`Failed to cache ${url}:`, error);
            // Continue with other resources even if one fails
          }
        });
        
        await Promise.all(cachePromises);
        console.log('Service Worker installed successfully');
        
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
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
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated and ready for push notifications');
      // Claim all clients to ensure this SW is used immediately
      return self.clients.claim();
    })
  );
});

// Push event listener for notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push event received in service worker:', event);
  console.log('Push data available:', !!event.data);
  
  let notificationData = {
    title: 'TriDo - Task Management',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'task-notification',
    requireInteraction: false, // Changed to false for better visibility
    silent: false,
    vibrate: [200, 100, 200]
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
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    vibrate: notificationData.vibrate || [200, 100, 200],
    actions: notificationData.actions || [
      { action: 'view', title: '👀 View' },
      { action: 'dismiss', title: '❌ Dismiss' }
    ],
    data: notificationData.data || {},
    timestamp: Date.now()
  };
  
  console.log('🔔 About to show notification with options:', notificationOptions);

  const showNotificationPromise = self.registration.showNotification(
    notificationData.title,
    notificationOptions
  ).then((result) => {
    console.log('✅ Notification displayed successfully via service worker');
    console.log('📱 Notification result:', result);
    
    // Check if there are any visible notifications
    return self.registration.getNotifications().then(notifications => {
      console.log('📋 Currently visible notifications:', notifications.length);
      notifications.forEach((notification, index) => {
        console.log(`📌 Notification ${index + 1}:`, {
          title: notification.title,
          body: notification.body,
          tag: notification.tag,
          timestamp: notification.timestamp
        });
      });
      return true;
    });
  }).catch((error) => {
    console.error('❌ Failed to show notification via service worker:', error);
    
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

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
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