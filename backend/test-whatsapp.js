require('dotenv').config();
const { sendTaskCompletionNotification } = require('./services/whatsappService');

async function testWhatsAppNotification() {
  console.log('🧪 Testing WhatsApp notification...');
  
  // Sample task data for testing
  const testTaskDetails = {
    title: 'Test Task - WhatsApp Integration',
    project: 'WhatsApp Integration Project',
    completionReason: 'Testing the WhatsApp notification system'
  };
  
  const completedBy = 'Krishil Shah (Test User)';
  
  try {
    const result = await sendTaskCompletionNotification(testTaskDetails, completedBy);
    
    if (result.success) {
      console.log('✅ WhatsApp test message sent successfully!');
      console.log('Message SID:', result.sid);
      console.log('Status:', result.status);
    } else {
      console.log('❌ WhatsApp test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error during WhatsApp test:', error);
  }
}

// Run the test
testWhatsAppNotification();