/**
 * Submission Routes
 * Routes untuk form submission management
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const submissionController = require('../controllers/submissionController');

/**
 * @route POST /api/submissions
 * @description Create new form submission (draft)
 * @access Authenticated users (level 4 or admin)
 * @body { formId, submissionData }
 */
router.post('/', verifyToken, submissionController.createSubmission);

/**
 * @route GET /api/submissions
 * @description Get list of submissions for current user
 * @access Authenticated users
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @query status - Filter by status (draft, submitted, approved, rejected, archived)
 * @query formId - Filter by form ID
 */
router.get('/', verifyToken, submissionController.getSubmissionsList);

/**
 * @route GET /api/submissions/:id
 * @description Get submission detail
 * @access Authenticated users (submitter or admin)
 * @param id - Submission ID
 */
router.get('/:id', verifyToken, submissionController.getSubmissionDetail);

/**
 * @route PATCH /api/submissions/:id
 * @description Update submission (draft only - auto-save)
 * @access Authenticated users (submitter only)
 * @param id - Submission ID
 * @body { submissionData }
 */
router.patch('/:id', verifyToken, submissionController.updateSubmission);

module.exports = router;
