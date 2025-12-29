const axios = require('axios');

class MetaWhatsAppService {
  constructor() {
    this.accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    this.apiVersion = process.env.META_WHATSAPP_API_VERSION || 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Send a WhatsApp message using Meta's Cloud API
   * @param {string} recipientPhone - Phone number in international format (e.g., +1234567890)
   * @param {string} message - Message text to send
   * @returns {Promise<Object>} - API response
   */
  async sendMessage(recipientPhone, message) {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        console.warn('⚠️ Meta WhatsApp credentials not configured');
        return { success: false, error: 'Credentials not configured' };
      }

      // Remove any non-digit characters except the leading +
      const cleanPhone = recipientPhone.replace(/[^\d+]/g, '');

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ WhatsApp message sent successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  /**
   * Send a template message (for pre-approved templates)
   * @param {string} recipientPhone - Phone number in international format
   * @param {string} templateName - Name of the approved template
   * @param {string} languageCode - Language code (e.g., 'en_US')
   * @param {Array} components - Template components/parameters
   * @returns {Promise<Object>} - API response
   */
  async sendTemplate(recipientPhone, templateName, languageCode = 'en_US', components = []) {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        console.warn('⚠️ Meta WhatsApp credentials not configured');
        return { success: false, error: 'Credentials not configured' };
      }

      const cleanPhone = recipientPhone.replace(/[^\d+]/g, '');

      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode
            },
            components: components
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ WhatsApp template sent successfully:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Error sending WhatsApp template:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error?.message || error.message 
      };
    }
  }

  /**
   * Send task notification via WhatsApp
   * @param {string} recipientPhone - Phone number to send to
   * @param {Object} taskData - Task information
   * @param {string} notificationType - Type of notification (assigned, completed, updated)
   * @returns {Promise<Object>} - API response
   */
  async sendTaskNotification(recipientPhone, taskData, notificationType) {
    let message = '';

    switch (notificationType) {
      case 'assigned':
        message = `🎯 *New Task Assigned*\n\n` +
                  `*Title:* ${taskData.title}\n` +
                  `*Description:* ${taskData.description || 'No description'}\n` +
                  `*Assigned By:* ${taskData.assignedBy || 'System'}\n` +
                  `*Priority:* ${taskData.priority || 'Normal'}\n` +
                  `*Status:* ${taskData.status || 'Pending'}\n\n` +
                  `Please check the task management system for more details.`;
        break;

      case 'completed':
        message = `✅ *Task Completed*\n\n` +
                  `*Title:* ${taskData.title}\n` +
                  `*Completed By:* ${taskData.completedBy || 'User'}\n\n` +
                  `The task has been marked as completed.`;
        break;

      case 'updated':
        message = `🔄 *Task Updated*\n\n` +
                  `*Title:* ${taskData.title}\n` +
                  `*Status:* ${taskData.status || 'Updated'}\n\n` +
                  `Changes have been made to this task. Please check the system for details.`;
        break;

      case 'reminder':
        message = `⏰ *Task Reminder*\n\n` +
                  `*Title:* ${taskData.title}\n` +
                  `*Status:* ${taskData.status || 'Pending'}\n\n` +
                  `This task requires your attention.`;
        break;

      default:
        message = `📋 *Task Notification*\n\n` +
                  `*Title:* ${taskData.title}\n\n` +
                  `You have a new notification regarding this task.`;
    }

    return this.sendMessage(recipientPhone, message);
  }

  /**
   * Verify webhook signature (for receiving messages)
   * @param {string} mode - Verification mode
   * @param {string} token - Verification token
   * @param {string} challenge - Challenge string
   * @returns {string|null} - Challenge if valid, null otherwise
   */
  verifyWebhook(mode, token, challenge) {
    const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verified successfully');
      return challenge;
    }
    
    console.warn('⚠️ Webhook verification failed');
    return null;
  }
}

module.exports = new MetaWhatsAppService();
