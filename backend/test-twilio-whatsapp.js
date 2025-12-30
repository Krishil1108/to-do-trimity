require('dotenv').config();
const twilioWhatsAppService = require('./services/twilioWhatsAppService');

async function testWhatsApp() {
  console.log('🧪 Testing Twilio WhatsApp Integration\n');
  
  const testPhone = '+919429064592'; // Your phone number
  
  // Check configuration
  console.log('📋 Configuration Check:');
  console.log('- Account SID:', process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '✗ Missing');
  console.log('- Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '✗ Missing');
  console.log('- From Number:', process.env.TWILIO_WHATSAPP_FROM || '✗ Missing');
  console.log('- Test Phone:', testPhone);
  console.log('');
  
  try {
    // Test 1: Simple message
    console.log('🔔 Test 1: Sending simple message...');
    const test1 = await twilioWhatsAppService.sendMessage(
      testPhone,
      '👋 Hello! This is a test message from Trido Task Management System. Your WhatsApp notifications are now working!'
    );
    console.log('✅ Simple message sent successfully!');
    console.log('   Message SID:', test1.messageSid);
    console.log('');
    
    // Wait a bit before next message
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Task notification (simulated)
    console.log('📋 Test 2: Sending task notification...');
    const mockTask = {
      title: 'Complete Project Documentation',
      description: 'Update all documentation files with latest changes',
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      priority: 'High',
      status: 'pending'
    };
    
    const test2 = await twilioWhatsAppService.sendTaskNotification(
      testPhone,
      mockTask,
      'assigned'
    );
    console.log('✅ Task notification sent successfully!');
    console.log('   Message SID:', test2.messageSid);
    console.log('');
    
    // Wait a bit before next message
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Custom notification
    console.log('🎨 Test 3: Sending custom notification...');
    const test3 = await twilioWhatsAppService.sendCustomNotification(
      testPhone,
      {
        title: 'System Notification',
        body: 'Your Trido WhatsApp notification system is now fully operational and ready to use!',
        footer: '🚀 Powered by Trido Task Management',
        emoji: '✨'
      }
    );
    console.log('✅ Custom notification sent successfully!');
    console.log('   Message SID:', test3.messageSid);
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    console.log('📱 Check your WhatsApp for the messages.');
    console.log('');
    console.log('💡 Note: If you haven\'t joined the Twilio Sandbox:');
    console.log('   1. Send "join <your-code>" to whatsapp:+14155238886');
    console.log('   2. You should receive a confirmation message');
    console.log('   3. Then you can receive messages from the system');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('1. Verify TWILIO_ACCOUNT_SID in .env file');
    console.error('2. Verify TWILIO_AUTH_TOKEN in .env file');
    console.error('3. Verify TWILIO_WHATSAPP_FROM in .env file');
    console.error('4. Ensure you have joined the Twilio WhatsApp Sandbox');
    console.error('5. Check your Twilio account balance');
  }
  
  process.exit(0);
}

testWhatsApp();
