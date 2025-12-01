const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const Notification = require('../models/Notification');

// VAPID Keys - Use environment variables in production
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BFNVI-J2_zF_ZzZtk49ZwfFfq-HiePDgJRzXm2vP-ar2ABnfVI-wJmSKJTAyWKKZkRH-Og77s4_1ER-7fAES3xU',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'ryUh3Js6fhVUJURfr1WOb8boWO7MbcIxjhMb7rvB7DU'
};

// Configure web-push
try {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:noreply@taskmanager.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log('✅ VAPID keys configured for push notifications');
} catch (error) {
  console.error('❌ Failed to configure VAPID keys:', error.message);
  console.log('💡 Run "node generate-vapid-keys.js" to generate new keys');
}

// In-memory storage for subscriptions (in production, use a database)
const subscriptions = new Map();

// Track recent notifications to prevent rapid duplicates (5-second window)
const recentNotifications = new Map();

// Get notifications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .populate('taskId')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread count
router.get('/user/:userId/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.params.userId, 
      isRead: false 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear all notifications for a user
router.delete('/user/:userId/clear-all', async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.params.userId });
    res.json({ 
      message: 'All notifications cleared successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auto-delete notifications older than 30 days
const deleteOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🗑️ Auto-deleted ${result.deletedCount} notifications older than 30 days`);
    }
  } catch (error) {
    console.error('Error auto-deleting old notifications:', error);
  }
};

// Run auto-delete every 24 hours
setInterval(deleteOldNotifications, 24 * 60 * 60 * 1000);
// Run once on server start
deleteOldNotifications();

// Create notification
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const newNotification = await notification.save();
    
    // Note: Push notifications are handled by the frontend via /send-push endpoint
    // This avoids duplicate notifications and gives frontend more control
    
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Push notification routes

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId, userAgent } = req.body;
    
    if (!subscription || !userId) {
      return res.status(400).json({ 
        error: 'Subscription and userId are required' 
      });
    }

    // Check if this subscription already exists to prevent duplicates
    const subscriptionEndpoint = subscription.endpoint;
    let existingUserId = null;
    
    // Look for existing subscription with same endpoint
    for (const [storedUserId, storedData] of subscriptions.entries()) {
      if (storedData.subscription.endpoint === subscriptionEndpoint) {
        existingUserId = storedUserId;
        break;
      }
    }
    
    // If subscription exists for different userId, remove the old one
    if (existingUserId && existingUserId !== userId) {
      console.log(`🔄 Removing duplicate subscription for ${existingUserId}, keeping ${userId}`);
      subscriptions.delete(existingUserId);
    }

    // Store subscription (will overwrite if same userId)
    subscriptions.set(userId, {
      subscription,
      userAgent: userAgent || 'Unknown',
      subscribedAt: new Date(),
      endpoint: subscriptionEndpoint
    });

    console.log(`✅ User ${userId} subscribed to push notifications`);
    console.log(`📊 Total unique subscriptions: ${subscriptions.size}`);
    
    // Send a welcome notification
    const payload = JSON.stringify({
      title: 'Notifications Enabled!',
      body: 'You will now receive push notifications for task updates.',
      icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Cpath d="M25 50L40 65L75 30" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E',
      tag: 'welcome-notification'
    });

    await webpush.sendNotification(subscription, payload);

    res.status(201).json({ 
      message: 'Subscription successful',
      success: true 
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({ 
      error: 'Failed to subscribe to notifications',
      success: false 
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'UserId is required' 
      });
    }

    // Remove subscription
    const removed = subscriptions.delete(userId);
    
    if (removed) {
      console.log(`User ${userId} unsubscribed from push notifications`);
      res.json({ 
        message: 'Unsubscribed successfully',
        success: true 
      });
    } else {
      res.status(404).json({ 
        error: 'Subscription not found',
        success: false 
      });
    }
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({ 
      error: 'Failed to unsubscribe from notifications',
      success: false 
    });
  }
});

// Send push notification to specific user
router.post('/send-push', async (req, res) => {
  try {
    const { userId, title, body, data, actions } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({ 
        error: 'UserId and title are required' 
      });
    }

    const result = await sendPushNotification(userId, {
      title,
      body: body || '',
      data: data || {},
      actions: actions || [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      error: 'Failed to send notification',
      success: false 
    });
  }
});

// Test push notification
router.post('/test-push', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'UserId is required' 
      });
    }

    const result = await sendPushNotification(userId, {
      title: 'Test Notification',
      body: 'This is a test notification from the Task Management System!',
      data: { type: 'test', timestamp: new Date().toISOString() }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send test notification',
      success: false 
    });
  }
});

// Get push notification stats
router.get('/push-stats', (req, res) => {
  const stats = {
    totalSubscriptions: subscriptions.size,
    subscriptionKeys: Array.from(subscriptions.keys()),
    subscriptions: Array.from(subscriptions.entries()).map(([userId, data]) => ({
      userId,
      subscribedAt: data.subscribedAt,
      userAgent: data.userAgent ? data.userAgent.substring(0, 50) + '...' : 'Unknown'
    }))
  };
  
  console.log('📊 Current push notification stats:', stats);
  res.json(stats);
});

// Helper function to send push notifications
async function sendPushNotification(userId, notificationData) {
  try {
    console.log(`📤 Attempting to send push notification to userId: ${userId}`);
    console.log(`📋 Available subscriptions:`, Array.from(subscriptions.keys()));
    
    let userSubscription = subscriptions.get(userId);
    
    if (!userSubscription) {
      console.log(`❌ No subscription found for userId: ${userId}`);
      return { 
        success: false, 
        error: `User not subscribed to push notifications. Available subscriptions: ${Array.from(subscriptions.keys()).join(', ')}` 
      };
    }
    
    // Check if we already sent this notification recently (prevent rapid-fire duplicates)
    const notificationKey = `${userId}_${notificationData.title}_${notificationData.body}`;
    const now = Date.now();
    const lastSent = recentNotifications.get(notificationKey);
    
    if (lastSent && (now - lastSent) < 5000) { // 5 second deduplication window
      console.log(`⏭️ Skipping duplicate notification for ${userId} (sent ${now - lastSent}ms ago)`);
      return { 
        success: true, 
        message: 'Duplicate notification skipped (too recent)' 
      };
    }
    
    // Record this notification
    recentNotifications.set(notificationKey, now);
    
    // Clean up old entries (keep only last 5 minutes)
    for (const [key, timestamp] of recentNotifications.entries()) {
      if (now - timestamp > 300000) { // 5 minutes
        recentNotifications.delete(key);
      }
    }
    
    console.log(`Found subscription for userId: ${userId}`);

    const payload = JSON.stringify({
      title: notificationData.title,
      body: notificationData.body || '',
      icon: notificationData.icon || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Cpath d="M25 50L40 65L75 30" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E',
      badge: notificationData.badge || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Cpath d="M25 50L40 65L75 30" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E',
      tag: (notificationData.tag || 'task-notification') + '_' + Date.now(),
      requireInteraction: true, // Force interaction like WhatsApp/Teams
      silent: false,
      vibrate: [300, 100, 300, 100, 300, 100, 300], // Strong vibration pattern
      renotify: true,
      persistent: true,
      data: {
        url: '/',
        timestamp: Date.now(),
        urgent: true,
        ...notificationData.data
      },
      actions: notificationData.actions || [
        { action: 'view', title: '👁️ Open Task', icon: '/favicon.ico' },
        { action: 'mark_read', title: '✅ Mark Read', icon: '/favicon.ico' },
        { action: 'dismiss', title: '❌ Dismiss', icon: '/favicon.ico' }
      ]
    });

    await webpush.sendNotification(userSubscription.subscription, payload);
    
    console.log(`Push notification sent successfully to userId: ${userId}`);
    return { 
      success: true, 
      message: 'Push notification sent successfully' 
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // If subscription is invalid, remove it
    if (error.statusCode === 410) {
      subscriptions.delete(userId);
    }
    
    return { 
      success: false, 
      error: 'Failed to send push notification' 
    };
  }
}

// WhatsApp-style burst active notification test
router.post('/burst-test', async (req, res) => {
  console.log('💥 Received burst test notification request');
  
  try {
    const { userId } = req.body;
    
    if (!userId) {
      // Send to all users if no specific user
      const allUsers = Array.from(subscriptions.keys());
      if (allUsers.length === 0) {
        return res.json({ success: false, message: 'No subscriptions found' });
      }
    }

    const notifications = [
      {
        title: '🚨 URGENT: Task Reminder',
        body: 'You have an important task due soon! This notification should be very noticeable.',
        vibrate: [500, 200, 500, 200, 500, 200, 500]
      },
      {
        title: '📋 Task Update Alert',
        body: 'Your task list has been updated - check it now!',
        vibrate: [200, 100, 200, 100, 400]
      },
      {
        title: '⚡ Quick Action Required',
        body: 'Tap to complete your pending task - just like WhatsApp!',
        vibrate: [300, 150, 300, 150, 300, 150, 600]
      }
    ];

    let totalSuccess = 0;
    const targetUsers = userId ? [userId] : Array.from(subscriptions.keys());
    
    // Send notifications with delays to simulate WhatsApp-style attention
    for (const [index, notif] of notifications.entries()) {
      setTimeout(async () => {
        for (const targetUserId of targetUsers) {
          try {
            const result = await sendPushNotification(targetUserId, {
              title: notif.title,
              body: notif.body,
              icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23ff6b35"/%3E%3Ctext x="50" y="60" font-size="40" text-anchor="middle" fill="white"%3E⚡%3C/text%3E%3C/svg%3E',
              tag: 'burst_' + index + '_' + Date.now(),
              vibrate: notif.vibrate,
              data: {
                burst: true,
                sequence: index + 1,
                total: notifications.length,
                urgent: true
              },
              actions: [
                { action: 'view', title: '👀 View Now', icon: '/favicon.ico' },
                { action: 'snooze', title: '⏰ Snooze 5min', icon: '/favicon.ico' },
                { action: 'dismiss', title: '🚫 Dismiss All', icon: '/favicon.ico' }
              ]
            });
            
            if (result.success) {
              totalSuccess++;
              console.log(`✅ Burst notification ${index + 1} sent to ${targetUserId}`);
            }
          } catch (error) {
            console.error(`❌ Burst notification ${index + 1} failed for ${targetUserId}:`, error);
          }
        }
      }, index * 3000); // Send every 3 seconds for maximum attention
    }

    res.json({ 
      success: true, 
      message: `Burst of ${notifications.length} WhatsApp-style active notifications initiated for ${targetUsers.length} user(s)`,
      targetUsers: targetUsers.length
    });
  } catch (error) {
    console.error('❌ Burst notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = { router, sendPushNotification };
