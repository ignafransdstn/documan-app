const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const formApprovalController = require('../controllers/formApprovalController');

/**
 * Form Approval Endpoints
 * Endpoints untuk menyetujui atau menolak form submissions
 */

/**
 * GET /api/approvals
 * Get approval queue - list all pending approvals for current user
 * Only users with approval assigned can view
 * 
 * Query Parameters:
 *   - page (default: 1)
 *   - limit (default: 10)
 *   - submissionStatus (default: 'submitted')
 *   - sortBy (default: 'createdAt')
 *   - sortOrder (default: 'DESC')
 * 
 * Response: 200 { success, data: [...], pagination }
 */
router.get('/', verifyToken, formApprovalController.getApprovalQueue);

/**
 * GET /api/approvals/history
 * Get approval history - all completed approvals (approved or rejected)
 * 
 * Query Parameters:
 *   - page (default: 1)
 *   - limit (default: 10)
 *   - status (optional: 'approved' or 'rejected')
 * 
 * Response: 200 { success, data: [...], pagination }
 */
router.get('/history', verifyToken, formApprovalController.getApprovalHistory);

/**
 * GET /api/approvals/:id
 * Get single approval detail
 * Only assigned approver or admin can view
 * 
 * Response: 200 { success, approval }
 *         404 { error: 'Approval not found' }
 *         403 { error: 'You do not have permission...' }
 */
router.get('/:id', verifyToken, formApprovalController.getApprovalDetail);

/**
 * PATCH /api/approvals/:submissionId/approve
 * Approve a submission
 * Marks approval as approved and updates submission status
 * 
 * Body: { approverComments? }
 * 
 * Response: 200 { success, message, approval, submissionStatus }
 *         404 { error: 'No pending approval found...' }
 */
router.patch('/:submissionId/approve', verifyToken, formApprovalController.approveSubmission);

/**
 * PATCH /api/approvals/:submissionId/reject
 * Reject a submission
 * Marks approval as rejected with reason and updates submission status
 * 
 * Body: { rejectionReason (required), rejectionComments? }
 * 
 * Response: 200 { success, message, approval, submissionStatus }
 *         400 { error: 'Rejection reason is required' }
 *         404 { error: 'No pending approval found...' }
 */
router.patch('/:submissionId/reject', verifyToken, formApprovalController.rejectSubmission);

module.exports = router;
