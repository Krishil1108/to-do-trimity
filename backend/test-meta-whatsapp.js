/**
 * Test script for Meta WhatsApp Business API integration
 * Run with: node test-meta-whatsapp.js
 */

require('dotenv').config();
const metaWhatsAppService = require('./services/metaWhatsAppService');

// Test configuration
const TEST_PHONE = process.env.TEST_WHATSAPP_NUMBER || '+1234567890'; // Replace with your actual test number

async function runTests() {
  console.log('🧪 Starting Meta WhatsApp API Tests\n');
  console.log('Configuration:');
  console.log('- Access Token:', process.env.META_WHATSAPP_ACCESS_TOKEN ? '✓ Set' : '✗ Missing');
  console.log('- Phone Number ID:', process.env.META_WHATSAPP_PHONE_NUMBER_ID ? '✓ Set' : '✗ Missing');
  console.log('- API Version:', process.env.META_WHATSAPP_API_VERSION || 'v18.0 (default)');
  console.log('- Test Number:', TEST_PHONE);
  console.log('\n');

  // Test 1: Simple Message
  console.log('📝 Test 1: Sending simple text message...');
  const test1 = await metaWhatsAppService.sendMessage(
    TEST_PHONE,
    'Hello from Task Management System! This is a test message.'
  );
  console.log('Result:', test1.success ? '✅ Success' : '❌ Failed');
  if (!test1.success) console.log('Error:', test1.error);
  console.log('\n');

  // Wait a bit between messages
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Task Assignment Notification
  console.log('📝 Test 2: Sending task assignment notification...');
  const test2 = await metaWhatsAppService.sendTaskNotification(
    TEST_PHONE,
    {
      title: 'Complete Quarterly Report',
      description: 'Review and submit Q4 financial report',
      assignedBy: 'John Manager',
      priority: 'High',
      status: 'Pending'
    },
    'assigned'
  );
  console.log('Result:', test2.success ? '✅ Success' : '❌ Failed');
  if (!test2.success) console.log('Error:', test2.error);
  console.log('\n');

  // Wait a bit between messages
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Task Completion Notification
  console.log('📝 Test 3: Sending task completion notification...');
  const test3 = await metaWhatsAppService.sendTaskNotification(
    TEST_PHONE,
    {
      title: 'Complete Quarterly Report',
      completedBy: 'Jane Employee'
    },
    'completed'
  );
  console.log('Result:', test3.success ? '✅ Success' : '❌ Failed');
  if (!test3.success) console.log('Error:', test3.error);
  console.log('\n');

  // Wait a bit between messages
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Task Update Notification
  console.log('📝 Test 4: Sending task update notification...');
  const test4 = await metaWhatsAppService.sendTaskNotification(
    TEST_PHONE,
    {
      title: 'Complete Quarterly Report',
      status: 'In Progress'
    },
    'updated'
  );
  console.log('Result:', test4.success ? '✅ Success' : '❌ Failed');
  if (!test4.success) console.log('Error:', test4.error);
  console.log('\n');

  // Summary
  console.log('📊 Test Summary:');
  const results = [test1, test2, test3, test4];
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}/4`);
  console.log(`❌ Failed: ${failed}/4`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! WhatsApp integration is working correctly.');
  } else if (passed === 0) {
    console.log('\n⚠️  All tests failed. Please check your configuration:');
    console.log('1. Verify META_WHATSAPP_ACCESS_TOKEN in .env file');
    console.log('2. Verify META_WHATSAPP_PHONE_NUMBER_ID in .env file');
    console.log('3. Ensure your test phone number is in international format (+1234567890)');
    console.log('4. Check if your phone number is added to your WhatsApp Business account');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
