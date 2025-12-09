const express = require('express');
const router = express.Router();
const { verifyToken, checkUserLevel, isAdmin } = require('../middlewares/auth');
const {
  generateDocumentFromSubmission,
  downloadDocument,
  getDocumentHistory,
  createDocumentTemplate,
  getDocumentTemplate
} = require('../controllers/documentGenerationController');

/**
 * @swagger
 * /api/document-generation/generate/{submissionId}:
 *   post:
 *     summary: Generate a Word document from a form submission
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document generated successfully
 *       404:
 *         description: Submission not found
 *       400:
 *         description: Submission must be approved to generate document
 */
router.post(
  '/generate/:submissionId',
  verifyToken,
  checkUserLevel(['admin', 'level1', 'level2', 'level3']),
  generateDocumentFromSubmission
);

/**
 * @swagger
 * /api/document-generation/download/{fileName}:
 *   get:
 *     summary: Download a generated document
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document file
 *       404:
 *         description: Document not found
 *       400:
 *         description: Invalid file path
 */
router.get(
  '/download/:fileName',
  verifyToken,
  downloadDocument
);

/**
 * @swagger
 * /api/document-generation/history/{submissionId}:
 *   get:
 *     summary: Get document generation history for a submission
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document history
 *       404:
 *         description: Submission not found
 */
router.get(
  '/history/:submissionId',
  verifyToken,
  getDocumentHistory
);

/**
 * @swagger
 * /api/document-generation/templates:
 *   post:
 *     summary: Upload a custom document template for a form
 *     responses:
 *       201:
 *         description: Template uploaded successfully
 *       400:
 *         description: Invalid file
 */
router.post(
  '/templates',
  verifyToken,
  isAdmin,
  createDocumentTemplate
);

/**
 * @swagger
 * /api/document-generation/templates/{formId}:
 *   get:
 *     summary: Get document template for a form
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Template information
 *       404:
 *         description: Template not found
 */
router.get(
  '/templates/:formId',
  verifyToken,
  getDocumentTemplate
);

module.exports = router;
