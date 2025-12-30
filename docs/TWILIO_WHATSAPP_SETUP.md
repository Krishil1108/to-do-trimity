# Twilio WhatsApp Integration Guide

## Overview

This application integrates Twilio WhatsApp Business API to send notifications and messages to users via WhatsApp.

## Prerequisites

1. **Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)
2. **WhatsApp Sandbox** (for testing) or **WhatsApp Business API** (for production)
3. **Node.js** and **npm** installed

## Configuration

### 1. Environment Variables

Add the following to your `backend/.env` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 2. Twilio Sandbox Setup (For Testing)

1. Log in to [Twilio Console](https://console.twilio.com)
2. Navigate to **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Join the sandbox by sending the code shown to the sandbox number
4. Use the sandbox number as your `TWILIO_WHATSAPP_FROM`

### 3. Production Setup

For production, you'll need to:
1. Apply for WhatsApp Business API access through Twilio
2. Verify your business
3. Get your WhatsApp-enabled phone number approved
4. Update `TWILIO_WHATSAPP_FROM` with your approved number

## Features

### 1. Simple Message Sending

Send a basic WhatsApp message:

```javascript
POST /api/twilio-whatsapp/send
{
  "phone": "+919876543210",
  "message": "Hello from Trido!"
}
```

### 2. Task Notifications

Send task-related notifications:

```javascript
POST /api/twilio-whatsapp/send-task-notification
{
  "phone": "+919876543210",
  "taskId": "65f8a9b3c2d1e4f5a6b7c8d9",
  "notificationType": "assigned" // assigned, due, overdue, completed, reminder
}
```

**Notification Types:**
- `assigned`: New task assigned
- `due`: Task due soon
- `overdue`: Task is overdue
- `completed`: Task completed
- `reminder`: Task reminder

### 3. Project Notifications

Send project-related notifications:

```javascript
POST /api/twilio-whatsapp/send-project-notification
{
  "phone": "+919876543210",
  "projectId": "65f8a9b3c2d1e4f5a6b7c8d9",
  "notificationType": "assigned" // assigned, update, completed
}
```

### 4. Bulk Notifications

Send the same message to multiple recipients:

```javascript
POST /api/twilio-whatsapp/send-bulk
{
  "phones": ["+919876543210", "+919876543211", "+919876543212"],
  "message": "Team meeting at 3 PM today!"
}
```

### 5. Custom Notifications

Send custom formatted notifications:

```javascript
POST /api/twilio-whatsapp/send-custom
{
  "phone": "+919876543210",
  "title": "System Alert",
  "body": "Your attention is required for the following matter...",
  "footer": "Thank you for using Trido",
  "emoji": "⚠️"
}
```

### 6. Notify All Task Assignees

Automatically notify all assignees of a task:

```javascript
POST /api/twilio-whatsapp/notify-task-assignees
{
  "taskId": "65f8a9b3c2d1e4f5a6b7c8d9",
  "notificationType": "assigned"
}
```

### 7. Check Configuration Status

Verify if Twilio is properly configured:

```javascript
GET /api/twilio-whatsapp/status
```

## Integration Examples

### Example 1: Send Notification When Task is Created

```javascript
// In your task creation route
const task = await Task.create(taskData);

// Send WhatsApp notification
if (user.phone) {
  await twilioWhatsAppService.sendTaskNotification(
    user.phone,
    task,
    'assigned'
  );
}
```

### Example 2: Send Reminder for Overdue Tasks

```javascript
// In a scheduled job
const overdueTasks = await Task.find({
  dueDate: { $lt: new Date() },
  status: { $ne: 'completed' }
}).populate('assignedTo');

for (const task of overdueTasks) {
  const assignees = Array.isArray(task.assignedTo) 
    ? task.assignedTo 
    : [task.assignedTo];
    
  for (const assignee of assignees) {
    if (assignee.phone) {
      await twilioWhatsAppService.sendTaskNotification(
        assignee.phone,
        task,
        'overdue'
      );
    }
  }
}
```

### Example 3: Frontend Integration

```javascript
// Send WhatsApp notification from frontend
const sendWhatsAppNotification = async (taskId) => {
  try {
    const response = await fetch('/api/twilio-whatsapp/send-task-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: user.phone,
        taskId: taskId,
        notificationType: 'assigned'
      })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('WhatsApp notification sent!');
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};
```

## Phone Number Format

The service automatically formats phone numbers. You can provide:
- `9876543210` (10 digits - assumes India +91)
- `919876543210` (with country code)
- `+919876543210` (international format)

All formats will be converted to WhatsApp format: `whatsapp:+919876543210`

## Webhook Configuration

To receive incoming messages and status updates:

1. In Twilio Console, go to **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
2. Set **When a message comes in** to:
   ```
   https://your-domain.com/api/twilio-whatsapp/webhook
   ```
3. Method: `POST`

## Testing

### Test Simple Message
```bash
curl -X POST http://localhost:5000/api/twilio-whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "message": "Test message from Trido!"
  }'
```

### Test Task Notification
```bash
curl -X POST http://localhost:5000/api/twilio-whatsapp/send-task-notification \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "taskId": "YOUR_TASK_ID",
    "notificationType": "assigned"
  }'
```

## Error Handling

The service includes comprehensive error handling:

- Missing credentials: Returns configuration error
- Invalid phone number: Returns validation error
- Twilio API errors: Returns detailed error message
- Rate limiting: Includes delays in bulk operations

## Rate Limits

- Twilio has rate limits based on your account type
- Bulk operations include 500ms delay between messages
- Monitor your usage in Twilio Console

## Best Practices

1. **Validate Phone Numbers**: Ensure phone numbers are valid before sending
2. **User Consent**: Only send messages to users who have opted in
3. **Message Content**: Keep messages concise and relevant
4. **Error Logging**: Monitor errors and failed deliveries
5. **Rate Limiting**: Respect Twilio's rate limits
6. **Testing**: Use sandbox for development, production credentials for live

## Troubleshooting

### Messages Not Sending

1. **Check Environment Variables**: Verify all credentials are set correctly
2. **Check Phone Number Format**: Ensure proper formatting
3. **Sandbox Join**: For testing, ensure recipient has joined sandbox
4. **Account Balance**: Verify Twilio account has sufficient balance
5. **Error Logs**: Check backend console for detailed error messages

### Webhook Not Receiving Messages

1. **Public URL**: Ensure your server is publicly accessible
2. **HTTPS**: Production webhooks require HTTPS
3. **Webhook URL**: Verify correct URL in Twilio console
4. **Method**: Ensure POST method is configured

## Security Considerations

1. **Environment Variables**: Never commit `.env` file
2. **Webhook Validation**: Implement signature validation for webhooks
3. **User Privacy**: Handle phone numbers securely
4. **Access Control**: Restrict API endpoints appropriately

## Support

For issues related to:
- **Twilio**: [Twilio Support](https://support.twilio.com)
- **WhatsApp Business API**: [WhatsApp Business Documentation](https://developers.facebook.com/docs/whatsapp)

## Next Steps

1. Set up webhook handling for two-way communication
2. Implement message templates for frequently used notifications
3. Add scheduling for reminder notifications
4. Create analytics for message delivery rates
5. Implement opt-in/opt-out functionality

---

**Note**: Remember to comply with WhatsApp Business Policy and local regulations regarding automated messaging.
