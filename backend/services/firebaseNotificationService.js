const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

class FirebaseNotificationService {
  constructor() {
    this.initialized = false;
    this.admin = null;
    this.initialize();
  }

  initialize() {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
        path.join(__dirname, '../firebase-service-account.json');

      if (!fs.existsSync(serviceAccountPath)) {
        console.warn('⚠️  Firebase service account file not found. Push notifications will not work.');
        console.warn('   Please download firebase-service-account.json from Firebase Console');
        console.warn('   and place it in the backend/ directory.');
        return;
      }

      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      this.admin = admin;
      this.initialized = true;
      console.log('🔥 Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      console.warn('   Push notifications will not work until Firebase is properly configured');
    }
  }

  /**
   * Send push notification to a single device
   * @param {string} fcmToken - Firebase Cloud Messaging token
   * @param {object} notification - Notification data
   * @returns {Promise<object>}
   */
  async sendNotification(fcmToken, notification) {
    if (!this.initialized) {
      console.warn('Firebase not initialized. Skipping push notification.');
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const message = {
        notification: {
          title: notification.title || 'Task Update',
          body: notification.body || 'You have a new notification'
        },
        data: notification.data || {},
        token: fcmToken
      };

      const response = await this.admin.messaging().send(message);
      console.log('✅ Push notification sent:', response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {string[]} fcmTokens - Array of FCM tokens
   * @param {object} notification - Notification data
   * @returns {Promise<object>}
   */
  async sendMulticastNotification(fcmTokens, notification) {
    if (!this.initialized) {
      console.warn('Firebase not initialized. Skipping push notifications.');
      return { success: false, error: 'Firebase not initialized' };
    }

    if (!fcmTokens || fcmTokens.length === 0) {
      return { success: false, error: 'No FCM tokens provided' };
    }

    try {
      const message = {
        notification: {
          title: notification.title || 'Task Update',
          body: notification.body || 'You have a new notification'
        },
        data: notification.data || {},
        tokens: fcmTokens
      };

      const response = await this.admin.messaging().sendEachForMulticast(message);
      console.log(`✅ Push notifications sent: ${response.successCount}/${fcmTokens.length}`);
      
      if (response.failureCount > 0) {
        console.error('Failed tokens:', response.responses
          .filter(r => !r.success)
          .map((r, i) => ({ token: fcmTokens[i], error: r.error?.message })));
      }

      return { 
        success: true, 
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      console.error('❌ Error sending multicast notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send task assignment notification
   */
  async sendTaskNotification(fcmTokens, taskData) {
    const notification = {
      title: `New Task: ${taskData.title}`,
      body: `Assigned by ${taskData.assignedBy}. Due: ${taskData.dueDate || 'Not set'}`,
      data: {
        type: 'task_assigned',
        taskId: taskData.taskId?.toString() || '',
        projectId: taskData.projectId?.toString() || ''
      }
    };

    if (Array.isArray(fcmTokens)) {
      return await this.sendMulticastNotification(fcmTokens, notification);
    } else {
      return await this.sendNotification(fcmTokens, notification);
    }
  }

  /**
   * Send project notification
   */
  async sendProjectNotification(fcmTokens, projectData) {
    const notification = {
      title: `Project Update: ${projectData.name}`,
      body: projectData.message || 'You have been added to a project',
      data: {
        type: 'project_update',
        projectId: projectData.projectId?.toString() || ''
      }
    };

    if (Array.isArray(fcmTokens)) {
      return await this.sendMulticastNotification(fcmTokens, notification);
    } else {
      return await this.sendNotification(fcmTokens, notification);
    }
  }

  /**
   * Send task status update notification
   */
  async sendStatusUpdateNotification(fcmTokens, statusData) {
    const notification = {
      title: `Task Status Updated`,
      body: `${statusData.taskTitle} is now ${statusData.newStatus}`,
      data: {
        type: 'status_update',
        taskId: statusData.taskId?.toString() || '',
        status: statusData.newStatus
      }
    };

    if (Array.isArray(fcmTokens)) {
      return await this.sendMulticastNotification(fcmTokens, notification);
    } else {
      return await this.sendNotification(fcmTokens, notification);
    }
  }

  /**
   * Check if Firebase is initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

module.exports = new FirebaseNotificationService();
