/**
 * Form Submissions Controller
 * Handle form submission creation, retrieval, and draft management
 */

const { FormSubmission, Form, FormField, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Create new form submission (draft)
 * 
 * POST /api/submissions
 * Body: { formId, submissionData }
 */
exports.createSubmission = async (req, res) => {
  try {
    const { formId, submissionData } = req.body || {};
    const userId = req.user.id;

    // Validate input
    if (!formId || typeof formId !== 'number') {
      return res.status(400).json({ error: 'Form ID is required' });
    }

    if (!submissionData || typeof submissionData !== 'object') {
      return res.status(400).json({ error: 'Submission data is required' });
    }

    // Verify form exists and is active
    const form = await Form.findByPk(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.status !== 'active') {
      return res.status(400).json({ error: 'This form is not available for submission' });
    }

    // Check if user is level 4
    const user = await User.findByPk(userId);
    if (user.userLevel !== 'level4' && user.userLevel !== 'admin') {
      return res.status(403).json({ error: 'Only level 4 users can submit forms' });
    }

    // Create submission
    const submission = await FormSubmission.create({
      formId,
      submittedBy: userId,
      submissionData,
      status: 'draft'
    });

    res.status(201).json({
      success: true,
      message: 'Form submission created',
      submission: {
        id: submission.id,
        formId: submission.formId,
        status: submission.status,
        submissionData: submission.submissionData,
        createdAt: submission.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: error.message || 'Failed to create submission' });
  }
};

/**
 * Get list of submissions (for current user)
 * 
 * GET /api/submissions?page=1&limit=10&status=draft&formId=1
 */
exports.getSubmissionsList = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, formId } = req.query;
    const userId = req.user.id;

    // Build where clause
    const whereClause = {
      submittedBy: userId
    };

    if (status) {
      whereClause.status = status;
    }

    if (formId) {
      whereClause.formId = formId;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch submissions
    const { count, rows } = await FormSubmission.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'name', 'description', 'status'],
          include: {
            model: FormField,
            as: 'fields',
            attributes: ['fieldName', 'fieldType']
          }
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit,
      distinct: true
    });

    res.json({
      success: true,
      data: rows.map(sub => ({
        id: sub.id,
        formId: sub.formId,
        form: sub.form,
        status: sub.status,
        submissionData: sub.submissionData,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        submittedAt: sub.submittedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch submissions' });
  }
};

/**
 * Get submission detail
 * 
 * GET /api/submissions/:id
 */
exports.getSubmissionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const submission = await FormSubmission.findByPk(id, {
      include: [
        {
          model: Form,
          as: 'form',
          include: {
            model: FormField,
            as: 'fields',
            order: [['displayOrder', 'ASC']]
          }
        },
        {
          model: User,
          as: 'submitter',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'approver1',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'approver2',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check permission: only submitter or admin can view
    if (submission.submittedBy !== userId && req.user.userLevel !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to view this submission' });
    }

    res.json({
      success: true,
      submission: {
        id: submission.id,
        formId: submission.formId,
        form: submission.form,
        submittedBy: submission.submittedBy,
        submitter: submission.submitter,
        submissionData: submission.submissionData,
        status: submission.status,
        approver1UserId: submission.approver1UserId,
        approver1: submission.approver1,
        approver2UserId: submission.approver2UserId,
        approver2: submission.approver2,
        submittedAt: submission.submittedAt,
        approvedAt: submission.approvedAt,
        archivedAt: submission.archivedAt,
        notes: submission.notes,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching submission detail:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch submission' });
  }
};

/**
 * Update submission (draft only)
 * Auto-save untuk draft submissions
 * 
 * PATCH /api/submissions/:id
 * Body: { submissionData }
 */
exports.updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionData } = req.body || {};
    const userId = req.user.id;

    // Validate input
    if (!submissionData || typeof submissionData !== 'object') {
      return res.status(400).json({ error: 'Submission data is required' });
    }

    const submission = await FormSubmission.findByPk(id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check permission: only submitter can edit
    if (submission.submittedBy !== userId) {
      return res.status(403).json({ error: 'You do not have permission to edit this submission' });
    }

    // Only draft submissions can be edited
    if (submission.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft submissions can be edited' });
    }

    // Update submission data - merge with existing data
    submission.submissionData = { ...submission.submissionData, ...submissionData };
    submission.updatedAt = new Date();
    await submission.save();

    res.json({
      success: true,
      message: 'Submission updated',
      submission: {
        id: submission.id,
        formId: submission.formId,
        status: submission.status,
        submissionData: submission.submissionData,
        updatedAt: submission.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: error.message || 'Failed to update submission' });
  }
};

/**
 * Utility function to validate form submission data
 * Check all required fields are present
 */
exports.validateSubmissionData = async (formId, submissionData) => {
  try {
    const form = await Form.findByPk(formId, {
      include: {
        model: FormField,
        as: 'fields'
      }
    });

    if (!form) {
      return { valid: false, error: 'Form not found' };
    }

    // Check required fields
    const requiredFields = form.fields.filter(f => f.isRequired);
    const missingFields = requiredFields.filter(f => !submissionData[f.fieldName]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missingFields.map(f => f.fieldName).join(', ')}`
      };
    }

    return { valid: true };

  } catch (error) {
    return { valid: false, error: error.message };
  }
};
