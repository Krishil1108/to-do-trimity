const express = require('express');
const router = express.Router();
const metaWhatsAppService = require('../services/metaWhatsAppService');

/**
 * Webhook verification endpoint
 * Meta will call this to verify your webhook
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const result = metaWhatsAppService.verifyWebhook(mode, token, challenge);
  
  if (result) {
    res.status(200).send(result);
  } else {
    res.sendStatus(403);
  }
});

/**
 * Webhook endpoint to receive messages
 * Meta will POST to this endpoint when users reply
 */
router.post('/webhook', (req, res) => {
  try {
    const body = req.body;

    // Check if this is a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.field === 'messages') {
            const value = change.value;
            
            // Log incoming messages
            if (value.messages) {
              value.messages.forEach(message => {
                console.log('📨 Received WhatsApp message:', {
                  from: message.from,
                  type: message.type,
                  text: message.text?.body,
                  timestamp: message.timestamp
                });
              });
            }

            // Log message status updates
            if (value.statuses) {
              value.statuses.forEach(status => {
                console.log('📊 Message status update:', {
                  id: status.id,
                  status: status.status,
                  timestamp: status.timestamp
                });
              });
            }
          }
        });
      });

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.sendStatus(500);
  }
});

/**
 * Send a WhatsApp message
 * POST /api/meta-whatsapp/send
 */
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and message are required' 
      });
    }

    const result = await metaWhatsAppService.sendMessage(phone, message);
    
    if (result.success) {
      res.json({ success: true, message: 'Message sent successfully', data: result.data });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('❌ Error in send endpoint:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Send a task notification via WhatsApp
 * POST /api/meta-whatsapp/send-task-notification
 */
router.post('/send-task-notification', async (req, res) => {
  try {
    const { phone, taskData, notificationType } = req.body;

    if (!phone || !taskData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and task data are required' 
      });
    }

    const result = await metaWhatsAppService.sendTaskNotification(
      phone, 
      taskData, 
      notificationType || 'assigned'
    );
    
    if (result.success) {
      res.json({ success: true, message: 'Task notification sent successfully', data: result.data });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('❌ Error sending task notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Send a template message
 * POST /api/meta-whatsapp/send-template
 */
router.post('/send-template', async (req, res) => {
  try {
    const { phone, templateName, languageCode, components } = req.body;

    if (!phone || !templateName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and template name are required' 
      });
    }

    const result = await metaWhatsAppService.sendTemplate(
      phone, 
      templateName, 
      languageCode, 
      components
    );
    
    if (result.success) {
      res.json({ success: true, message: 'Template sent successfully', data: result.data });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('❌ Error sending template:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
