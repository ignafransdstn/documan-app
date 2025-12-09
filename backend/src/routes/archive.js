const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
  archiveSubmission,
  getArchiveHistory,
  getDocument,
  downloadDocument,
  deleteArchived
} = require('../controllers/archiveController');

/**
 * @swagger
 * /api/archive/{submissionId}:
 *   post:
 *     summary: Archive an approved submission
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submission archived successfully
 *       400:
 *         description: Submission is not approved
 *       404:
 *         description: Submission not found
 */
router.post(
  '/:submissionId',
  verifyToken,
  (req, res) => archiveSubmission(req.params.submissionId, res)
);

/**
 * @swagger
 * /api/archive:
 *   get:
 *     summary: Get archive history
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: formId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of archived submissions
 */
router.get(
  '/',
  verifyToken,
  (req, res) => getArchiveHistory(req, res)
);

/**
 * @swagger
 * /api/archive/document/{documentId}:
 *   get:
 *     summary: Get document details
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 */
router.get(
  '/document/:documentId',
  verifyToken,
  (req, res) => getDocument(req.params.documentId, req, res)
);

/**
 * @swagger
 * /api/archive/document/{documentId}/download:
 *   get:
 *     summary: Download document file
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File download
 *       404:
 *         description: Document not found
 */
router.get(
  '/document/:documentId/download',
  verifyToken,
  (req, res) => downloadDocument(req.params.documentId, req, res)
);

/**
 * @swagger
 * /api/archive/{submissionId}:
 *   delete:
 *     summary: Delete archived submission and documents
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Submission deleted
 *       400:
 *         description: Submission is not archived
 *       404:
 *         description: Submission not found
 */
router.delete(
  '/:submissionId',
  verifyToken,
  (req, res) => deleteArchived(req.params.submissionId, req, res)
);

module.exports = router;
