const nodemailer = require('nodemailer');

let transporter;

/**
 * Create and initialize email transporter
 */
function createTransporter() {
  const mailDriver = process.env.MAIL_DRIVER || 'test';
  
  if (mailDriver === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'localhost',
      port: process.env.MAIL_PORT || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      }
    });
  } else {
    // Test mode using Ethereal or local SMTP
    transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false
    });
  }

  return transporter;
}

/**
 * Initialize transporter on module load
 */
if (!transporter) {
  createTransporter();
}

/**
 * Email templates with HTML and text versions
 */
const emailTemplates = {
};

/**
 * Send a single email
 */
async function sendEmail(to, template, data) {
  try {
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Unknown email template: ${template}`);
    }

    const { subject, html, text } = emailTemplate(data);
    const mailOptions = {
      from: process.env.MAIL_FROM || 'noreply@formsystem.local',
      to,
      subject,
      html,
      text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} using template ${template}:`, result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
      to
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') { console.error(`Error sending email to ${to}:`, error); }
    return {
      success: false,
      error: error.message,
      to
    };
  }
}

/**
 * Send emails to multiple recipients
 */
async function sendEmailBatch(recipients, template, data) {
  const results = await Promise.all(
    recipients.map(recipient => sendEmail(recipient, template, data))
  );
  
  return {
    total: recipients.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

/**
 * Verify transporter connection
 */
async function verifyTransporter() {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Transporter verification failed:', error);
    return false;
  }
}

/**
 * Reinitialize transporter (for hot-reload scenarios)
 */
function reinitializeTransporter() {
  transporter = createTransporter();
  return transporter;
}

module.exports = {
  sendEmail,
  sendEmailBatch,
  verifyTransporter,
  reinitializeTransporter,
  emailTemplates
};
