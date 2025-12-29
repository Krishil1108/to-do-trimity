# Meta WhatsApp Business API Integration

This guide explains how to set up and use WhatsApp notifications for task assignments and updates using Meta's WhatsApp Business API.

## Features

- **Automated Task Notifications**: Users receive WhatsApp messages when:
  - They are assigned a new task
  - A task they created is completed
  - A task assigned to them is updated

- **User Control**: Each user can:
  - Add their WhatsApp number
  - Enable/disable WhatsApp notifications
  - Receive formatted, professional task notifications

## Setup Steps

### 1. Create a Meta WhatsApp Business Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add "WhatsApp" product to your app
4. Complete the business verification process

### 2. Get Your Credentials

You'll need three pieces of information:

1. **Access Token**: From WhatsApp > API Setup
2. **Phone Number ID**: From WhatsApp > API Setup > Phone Number
3. **Verify Token**: Create a random string (you'll use this for webhook verification)

### 3. Configure Environment Variables

Add these to your `.env` file in the backend folder:

```env
# Meta WhatsApp Business API
META_WHATSAPP_ACCESS_TOKEN=your_access_token_here
META_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
META_WHATSAPP_VERIFY_TOKEN=your_random_verify_token_here
META_WHATSAPP_API_VERSION=v18.0
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

The `axios` package is already added to `package.json`.

### 5. Set Up Webhooks (Optional)

If you want to receive message status updates and user replies:

1. In Meta Developer Console, go to WhatsApp > Configuration
2. Click "Edit" next to Webhook
3. Set **Callback URL**: `https://your-domain.com/api/meta-whatsapp/webhook`
4. Set **Verify Token**: Same as `META_WHATSAPP_VERIFY_TOKEN` in your `.env`
5. Subscribe to these webhook fields:
   - `messages`
   - `message_status`

### 6. User Configuration

Users need to configure their WhatsApp preferences in the app:

1. Navigate to user settings/profile
2. Add WhatsApp number (international format: +1234567890)
3. Enable "WhatsApp Notifications" toggle

## API Endpoints

### Send Custom Message
```http
POST /api/meta-whatsapp/send
Content-Type: application/json

{
  "phone": "+1234567890",
  "message": "Your message here"
}
```

### Send Task Notification
```http
POST /api/meta-whatsapp/send-task-notification
Content-Type: application/json

{
  "phone": "+1234567890",
  "taskData": {
    "title": "Complete report",
    "description": "Quarterly sales report",
    "assignedBy": "manager",
    "priority": "High",
    "status": "Pending"
  },
  "notificationType": "assigned"
}
```

Notification types: `assigned`, `completed`, `updated`, `reminder`

### Send Template Message
```http
POST /api/meta-whatsapp/send-template
Content-Type: application/json

{
  "phone": "+1234567890",
  "templateName": "your_approved_template",
  "languageCode": "en_US",
  "components": []
}
```

## Message Formats

### Task Assigned
```
🎯 *New Task Assigned*

*Title:* Complete monthly report
*Description:* Generate and submit Q4 report
*Assigned By:* John Manager
*Priority:* High
*Status:* Pending

Please check the task management system for more details.
```

### Task Completed
```
✅ *Task Completed*

*Title:* Complete monthly report
*Completed By:* Jane Employee

The task has been marked as completed.
```

### Task Updated
```
🔄 *Task Updated*

*Title:* Complete monthly report
*Status:* In Progress

Changes have been made to this task. Please check the system for details.
```

## Testing

### Test Sending a Message

```bash
curl -X POST http://localhost:5000/api/meta-whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "Test message from Task Management System"
  }'
```

### Test Task Notification

```bash
curl -X POST http://localhost:5000/api/meta-whatsapp/send-task-notification \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "taskData": {
      "title": "Test Task",
      "description": "This is a test",
      "assignedBy": "system",
      "priority": "Normal",
      "status": "Pending"
    },
    "notificationType": "assigned"
  }'
```

## Important Notes

### Phone Number Format
- Always use international format: `+[country_code][number]`
- Example: `+14155552671` (US), `+919876543210` (India)
- The system automatically removes formatting characters

### Message Templates
- For marketing/promotional messages, you MUST use approved templates
- Transactional messages (like task notifications) can use freeform text
- Template approval can take 24-48 hours

### Rate Limits
- Free tier: 1000 conversations/month
- Each unique user conversation within 24 hours counts as 1 conversation
- Monitor usage in Meta Business Manager

### Costs
- First 1000 conversations/month: Free
- After that: Varies by country (~$0.005-0.05 per conversation)
- Business-initiated conversations after 24-hour window may have higher rates

### Privacy & Compliance
- Users must opt-in to receive notifications
- Store consent records
- Provide easy opt-out mechanism
- Follow WhatsApp Business Policy
- Don't send spam or unsolicited messages

## Troubleshooting

### "Credentials not configured"
- Verify `.env` file has all required variables
- Restart the server after adding environment variables
- Check for typos in variable names

### "Invalid phone number"
- Ensure phone number starts with `+` and country code
- Remove spaces, dashes, or parentheses
- Verify the number is registered with WhatsApp

### "Message not delivered"
- Check if the recipient has blocked your business number
- Verify the recipient's phone number is correct
- Check WhatsApp Business Manager for delivery status
- Ensure you haven't exceeded rate limits

### Webhook verification fails
- Ensure `META_WHATSAPP_VERIFY_TOKEN` in `.env` matches the one in Meta console
- Check that your server is accessible from the internet
- Use HTTPS (required for production webhooks)
- Verify the webhook URL is correct

## Development vs Production

### Development
- Can use Meta's test phone numbers
- Limited to verified numbers in your business account
- Use ngrok or similar to expose local server for webhooks

### Production
- Complete business verification
- Add your production server URL to Meta's whitelist
- Use production phone number ID
- Monitor costs and usage
- Set up proper error logging and monitoring

## Security Best Practices

1. **Never commit credentials**: Use `.env` file and add to `.gitignore`
2. **Rotate tokens**: Regularly refresh access tokens
3. **Validate webhooks**: Use the verification system
4. **Rate limiting**: Implement server-side rate limiting
5. **Error handling**: Don't expose API errors to clients
6. **Logging**: Log all WhatsApp API calls for debugging
7. **User consent**: Always get explicit consent before sending

## Resources

- [Meta WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business Policy](https://www.whatsapp.com/legal/business-policy)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [Webhook Setup Guide](https://developers.facebook.com/docs/graph-api/webhooks)

## Support

For issues with:
- **Meta API**: Contact Meta for Developers Support
- **App integration**: Check server logs and console for errors
- **User configuration**: Verify phone numbers and settings in user profile
