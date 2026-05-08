import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const gmailUser = String(process.env.GMAIL_USER || '').trim();
const gmailPassword = String(process.env.GMAIL_PASSWORD || '')
  .replace(/\s+/g, '')
  .trim();

// Create email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPassword,
  },
});

// Format task title and due date for email
const formatTaskForEmail = (task) => {
  const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : 'No specific date';
  return `• ${task.title} (Due: ${dueDate})`;
};

// Generate email content for pending tasks
const generateEmailContent = (userName, tasks) => {
  const taskList = tasks.map(formatTaskForEmail).join('\n');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
    .content { margin: 20px 0; }
    .task-list { background-color: #ecf0f1; padding: 15px; border-left: 4px solid #3498db; margin: 15px 0; }
    .footer { color: #7f8c8d; font-size: 12px; margin-top: 20px; }
    .button { display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Income Tax Compliance Reminder</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      
      <p>You have pending compliance tasks that require your attention:</p>
      
      <div class="task-list">
        <strong>Pending Tasks:</strong><br/>
        ${taskList}
      </div>

      <p>Please log into your dashboard and complete these tasks before their due dates to ensure timely compliance.</p>
      
      <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
    </div>
    
    <div class="footer">
      <p>This is an automated reminder from PAN-Based Income Tax Compliance Analyzer System.<br/>
      Do not reply to this email. Please use the dashboard for any updates.</p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
Income Tax Compliance Reminder

Hello ${userName},

You have pending compliance tasks:

${taskList}

Please log in to your dashboard and complete these tasks.

Dashboard: ${process.env.FRONTEND_URL}/dashboard

Thank You,
PAN Tax Compliance System
  `;

  return { htmlContent, textContent };
};

// Send email reminder for pending tasks
export const sendPendingTasksReminder = async ({ userName, userEmail, tasks }) => {
  try {
    const pendingTasks = (tasks || []).filter((task) => {
      const normalizedStatus = String(task?.status || '').trim().toLowerCase();
      const isCompletedByStatus = normalizedStatus === 'completed';
      const isCompletedByTimestamp = Boolean(task?.completed_at);

      return !isCompletedByStatus && !isCompletedByTimestamp;
    });

    if (pendingTasks.length === 0) {
      console.log(`ℹ No pending tasks for ${userName}. Email reminder skipped.`);
      return { success: false, message: 'No pending tasks' };
    }

    if (!gmailUser || !gmailPassword) {
      console.warn('Gmail credentials not configured in .env. Email reminder skipped.');
      return { success: false, message: 'Email service not configured' };
    }

    const { htmlContent, textContent } = generateEmailContent(userName, pendingTasks);

    const mailOptions = {
      from: gmailUser,
      to: userEmail,
      subject: `Income Tax Compliance Reminder - ${pendingTasks.length} Pending Task(s)`,
      html: htmlContent,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('=====================================');
    console.log('✓ EMAIL SUCCESSFULLY SENT');
    console.log('=====================================');
    console.log(`To: ${userEmail}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Pending Tasks Count: ${pendingTasks.length}`);
    console.log('=====================================');
    return { success: true, message: 'Email sent successfully', messageId: info.messageId };
  } catch (error) {
    console.log('=====================================');
    console.log('✗ EMAIL SEND FAILED');
    console.log('=====================================');
    console.log(`To: ${userEmail}`);
    console.log(`Error: ${error.message}`);
    console.log('=====================================');
    return { success: false, message: error.message };
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✓ Email service is ready to send emails.');
    return true;
  } catch (error) {
    console.error('✗ Email service error:', error.message);
    return false;
  }
};
