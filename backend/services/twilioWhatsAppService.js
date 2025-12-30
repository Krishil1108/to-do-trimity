const twilio = require('twilio');

class TwilioWhatsAppService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_WHATSAPP_FROM;
    
    if (!this.accountSid || !this.authToken || !this.from) {
      console.warn('⚠️  Twilio WhatsApp credentials not fully configured');
      this.client = null;
    } else {
      this.client = twilio(this.accountSid, this.authToken);
      console.log('✅ Twilio WhatsApp Service initialized');
    }
  }

  /**
   * Format phone number to WhatsApp format
   * @param {string} phone - Phone number (can be with or without country code)
   * @returns {string} - Formatted WhatsApp number
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present (assuming +91 for India)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return `whatsapp:+${cleaned}`;
  }

  /**
   * Send a simple text message via WhatsApp
   * @param {string} to - Recipient's phone number
   * @param {string} message - Message text
   * @returns {Promise<object>} - Twilio response
   */
  async sendMessage(to, message) {
    if (!this.client) {
      throw new Error('Twilio client not initialized. Check your environment variables.');
    }

    try {
      const formattedTo = this.formatPhoneNumber(to);
      
      const result = await this.client.messages.create({
        from: this.from,
        to: formattedTo,
        body: message
      });

      console.log('✅ WhatsApp message sent:', result.sid);
      return {
        success: true,
        messageSid: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error.message);
      throw error;
    }
  }

  /**
   * Send task notification via WhatsApp
   * @param {string} to - Recipient's phone number
   * @param {object} task - Task object
   * @param {string} notificationType - Type of notification (assigned, due, completed, etc.)
   * @returns {Promise<object>} - Twilio response
   */
  async sendTaskNotification(to, task, notificationType = 'assigned') {
    const messages = {
      assigned: `🔔 *New Task Assigned*\n\n📋 *${task.title}*\n${task.description || ''}\n\n⏰ Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}\n🏷️ Priority: ${task.priority || 'Normal'}\n\n✅ Please acknowledge this task.`,
      
      due: `⏰ *Task Due Soon*\n\n📋 *${task.title}*\n${task.description || ''}\n\n🔴 Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Today'}\n🏷️ Priority: ${task.priority || 'Normal'}\n\n⚡ Please complete this task soon.`,
      
      overdue: `🚨 *Task Overdue*\n\n📋 *${task.title}*\n${task.description || ''}\n\n❌ Was due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}\n🏷️ Priority: ${task.priority || 'Normal'}\n\n⚠️ This task requires immediate attention!`,
      
      completed: `✅ *Task Completed*\n\n📋 *${task.title}*\n\n🎉 Great job! This task has been marked as completed.`,
      
      reminder: `⏰ *Task Reminder*\n\n📋 *${task.title}*\n${task.description || ''}\n\n📅 Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}\n🏷️ Priority: ${task.priority || 'Normal'}\n\n💡 Don't forget to complete this task!`
    };

    const message = messages[notificationType] || messages.assigned;
    return this.sendMessage(to, message);
  }

  /**
   * Send project notification via WhatsApp
   * @param {string} to - Recipient's phone number
   * @param {object} project - Project object
   * @param {string} notificationType - Type of notification
   * @returns {Promise<object>} - Twilio response
   */
  async sendProjectNotification(to, project, notificationType = 'assigned') {
    const messages = {
      assigned: `🎯 *New Project Assigned*\n\n📁 *${project.name}*\n${project.description || ''}\n\n👥 Team members will be notified.\n✅ Please review the project details.`,
      
      update: `🔄 *Project Updated*\n\n📁 *${project.name}*\n\nThe project has been updated. Please check the latest details.`,
      
      completed: `🎊 *Project Completed*\n\n📁 *${project.name}*\n\n✅ Congratulations! The project has been successfully completed.`
    };

    const message = messages[notificationType] || messages.assigned;
    return this.sendMessage(to, message);
  }

  /**
   * Send bulk notifications to multiple recipients
   * @param {Array<string>} recipients - Array of phone numbers
   * @param {string} message - Message to send
   * @returns {Promise<Array>} - Array of results
   */
  async sendBulkNotifications(recipients, message) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendMessage(recipient, message);
        results.push({
          phone: recipient,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          phone: recipient,
          success: false,
          error: error.message
        });
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }

  /**
   * Send custom notification with template
   * @param {string} to - Recipient's phone number
   * @param {object} templateData - Data for the template
   * @returns {Promise<object>} - Twilio response
   */
  async sendCustomNotification(to, templateData) {
    const { title, body, footer, emoji = '📢' } = templateData;
    
    let message = `${emoji} *${title}*\n\n${body}`;
    
    if (footer) {
      message += `\n\n${footer}`;
    }
    
    return this.sendMessage(to, message);
  }

  /**
   * Verify Twilio webhook signature for security
   * @param {string} signature - X-Twilio-Signature header
   * @param {string} url - The webhook URL
   * @param {object} params - Request parameters
   * @returns {boolean} - True if valid
   */
  validateWebhook(signature, url, params) {
    if (!this.client) {
      return false;
    }
    
    return twilio.validateRequest(
      this.authToken,
      signature,
      url,
      params
    );
  }
}

module.exports = new TwilioWhatsAppService();
