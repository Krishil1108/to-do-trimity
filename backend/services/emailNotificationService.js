const User = require('../models/User');

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM_EMAIL = 'TriDo Notifications <onboarding@resend.dev>';

const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatDate = (value) => {
  if (!value) return 'Not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const uniqueEmails = (emails) => [
  ...new Set(
    emails
      .filter(Boolean)
      .map((email) => String(email).trim().toLowerCase())
      .filter((email) => email.includes('@'))
  )
];

const getTaskNotificationEmails = () => {
  const configuredEmails = process.env.TASK_NOTIFICATION_EMAILS || process.env.RESEND_ADMIN_EMAIL || '';
  return uniqueEmails(configuredEmails.split(','));
};

const findUserEmail = async (username) => {
  if (!username) return null;

  const user = await User.findOne({ username }).select('email');
  return user?.email || null;
};

const getAssigneeEmail = async (task) => {
  if (task.isAssociate) {
    return task.associateDetails?.email || null;
  }

  return findUserEmail(task.assignedTo);
};

const buildTaskRows = (task) => {
  const rows = [
    ['Project', task.project],
    ['Task', task.title],
    ['Assigned By', task.assignedBy],
    ['Assigned To', task.isAssociate ? task.associateDetails?.name || task.assignedTo : task.assignedTo],
    ['Status', task.status],
    ['Start Date', formatDate(task.inDate)],
    ['Due Date', formatDate(task.outDate)]
  ];

  if (task.description) {
    rows.push(['Description', task.description]);
  }

  return rows.map(([label, value]) => `
    <tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${escapeHtml(value || 'N/A')}</td>
    </tr>
  `).join('');
};

const buildTaskEmailHtml = ({ heading, intro, task }) => `
  <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
    <h2 style="margin:0 0 12px;">${escapeHtml(heading)}</h2>
    <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>
    <table style="border-collapse:collapse;width:100%;max-width:640px;">
      <tbody>${buildTaskRows(task)}</tbody>
    </table>
  </div>
`;

const sendEmail = async ({ to, subject, html }) => {
  const recipients = uniqueEmails(Array.isArray(to) ? to : [to]);

  if (!recipients.length) {
    return { success: false, skipped: true, reason: 'No recipient email found' };
  }

  if (!isEmailConfigured()) {
    console.warn('Resend API key not configured. Skipping task email notification.');
    return { success: false, skipped: true, reason: 'RESEND_API_KEY missing' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL,
        to: recipients,
        subject,
        html
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Failed to send Resend email:', data);
      return { success: false, error: data };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending Resend email:', error);
    return { success: false, error: error.message };
  }
};

const sendTaskEventEmail = async ({ recipients, taskNotificationEmails, subject, html }) => {
  const results = [];

  results.push(await sendEmail({ to: recipients, subject, html }));

  if (taskNotificationEmails.length) {
    results.push(await sendEmail({ to: taskNotificationEmails, subject, html }));
  }

  return results;
};

const sendTaskAssignedEmail = async (task) => {
  try {
    const assigneeEmail = await getAssigneeEmail(task);
    const assigneeName = task.isAssociate ? task.associateDetails?.name || task.assignedTo : task.assignedTo;
    const taskNotificationEmails = getTaskNotificationEmails();
    const subject = `New task assigned: ${task.title}`;
    const html = buildTaskEmailHtml({
      heading: 'New Task Assigned',
      intro: `${task.assignedBy} assigned "${task.title}" to ${assigneeName}.`,
      task
    });

    return sendTaskEventEmail({
      recipients: assigneeEmail,
      taskNotificationEmails,
      subject,
      html
    });
  } catch (error) {
    console.error('Failed to prepare task assignment email:', error);
    return { success: false, error: error.message };
  }
};

const sendTaskStatusChangedEmail = async (task, previousStatus) => {
  try {
    const [assigneeEmail, assignerEmail] = await Promise.all([
      getAssigneeEmail(task),
      findUserEmail(task.assignedBy)
    ]);
    const taskNotificationEmails = getTaskNotificationEmails();
    const subject = `Task status changed: ${task.title}`;
    const html = buildTaskEmailHtml({
      heading: 'Task Status Changed',
      intro: `"${task.title}" changed from ${previousStatus} to ${task.status}.`,
      task
    });

    return sendTaskEventEmail({
      recipients: [assigneeEmail, assignerEmail],
      taskNotificationEmails,
      subject,
      html
    });
  } catch (error) {
    console.error('Failed to prepare task status email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTaskAssignedEmail,
  sendTaskStatusChangedEmail
};
