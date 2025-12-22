const express = require('express');
const router = express.Router();
const { sendOwnerNotification } = require('../services/whatsappService');

// Route to send comprehensive WhatsApp notifications to owner (Ketul Lathia)
router.post('/notify-owner', async (req, res) => {
  try {
    const { notificationType, data } = req.body;

    if (!notificationType || !data) {
      return res.status(400).json({ 
        success: false, 
        error: 'notificationType and data are required' 
      });
    }

    // Validate notification type
    const validTypes = ['TASK_CREATED', 'TASK_STATUS_CHANGED', 'TASK_COMPLETED', 'SUBTASK_CREATED', 'TASK_DELETED'];
    if (!validTypes.includes(notificationType)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Send the WhatsApp notification
    const result = await sendOwnerNotification(notificationType, data);

    if (result.success) {
      res.json({ 
        success: true, 
        message: `Owner WhatsApp notification sent successfully for ${notificationType}`,
        sid: result.sid 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }

  } catch (error) {
    console.error('❌ Error in WhatsApp notify-owner route:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;