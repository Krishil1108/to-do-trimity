const twilio = require('twilio');

// Initialize Twilio client with credentials from environment variables
let client;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio WhatsApp client initialized');
  } else {
    console.log('⚠️ Twilio credentials not found in environment variables');
  }
} catch (error) {
  console.error('❌ Error initializing Twilio client:', error);
}

/**
 * Send WhatsApp message using Twilio
 * @param {string} to - WhatsApp number (with country code, e.g., +919429064592)
 * @param {string} message - Message content
 * @returns {Promise<Object>} - Twilio message response
 */
const sendWhatsAppMessage = async (to, message) => {
  try {
    if (!client) {
      console.log('⚠️ Twilio client not initialized. WhatsApp message not sent.');
      return { success: false, error: 'Twilio client not initialized' };
    }

    // Ensure the number has the correct WhatsApp format
    const whatsappNumber = to.startsWith('whatsapp:') ? to : `whatsapp:+91${to}`;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio Sandbox number

    console.log(`📱 Sending WhatsApp message to ${whatsappNumber}`);
    
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: whatsappNumber
    });

    console.log('✅ WhatsApp message sent successfully:', response.sid);
    return { success: true, sid: response.sid, status: response.status };

  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send task completion notification via WhatsApp
 * @param {Object} taskDetails - Task information
 * @param {string} completedBy - Name of user who completed the task
 */
const sendTaskCompletionNotification = async (taskDetails, completedBy) => {
  try {
    const targetNumber = '8128228872'; // The number you specified
    
    const message = `🎉 *Task Completed!*

*Task:* ${taskDetails.title}
*Project:* ${taskDetails.project}
*Completed By:* ${completedBy}
*Completion Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
*Status:* ✅ Completed

${taskDetails.completionReason ? `*Reason:* ${taskDetails.completionReason}` : ''}

_Automated notification from Trido Task Management System_`;

    const result = await sendWhatsAppMessage(targetNumber, message);
    
    if (result.success) {
      console.log(`✅ Task completion WhatsApp notification sent for task: ${taskDetails.title}`);
    } else {
      console.error(`❌ Failed to send WhatsApp notification: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error in sendTaskCompletionNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send comprehensive owner notifications for all task activities
 * @param {string} notificationType - Type of notification (TASK_CREATED, TASK_STATUS_CHANGED, TASK_COMPLETED, SUBTASK_CREATED, TASK_DELETED)
 * @param {Object} data - Notification data
 */
const sendOwnerNotification = async (notificationType, data) => {
  try {
    const ownerNumber = '8128228872'; // Ketul Lathia's number
    let message = '';

    switch (notificationType) {
      case 'TASK_CREATED':
        message = `🆕 *New Task Created*

*Task:* ${data.taskTitle}
*Project:* ${data.project}
*Assigned To:* ${data.assignedTo}
*Created By:* ${data.createdBy}
*Priority:* ${data.priority || 'Medium'}
*Due Date:* ${data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-IN') : 'Not set'}
*Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

_Automated notification from Trido Task Management_`;
        break;

      case 'TASK_STATUS_CHANGED':
        message = `🔄 *Task Status Changed*

*Task:* ${data.taskTitle}
*Project:* ${data.project}
*Assigned To:* ${data.assignedTo}
*Status Change:* ${data.oldStatus} → ${data.newStatus}
*Changed By:* ${data.changedBy}
*Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

_Automated notification from Trido Task Management_`;
        break;

      case 'TASK_COMPLETED':
        message = `✅ *Task Completed*

*Task:* ${data.taskTitle}
*Project:* ${data.project}
*Assigned To:* ${data.assignedTo}
*Completed By:* ${data.completedBy}
*Completion Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
${data.completionReason ? `*Reason:* ${data.completionReason}` : ''}

_Automated notification from Trido Task Management_`;
        break;

      case 'SUBTASK_CREATED':
        message = `📋 *Subtask Created*

*Subtask:* ${data.subtaskTitle}
*Parent Task:* ${data.parentTaskTitle}
*Project:* ${data.project}
*Created By:* ${data.createdBy}
*Assigned To:* ${data.assignedTo}
*Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

_Automated notification from Trido Task Management_`;
        break;

      case 'TASK_DELETED':
        message = `🗑️ *Task Deleted*

*Task:* ${data.taskTitle}
*Project:* ${data.project}
*Was Assigned To:* ${data.assignedTo}
*Deleted By:* ${data.deletedBy}
*Previous Status:* ${data.status}
*Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

_Automated notification from Trido Task Management_`;
        break;

      default:
        console.log(`⚠️ Unknown notification type: ${notificationType}`);
        return { success: false, error: 'Unknown notification type' };
    }

    const result = await sendWhatsAppMessage(ownerNumber, message);
    
    if (result.success) {
      console.log(`✅ Owner WhatsApp notification sent - ${notificationType}: ${data.taskTitle || data.subtaskTitle}`);
    } else {
      console.error(`❌ Failed to send owner WhatsApp notification: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error in sendOwnerNotification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendTaskCompletionNotification,
  sendOwnerNotification
};