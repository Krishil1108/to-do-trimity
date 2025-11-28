const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const Notification = require('../models/Notification');

// VAPID Keys - In production, these should be environment variables
const vapidKeys = {
  publicKey: 'BFNVI-J2_zF_ZzZtk49ZwfFfq-HiePDgJRzXm2vP-ar2ABnfVI-wJmSKJTAyWKKZkRH-Og77s4_1ER-7fAES3xU',
  privateKey: 'ryUh3Js6fhVUJURfr1WOb8boWO7MbcIxjhMb7rvB7DU'
};

// Configure web-push
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// In-memory storage for subscriptions (in production, use a database)
const subscriptions = new Map();

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

// Create notification
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const newNotification = await notification.save();
    
    // Send push notification if user is subscribed
    await sendPushNotification(req.body.userId, {
      title: req.body.title || 'New Notification',
      body: req.body.message || '',
      data: { notificationId: newNotification._id }
    });
    
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

    // Store subscription
    subscriptions.set(userId, {
      subscription,
      userAgent: userAgent || 'Unknown',
      subscribedAt: new Date()
    });

    console.log(`User ${userId} subscribed to push notifications`);
    
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
  res.json({
    totalSubscriptions: subscriptions.size,
    subscriptions: Array.from(subscriptions.entries()).map(([userId, data]) => ({
      userId,
      subscribedAt: data.subscribedAt,
      userAgent: data.userAgent
    }))
  });
});

// Helper function to send push notifications
async function sendPushNotification(userId, notificationData) {
  try {
    const userSubscription = subscriptions.get(userId);
    
    if (!userSubscription) {
      return { 
        success: false, 
        error: 'User not subscribed to push notifications' 
      };
    }

    const payload = JSON.stringify({
      title: notificationData.title,
      body: notificationData.body || '',
      icon: notificationData.icon || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Cpath d="M25 50L40 65L75 30" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E',
      badge: notificationData.badge || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%236366f1"/%3E%3Cpath d="M25 50L40 65L75 30" stroke="white" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/svg%3E',
      tag: notificationData.tag || 'task-notification',
      data: notificationData.data || {},
      actions: notificationData.actions || [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });

    await webpush.sendNotification(userSubscription.subscription, payload);
    
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

module.exports = { router, sendPushNotification };
