const { FormSubmission, Form, User } = require('../models');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../../uploads');

/**
 * Generate a Word document from a form submission
 */
async function generateDocumentFromSubmission(req, res) {
  try {
    const { submissionId } = req.params;

    // Find the submission
    const submission = await FormSubmission.findByPk(submissionId, {
      include: [
        { model: Form, as: 'form' },
        { model: User, as: 'submitter', attributes: ['username', 'email'] }
      ]
    });

    if (!submission) {
      return res.status(404).json({
        status: false,
        message: 'Submission not found'
      });
    }

    // Check if submission is approved
    if (submission.status !== 'approved') {
      return res.status(400).json({
        status: false,
        message: 'Only approved submissions can be used to generate documents'
      });
    }

    // Generate the document
    const { documentPath, fileName } = await generateBasicDocument(submission);

    // Update submission with document info
    submission.documentGeneratedAt = new Date();
    submission.documentPath = documentPath;
    await submission.save();

    res.status(200).json({
      status: true,
      message: 'Document generated successfully',
      data: {
        fileName,
        downloadUrl: `/api/document-generation/download/${fileName}`,
        generatedAt: submission.documentGeneratedAt,
        documentSize: getFileSizeInBytes(path.join(uploadsDir, fileName))
      }
    });
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({
      status: false,
      message: 'Error generating document',
      error: error.message
    });
  }
}

/**
 * Generate a basic text document without complex template processing
 */
async function generateBasicDocument(submission) {
  const fileName = `submission_${submission.id}_${Date.now()}.txt`;
  const filePath = path.join(uploadsDir, fileName);

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  try {
    // Create basic content
    let content = `=== FORM SUBMISSION REPORT ===\n\n`;
    content += `Submission ID: ${submission.id}\n`;
    content += `Status: ${submission.status}\n`;
    content += `Submitted At: ${submission.submittedAt?.toISOString() || 'N/A'}\n`;
    content += `Approved At: ${submission.approvedAt?.toISOString() || 'N/A'}\n`;
    content += `Submitted By: ${submission.submitter?.username || 'Unknown'}\n\n`;
    content += `=== SUBMISSION DATA ===\n\n`;
    
    // Add submission data
    if (submission.submissionData && typeof submission.submissionData === 'object') {
      Object.entries(submission.submissionData).forEach(([key, value]) => {
        content += `${key}: ${JSON.stringify(value)}\n`;
      });
    }

    content += `\n=== END OF REPORT ===\n`;

    fs.writeFileSync(filePath, content, 'utf8');

    return { documentPath: filePath, fileName };
  } catch (error) {
    console.error('Basic document generation error:', error);
    throw error;
  }
}

/**
 * Download a generated document
 */
async function downloadDocument(req, res) {
  try {
    const { fileName } = req.params;

    // Prevent path traversal attacks
    if (fileName.includes('..') || fileName.includes('/')) {
      return res.status(400).json({
        status: false,
        message: 'Invalid file name'
      });
    }

    const filePath = path.join(uploadsDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: false,
        message: 'Document not found'
      });
    }

    // Send file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({
          status: false,
          message: 'Error downloading document'
        });
      }
    });
  } catch (error) {
    console.error('Error in downloadDocument:', error);
    res.status(500).json({
      status: false,
      message: 'Error downloading document',
      error: error.message
    });
  }
}

/**
 * Get document generation history for a submission
 */
async function getDocumentHistory(req, res) {
  try {
    const { submissionId } = req.params;

    // Find the submission
    const submission = await FormSubmission.findByPk(submissionId);

    if (!submission) {
      return res.status(404).json({
        status: false,
        message: 'Submission not found'
      });
    }

    // Check if document is available
    const isDocumentAvailable = submission.documentPath && 
                                fs.existsSync(path.join(uploadsDir, path.basename(submission.documentPath)));

    res.status(200).json({
      status: true,
      data: {
        submissionId: submission.id,
        documentGeneratedAt: submission.documentGeneratedAt,
        documentPath: submission.documentPath,
        isDocumentAvailable,
        submissionStatus: submission.status,
        submittedAt: submission.submittedAt,
        approvedAt: submission.approvedAt
      }
    });
  } catch (error) {
    console.error('Error in getDocumentHistory:', error);
    res.status(500).json({
      status: false,
      message: 'Error retrieving document history',
      error: error.message
    });
  }
}

/**
 * Create/upload a document template for a form
 */
async function createDocumentTemplate(req, res) {
  try {
    const { formId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: 'No file uploaded'
      });
    }

    // Find the form
    const form = await Form.findByPk(formId);

    if (!form) {
      return res.status(404).json({
        status: false,
        message: 'Form not found'
      });
    }

    // Store the template file as the originalFile
    form.originalFile = req.file.buffer;
    await form.save();

    res.status(201).json({
      status: true,
      message: 'Template uploaded successfully',
      data: {
        formId: form.id,
        templateName: req.file.originalname,
        uploadedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error in createDocumentTemplate:', error);
    res.status(500).json({
      status: false,
      message: 'Error uploading template',
      error: error.message
    });
  }
}

/**
 * Get document template information for a form
 */
async function getDocumentTemplate(req, res) {
  try {
    const { formId } = req.params;

    // Find the form
    const form = await Form.findByPk(formId);

    if (!form) {
      return res.status(404).json({
        status: false,
        message: 'Form not found'
      });
    }

    const hasTemplate = form.originalFile !== null && form.originalFile !== undefined;

    res.status(200).json({
      status: true,
      data: {
        formId: form.id,
        hasTemplate,
        templateSize: hasTemplate ? form.originalFile.length : 0,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt
      }
    });
  } catch (error) {
    console.error('Error in getDocumentTemplate:', error);
    res.status(500).json({
      status: false,
      message: 'Error retrieving template',
      error: error.message
    });
  }
}

/**
 * Helper function to get file size
 */
function getFileSizeInBytes(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

module.exports = {
  generateDocumentFromSubmission,
  downloadDocument,
  getDocumentHistory,
  createDocumentTemplate,
  getDocumentTemplate,
  generateBasicDocument
};
