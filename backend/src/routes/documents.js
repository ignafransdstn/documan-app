const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, checkUserLevel } = require('../middlewares/auth');
const preventScreenCapture = require('../middlewares/screenCapture');
const {
  createDocument,
  createSubDocument,
  getAllDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  deleteSubDocument,
  downloadDocument,
  downloadSubDocument,
  updateSubDocumentNumber,
  updateDocumentInfo,
  updateSubDocumentInfo
} = require('../controllers/documentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     DocumentRequest:
 *       type: object
 *       required:
 *         - title
 *         - location
 *       properties:
 *         title:
 *           type: string
 *           description: Document title
 *         location:
 *           type: string
 *           description: Document location/category
 *         status:
 *           type: string
 *           enum: [active, archived, deleted]
 *           default: active
 *           description: Document status
 *     SubDocumentRequest:
 *       type: object
 *       required:
 *         - title
 *         - location
 *         - parentDocumentId
 *       properties:
 *         title:
 *           type: string
 *           description: Sub-document title
 *         location:
 *           type: string
 *           description: Sub-document location/category
 *         parentDocumentId:
 *           type: integer
 *           description: Parent document ID
 *         status:
 *           type: string
 *           enum: [active, archived, deleted]
 *           default: active
 *           description: Sub-document status
 */

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '.pdf');
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only PDF files
    const extname = path.extname(file.originalname).toLowerCase() === '.pdf';
    const mimetype = file.mimetype === 'application/pdf';

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only PDF files are allowed.'));
  }
});

// Protect all routes
router.use(verifyToken);
router.use((req, res, next) => preventScreenCapture(req, res, next));

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Create a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - title
 *               - location
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file (max 10MB)
 *               title:
 *                 type: string
 *                 description: Document title
 *               location:
 *                 type: string
 *                 description: Document location/category
 *               status:
 *                 type: string
 *                 enum: [active, archived, deleted]
 *                 default: active
 *     responses:
 *       201:
 *         description: Document created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       400:
 *         description: No file uploaded or validation error
 *       403:
 *         description: Access denied (Level 3 users cannot create documents)
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  checkUserLevel(['admin', 'level1', 'level2']),
  upload.single('document'),
  createDocument
);

/**
 * @swagger
 * /documents/sub-document:
 *   post:
 *     summary: Create a new sub-document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - title
 *               - location
 *               - parentDocumentId
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Sub-document file (max 10MB)
 *               title:
 *                 type: string
 *                 description: Sub-document title
 *               location:
 *                 type: string
 *                 description: Sub-document location/category
 *               parentDocumentId:
 *                 type: integer
 *                 description: Parent document ID
 *               status:
 *                 type: string
 *                 enum: [active, archived, deleted]
 *                 default: active
 *     responses:
 *       201:
 *         description: Sub-document created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubDocument'
 *       400:
 *         description: No file uploaded or validation error
 *       403:
 *         description: Access denied (Level 3 users cannot create sub-documents)
 *       404:
 *         description: Parent document not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/sub-document',
  checkUserLevel(['admin', 'level1', 'level2']),
  upload.single('document'),
  createSubDocument
);

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Get all documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', getAllDocuments);

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getDocumentById);

/**
 * @swagger
 * /documents/{id}:
 *   put:
 *     summary: Update document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentRequest'
 *     responses:
 *       200:
 *         description: Document updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       403:
 *         description: Access denied (Level 3 users cannot update documents)
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  checkUserLevel(['admin', 'level1', 'level2']),
  updateDocument
);

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Document deleted successfully
 *       403:
 *         description: Access denied (Only Admin and Level 1 users can delete documents)
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  checkUserLevel(['admin', 'level1']),
  deleteDocument
);

/**
 * @swagger
 * /documents/download/{id}:
 *   get:
 *     summary: Download document file
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document file download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Access denied (Level 3 users cannot download documents)
 *       404:
 *         description: Document not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/download/:id',
  checkUserLevel(['admin', 'level1', 'level2']),
  downloadDocument
);

/**
 * @swagger
 * /documents/sub-document/download/{id}:
 *   get:
 *     summary: Download a sub-document file
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sub-document ID
 *     responses:
 *       200:
 *         description: Sub-document file download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Access denied (Level 3 users cannot download documents)
 *       404:
 *         description: Sub-document not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/sub-document/download/:id',
  checkUserLevel(['admin', 'level1', 'level2']),
  downloadSubDocument
);

/**
 * @swagger
 * /documents/sub-document/{id}/number:
 *   patch:
 *     summary: Update sub-document number
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sub-document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subDocumentNo
 *             properties:
 *               subDocumentNo:
 *                 type: string
 *                 description: New sub-document number (will be auto-formatted to SUB-XXX)
 *     responses:
 *       200:
 *         description: Sub-document number updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sub-document not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/sub-document/:id/number',
  checkUserLevel(['admin', 'level1', 'level2']),
  updateSubDocumentNumber
);

/**
 * @swagger
 * /documents/{id}/info:
 *   patch:
 *     summary: Update document title and location
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Document not found
 */
router.patch(
  '/:id/info',
  checkUserLevel(['admin', 'level1', 'level2']),
  updateDocumentInfo
);

/**
 * @swagger
 * /documents/sub-document/{id}/info:
 *   patch:
 *     summary: Update sub-document title and location
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sub-document updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sub-document not found
 */
router.patch(
  '/sub-document/:id/info',
  checkUserLevel(['admin', 'level1', 'level2']),
  updateSubDocumentInfo
);

/**
 * @swagger
 * /documents/sub-document/{id}:
 *   delete:
 *     summary: Delete a sub-document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sub-document deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sub-document not found
 */
router.delete(
  '/sub-document/:id',
  checkUserLevel(['admin', 'level1']),
  deleteSubDocument
);

module.exports = router;