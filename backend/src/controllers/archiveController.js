const {
  FormSubmission,
  Form,
  Document,
  User,
  FormNotification,
  sequelize
} = require('../models');
const { notifyArchive } = require('./emailNotificationController');
const fs = require('fs');
const path = require('path');

/**
 * Archive a form submission and create a document record
 * Links FormSubmission to Document table
 * Triggers archive email notification
 */
async function archiveSubmission(submissionId, res) {
  try {
    const submission = await FormSubmission.findByPk(submissionId, {
      include: [
        { model: User, as: 'submitter' },
        { model: Form, as: 'form' }
      ]
    });

    if (!submission) {
      if (res) return res.status(404).json({ success: false, error: 'Submission not found' });
      throw new Error('Submission not found');
    }

    // Check if submission is approved (can only archive approved submissions)
    if (submission.status !== 'approved') {
      if (res) {
        return res.status(400).json({
          success: false,
          error: `Cannot archive submission with status "${submission.status}". Only approved submissions can be archived.`
        });
      }
      throw new Error(`Cannot archive submission with status ${submission.status}`);
    }

    // Create or find document
    let document = await Document.findOne({
      where: { formSubmissionId: submissionId }
    });

    if (!document) {
      // Generate document file from submission data
      const fileName = `submission_${submissionId}_${Date.now()}.txt`;
      const filePath = path.join(__dirname, '../../uploads', fileName);

      // Create document content from submission data
      const documentContent = generateDocumentContent(submission);

      // Write to file
      if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
        fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
      }
      fs.writeFileSync(filePath, documentContent, 'utf8');

      // Create document record
      document = await Document.create({
        formSubmissionId: submissionId,
        documentNo: `DOC-${submissionId}-${Date.now()}`,
        title: `Archive of ${submission.form.name}`,
        filePath: fileName,
        location: 'Archive',
        description: `Archived submission for form ${submission.form.name}`,
        status: 'active',
        createdBy: submission.submittedBy
      });
    }

    // Update submission status to archived
    submission.status = 'archived';
    submission.archivedAt = new Date();
    await submission.save();

    // Send archive notification
    await notifyArchive(submissionId, document.id);

    if (res) {
      return res.status(200).json({
        success: true,
        message: 'Submission archived successfully',
        document: {
          id: document.id,
          fileName: document.filePath,
          fileSize: Buffer.byteLength(generateDocumentContent(submission), 'utf8'),
          archivedAt: new Date(),
          formSubmissionId: document.formSubmissionId
        }
      });
    }

    return {
      success: true,
      document
    };
  } catch (error) {
    console.error('Error archiving submission:', error);
    if (res) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
}

/**
 * Get archive history - all archived submissions
 */
async function getArchiveHistory(req, res) {
  try {
    const { page = 1, limit = 10, formId, userId } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: 'archived' };
    if (formId) where.formId = formId;
    if (userId) where.submittedBy = userId;

    const { count, rows } = await FormSubmission.findAndCountAll({
      where,
      include: [
        { model: Form, as: 'form' },
        { model: User, as: 'submitter' }
      ],
      order: [['archivedAt', 'DESC']],
      limit,
      offset
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting archive history:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get document details
 */
async function getDocument(documentId, req, res) {
  try {
    const document = await Document.findByPk(documentId, {
      include: [
        { model: FormSubmission, as: 'submission', include: [{ model: Form, as: 'form' }] }
      ]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    return res.status(200).json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Error getting document:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Download document file
 */
async function downloadDocument(documentId, req, res) {
  try {
    const document = await Document.findByPk(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Build full file path
    const fullPath = path.join(__dirname, '../../uploads', document.filePath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: 'Document file not found on disk'
      });
    }

    // Send file
    return res.download(fullPath, document.filePath);
  } catch (error) {
    console.error('Error downloading document:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Delete archived submission and associated document
 */
async function deleteArchived(submissionId, req, res) {
  try {
    const submission = await FormSubmission.findByPk(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    if (submission.status !== 'archived') {
      return res.status(400).json({
        success: false,
        error: 'Only archived submissions can be deleted'
      });
    }

    // Find and delete associated documents
    const documents = await Document.findAll({
      where: { formSubmissionId: submissionId }
    });

    for (const doc of documents) {
      const fullPath = path.join(__dirname, '../../uploads', doc.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      await doc.destroy();
    }

    // Delete submission
    await submission.destroy();

    return res.status(200).json({
      success: true,
      message: 'Archived submission deleted successfully',
      deletedSubmissionId: submissionId,
      deletedDocuments: documents.length
    });
  } catch (error) {
    console.error('Error deleting archived submission:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Generate document content from submission data
 */
function generateDocumentContent(submission) {
  const form = submission.form || {};
  const submitter = submission.submitter || {};

  const content = `
═══════════════════════════════════════════════════════════════════
                     FORM SUBMISSION DOCUMENT
═══════════════════════════════════════════════════════════════════

SUBMISSION INFORMATION
─────────────────────────────────────────────────────────────────
Submission ID:        ${submission.id}
Submission Date:      ${new Date(submission.createdAt).toLocaleString()}
Archived Date:        ${new Date(submission.archivedAt || new Date()).toLocaleString()}
Status:               ${submission.status.toUpperCase()}

FORM INFORMATION
─────────────────────────────────────────────────────────────────
Form Name:            ${form.name || 'N/A'}
Form ID:              ${form.id || 'N/A'}
Form Description:     ${form.description || 'N/A'}

SUBMITTER INFORMATION
─────────────────────────────────────────────────────────────────
Name:                 ${submitter.username || 'N/A'}
Email:                ${submitter.email || 'N/A'}
User Level:           ${submitter.userLevel || 'N/A'}

SUBMISSION DATA
─────────────────────────────────────────────────────────────────
${JSON.stringify(submission.submissionData, null, 2) || 'No data'}

ADDITIONAL NOTES
─────────────────────────────────────────────────────────────────
${submission.notes || 'No additional notes'}

═══════════════════════════════════════════════════════════════════
Document generated automatically by Document Management System
═══════════════════════════════════════════════════════════════════
`;

  return content.trim();
}

module.exports = {
  archiveSubmission,
  getArchiveHistory,
  getDocument,
  downloadDocument,
  deleteArchived
};
