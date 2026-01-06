// Firebase Cloud Messaging Service Worker
// Updated: January 6, 2026 - Enhanced notification system with duplicate prevention
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

// Track recent notifications to prevent duplicates
const recentNotifications = new Map();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'TriDo Notification';
  const notificationBody = payload.notification?.body || '';
  
  // Check for duplicate notifications (5-second window)
  const notificationKey = `${notificationTitle}_${notificationBody}`;
  const now = Date.now();
  const lastShown = recentNotifications.get(notificationKey);
  
  if (lastShown && (now - lastShown) < 5000) {
    console.log('⏭️ Skipping duplicate background notification');
    return;
  }
  
  // Record this notification
  recentNotifications.set(notificationKey, now);
  
  // Clean up old entries (older than 10 seconds)
  for (const [key, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > 10000) {
      recentNotifications.delete(key);
    }
  }

  const notificationOptions = {
    body: notificationBody,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `task-${payload.data?.taskId || 'default'}-${now}`, // Unique tag with timestamp
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    renotify: true,
    data: payload.data || {},
    actions: [
      { action: 'view', title: '👁️ View', icon: '/favicon.ico' },
      { action: 'dismiss', title: '❌ Dismiss', icon: '/favicon.ico' }
    ]
  };

  console.log('📢 Showing background notification:', notificationTitle);
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Firebase notification clicked:', event.action || 'default');
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open or focus the app when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Try to focus existing window first
          for (const client of clientList) {
            if (client.url.includes('trido') || client.url.includes('localhost')) {
              console.log('🎯 Focusing existing Firebase app window');
              return client.focus();
            }
          }
          // If no existing window, open new one
          console.log('🆕 Opening new Firebase app window');
          return clients.openWindow('/');
        })
    );
  } else if (event.action === 'dismiss') {
    console.log('❌ Firebase notification dismissed');
    return;
  }
});
