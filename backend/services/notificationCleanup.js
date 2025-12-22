const Notification = require('../models/Notification');

/**
 * Cleanup Service for automatic notification management
 * Handles deletion of old notifications and maintenance tasks
 */

/**
 * Delete notifications older than specified days
 * @param {number} daysOld - Number of days after which notifications should be deleted
 * @returns {Object} - Result of cleanup operation
 */
const deleteOldNotifications = async (daysOld = 30) => {
  try {
    console.log(`🧹 Starting notification cleanup for notifications older than ${daysOld} days...`);
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // Find and delete old notifications
    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    const deletedCount = result.deletedCount || 0;
    
    if (deletedCount > 0) {
      console.log(`✅ Notification cleanup completed: ${deletedCount} notifications deleted`);
      console.log(`📅 Deleted notifications created before: ${cutoffDate.toISOString()}`);
    } else {
      console.log(`✅ Notification cleanup completed: No old notifications found to delete`);
    }
    
    return {
      success: true,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      message: `Deleted ${deletedCount} notifications older than ${daysOld} days`
    };
  } catch (error) {
    console.error('❌ Notification cleanup failed:', error);
    return {
      success: false,
      error: error.message,
      deletedCount: 0
    };
  }
};

/**
 * Get statistics about notifications
 * @returns {Object} - Notification statistics
 */
const getNotificationStats = async () => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const [total, recent, old, unread] = await Promise.all([
      Notification.countDocuments({}),
      Notification.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Notification.countDocuments({ createdAt: { $lt: thirtyDaysAgo } }),
      Notification.countDocuments({ isRead: false })
    ]);
    
    return {
      total,
      recent7Days: recent,
      older30Days: old,
      unread,
      nextCleanupWillDelete: old
    };
  } catch (error) {
    console.error('❌ Failed to get notification stats:', error);
    return {
      total: 0,
      recent7Days: 0,
      older30Days: 0,
      unread: 0,
      nextCleanupWillDelete: 0,
      error: error.message
    };
  }
};

/**
 * Schedule automatic notification cleanup
 * Runs every 24 hours to clean up old notifications
 */
const scheduleNotificationCleanup = () => {
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  console.log('⏰ Scheduling automatic notification cleanup every 24 hours...');
  
  // Run initial cleanup after 5 minutes of server start
  setTimeout(async () => {
    console.log('🚀 Running initial notification cleanup...');
    await deleteOldNotifications(30);
  }, 5 * 60 * 1000); // 5 minutes
  
  // Schedule recurring cleanup
  setInterval(async () => {
    console.log('⏰ Running scheduled notification cleanup...');
    const result = await deleteOldNotifications(30);
    
    if (result.success && result.deletedCount > 0) {
      console.log(`📊 Cleanup summary: ${result.deletedCount} notifications removed`);
    }
  }, CLEANUP_INTERVAL);
  
  console.log('✅ Automatic notification cleanup scheduled successfully');
};

/**
 * Manual cleanup trigger (for testing or immediate cleanup)
 * @param {number} daysOld - Days threshold for deletion
 * @returns {Object} - Cleanup result
 */
const runManualCleanup = async (daysOld = 30) => {
  console.log(`🔧 Manual notification cleanup triggered for ${daysOld} days...`);
  return await deleteOldNotifications(daysOld);
};

module.exports = {
  deleteOldNotifications,
  getNotificationStats,
  scheduleNotificationCleanup,
  runManualCleanup
};