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
  submissionConfirmation: (data) => ({
    subject: `Form Submission Confirmed: ${data.formName}`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #007bff;">Form Submission Confirmed</h2>
            <p>Dear ${data.submitterName},</p>
            <p>Your form <strong>"${data.formName}"</strong> has been successfully submitted.</p>
            <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
              <p><strong>Submission Details:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Submission ID: ${data.submissionId}</li>
                <li>Date: ${new Date(data.submissionDate).toLocaleString()}</li>
                <li>Status: Awaiting Approval</li>
              </ul>
            </div>
            <p>Your form is now awaiting approval from the appropriate reviewer(s). You will be notified once a decision has been made.</p>
            <p>Thank you for your submission.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Form Submission Confirmed

      Dear ${data.submitterName},

      Your form "${data.formName}" has been successfully submitted.

      Submission Details:
      - Submission ID: ${data.submissionId}
      - Date: ${new Date(data.submissionDate).toLocaleString()}
      - Status: Awaiting Approval

      Your form is now awaiting approval from the appropriate reviewer(s). You will be notified once a decision has been made.

      Thank you for your submission.

      This is an automated message. Please do not reply to this email.
    `
  }),

  approvalNotification: (data) => ({
    subject: `Form Approved: ${data.formName}`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Form Approved</h2>
            <p>Dear ${data.submitterName},</p>
            <p>Great news! Your form <strong>"${data.formName}"</strong> has been approved.</p>
            <div style="background-color: #f0fff4; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
              <p><strong>Approval Details:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Submission ID: ${data.submissionId}</li>
                <li>Approved By: ${data.approverName}</li>
                <li>Approval Date: ${new Date(data.approvalDate).toLocaleString()}</li>
              </ul>
            </div>
            <p>Your form has been successfully approved and will be processed accordingly.</p>
            <p>Thank you!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Form Approved

      Dear ${data.submitterName},

      Great news! Your form "${data.formName}" has been approved.

      Approval Details:
      - Submission ID: ${data.submissionId}
      - Approved By: ${data.approverName}
      - Approval Date: ${new Date(data.approvalDate).toLocaleString()}

      Your form has been successfully approved and will be processed accordingly.

      Thank you!

      This is an automated message. Please do not reply to this email.
    `
  }),

  rejectionNotification: (data) => ({
    subject: `Form Rejected: ${data.formName}`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Form Rejected</h2>
            <p>Dear ${data.submitterName},</p>
            <p>Unfortunately, your form <strong>"${data.formName}"</strong> has been rejected.</p>
            <div style="background-color: #fff5f5; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
              <p><strong>Rejection Details:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Submission ID: ${data.submissionId}</li>
                <li>Rejected By: ${data.approverName}</li>
                <li>Reason: ${data.rejectionReason}</li>
              </ul>
            </div>
            <p>Please review the rejection reason above and resubmit your form with the necessary corrections.</p>
            <p>If you have any questions, please contact the reviewer.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Form Rejected

      Dear ${data.submitterName},

      Unfortunately, your form "${data.formName}" has been rejected.

      Rejection Details:
      - Submission ID: ${data.submissionId}
      - Rejected By: ${data.approverName}
      - Reason: ${data.rejectionReason}

      Please review the rejection reason above and resubmit your form with the necessary corrections.

      If you have any questions, please contact the reviewer.

      This is an automated message. Please do not reply to this email.
    `
  }),

  archiveNotification: (data) => ({
    subject: `Form Archived: ${data.formName}`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6c757d;">Form Archived</h2>
            <p>Dear ${data.submitterName},</p>
            <p>Your form <strong>"${data.formName}"</strong> has been archived.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #6c757d; margin: 20px 0;">
              <p><strong>Archive Details:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Submission ID: ${data.submissionId}</li>
                <li>Document ID: ${data.documentId}</li>
                <li>Archive Date: ${new Date(data.archiveDate).toLocaleString()}</li>
              </ul>
            </div>
            <p>Your form has been successfully archived and is available for future reference.</p>
            <p>Thank you!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Form Archived

      Dear ${data.submitterName},

      Your form "${data.formName}" has been archived.

      Archive Details:
      - Submission ID: ${data.submissionId}
      - Document ID: ${data.documentId}
      - Archive Date: ${new Date(data.archiveDate).toLocaleString()}

      Your form has been successfully archived and is available for future reference.

      Thank you!

      This is an automated message. Please do not reply to this email.
    `
  }),

  approverNotification: (data) => ({
    subject: `New Form Submission Awaiting Review: ${data.formName}`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ff9800;">New Submission Awaiting Review</h2>
            <p>A new form submission requires your attention.</p>
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
              <p><strong>Submission Details:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Form: ${data.formName}</li>
                <li>Submitted By: ${data.submitterName}</li>
                <li>Submission ID: ${data.submissionId}</li>
                <li>Date: ${new Date(data.submissionDate).toLocaleString()}</li>
              </ul>
            </div>
            <p>Please review this submission at your earliest convenience.</p>
            <p>Thank you!</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      New Submission Awaiting Review

      A new form submission requires your attention.

      Submission Details:
      - Form: ${data.formName}
      - Submitted By: ${data.submitterName}
      - Submission ID: ${data.submissionId}
      - Date: ${new Date(data.submissionDate).toLocaleString()}

      Please review this submission at your earliest convenience.

      Thank you!

      This is an automated message. Please do not reply to this email.
    `
  })
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
