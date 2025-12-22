require('dotenv').config();
const mongoose = require('mongoose');
const { deleteOldNotifications, getNotificationStats } = require('./services/notificationCleanup');

async function testNotificationCleanup() {
  try {
    console.log('🧪 Testing Notification Cleanup System...\n');
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement');
    console.log('✅ Connected to MongoDB\n');
    
    // Get current statistics
    console.log('📊 Current Notification Statistics:');
    const statsBefore = await getNotificationStats();
    console.log('- Total notifications:', statsBefore.total);
    console.log('- Recent (7 days):', statsBefore.recent7Days);
    console.log('- Old (30+ days):', statsBefore.older30Days);
    console.log('- Unread:', statsBefore.unread);
    console.log('- Ready for cleanup:', statsBefore.nextCleanupWillDelete);
    console.log('');
    
    // Test cleanup with different thresholds
    console.log('🧹 Testing cleanup with 30-day threshold...');
    const result30Days = await deleteOldNotifications(30);
    console.log('Result:', result30Days);
    console.log('');
    
    // Test cleanup with 7-day threshold (for testing - don't use in production)
    console.log('🧹 Testing cleanup with 60-day threshold (more conservative)...');
    const result60Days = await deleteOldNotifications(60);
    console.log('Result:', result60Days);
    console.log('');
    
    // Get updated statistics
    console.log('📊 Updated Notification Statistics:');
    const statsAfter = await getNotificationStats();
    console.log('- Total notifications:', statsAfter.total);
    console.log('- Recent (7 days):', statsAfter.recent7Days);
    console.log('- Old (30+ days):', statsAfter.older30Days);
    console.log('- Unread:', statsAfter.unread);
    console.log('');
    
    console.log('✅ Notification cleanup test completed successfully!');
    console.log('💡 The cleanup system will run automatically every 24 hours');
    console.log('🔧 You can trigger manual cleanup via: POST /api/notifications/cleanup');
    console.log('📊 Check stats anytime via: GET /api/notifications/stats');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
}

// Run the test
testNotificationCleanup();