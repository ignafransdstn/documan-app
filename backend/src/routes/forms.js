/**
 * Forms Routes
 * Routes untuk form template management
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, isAdmin } = require('../middlewares/auth');
const formController = require('../controllers/formController');

// Configure multer untuk file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Only accept Word documents
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.docx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .docx Word documents are accepted'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

/**
 * @route POST /api/forms/upload
 * @description Upload form template Word document
 * @access Admin only
 * @param {File} file - Word document (.docx)
 * @param {String} name - Form name
 * @param {String} description - Form description (optional)
 */
router.post('/upload', verifyToken, isAdmin, upload.single('file'), formController.uploadFormTemplate);

/**
 * @route GET /api/forms
 * @description Get all form templates with pagination and search
 * @access Authenticated users
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @query search - Search by form name
 * @query status - Filter by status (active, archived, deleted)
 */
router.get('/', verifyToken, formController.getFormsList);

/**
 * @route GET /api/forms/:id
 * @description Get form detail with fields
 * @access Authenticated users
 * @param id - Form ID
 */
router.get('/:id', verifyToken, formController.getFormDetail);

/**
 * @route PUT /api/forms/:id
 * @description Update form (name, description)
 * @access Creator or Admin
 * @param id - Form ID
 */
router.put('/:id', verifyToken, formController.updateForm);

/**
 * @route PATCH /api/forms/:id/deactivate
 * @description Deactivate form (archive)
 * @access Creator or Admin
 * @param id - Form ID
 */
router.patch('/:id/deactivate', verifyToken, formController.deactivateForm);

/**
 * @route DELETE /api/forms/:id
 * @description Delete form
 * @access Creator or Admin (only if no submissions)
 * @param id - Form ID
 */
router.delete('/:id', verifyToken, formController.deleteForm);

module.exports = router;
