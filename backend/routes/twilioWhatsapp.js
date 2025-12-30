const express = require('express');
const router = express.Router();
const twilioWhatsAppService = require('../services/twilioWhatsAppService');
const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');

/**
 * POST /api/twilio-whatsapp/send
 * Send a simple WhatsApp message
 */
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and message are required' 
      });
    }

    const result = await twilioWhatsAppService.sendMessage(phone, message);
    
    res.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send WhatsApp message' 
    });
  }
});

/**
 * POST /api/twilio-whatsapp/send-task-notification
 * Send task notification via WhatsApp
 */
router.post('/send-task-notification', async (req, res) => {
  try {
    const { phone, taskId, notificationType } = req.body;

    if (!phone || !taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and task ID are required' 
      });
    }

    // Fetch task details
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }

    const result = await twilioWhatsAppService.sendTaskNotification(
      phone,
      task,
      notificationType || 'assigned'
    );
    
    res.json({
      success: true,
      message: 'Task notification sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending task notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send task notification' 
    });
  }
});

/**
 * POST /api/twilio-whatsapp/send-project-notification
 * Send project notification via WhatsApp
 */
router.post('/send-project-notification', async (req, res) => {
  try {
    const { phone, projectId, notificationType } = req.body;

    if (!phone || !projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and project ID are required' 
      });
    }

    // Fetch project details
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    const result = await twilioWhatsAppService.sendProjectNotification(
      phone,
      project,
      notificationType || 'assigned'
    );
    
    res.json({
      success: true,
      message: 'Project notification sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending project notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send project notification' 
    });
  }
});

/**
 * POST /api/twilio-whatsapp/send-bulk
 * Send bulk notifications to multiple recipients
 */
router.post('/send-bulk', async (req, res) => {
  try {
    const { phones, message } = req.body;

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Array of phone numbers is required' 
      });
    }

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    const results = await twilioWhatsAppService.sendBulkNotifications(phones, message);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Bulk notifications sent: ${successCount} succeeded, ${failureCount} failed`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results
      }
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send bulk notifications' 
    });
  }
});

/**
 * POST /api/twilio-whatsapp/send-custom
 * Send custom notification with template
 */
router.post('/send-custom', async (req, res) => {
  try {
    const { phone, title, body, footer, emoji } = req.body;

    if (!phone || !title || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone, title, and body are required' 
      });
    }

    const result = await twilioWhatsAppService.sendCustomNotification(phone, {
      title,
      body,
      footer,
      emoji
    });
    
    res.json({
      success: true,
      message: 'Custom notification sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending custom notification:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send custom notification' 
    });
  }
});

/**
 * POST /api/twilio-whatsapp/notify-task-assignees
 * Notify all assignees of a task
 */
router.post('/notify-task-assignees', async (req, res) => {
  try {
    const { taskId, notificationType } = req.body;

    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Task ID is required' 
      });
    }

    const task = await Task.findById(taskId).populate('assignedTo');
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }

    const results = [];
    const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];

    for (const assignee of assignees) {
      if (assignee && assignee.phone) {
        try {
          const result = await twilioWhatsAppService.sendTaskNotification(
            assignee.phone,
            task,
            notificationType || 'assigned'
          );
          results.push({
            user: assignee.name,
            phone: assignee.phone,
            success: true,
            result
          });
        } catch (error) {
          results.push({
            user: assignee.name,
            phone: assignee.phone,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `Notified ${successCount} out of ${results.length} assignees`,
      data: {
        total: results.length,
        successful: successCount,
        failed: results.length - successCount,
        results
      }
    });
  } catch (error) {
    console.error('Error notifying task assignees:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to notify task assignees' 
    });
  }
});

/**
 * POST /api/twilio-whatsapp/webhook
 * Handle incoming WhatsApp messages and status updates
 */
router.post('/webhook', async (req, res) => {
  try {
    const { From, Body, MessageSid, SmsStatus } = req.body;

    console.log('📩 Received WhatsApp webhook:', {
      from: From,
      body: Body,
      messageSid: MessageSid,
      status: SmsStatus
    });

    // Here you can implement custom logic to handle incoming messages
    // For example, log them, parse commands, update task status, etc.

    // Respond to Twilio
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

/**
 * GET /api/twilio-whatsapp/status
 * Check if Twilio WhatsApp service is configured
 */
router.get('/status', (req, res) => {
  const isConfigured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  );

  res.json({
    success: true,
    configured: isConfigured,
    from: process.env.TWILIO_WHATSAPP_FROM || 'Not configured'
  });
});

module.exports = router;
