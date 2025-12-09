/**
 * Forms Controller
 * Handle form template upload, extraction, and CRUD operations
 */

const { Form, FormField, FormSubmission } = require('../models');
const { extractFieldsFromWordDocument, isValidWordDocument, getDocumentInfo } = require('../utils/wordParser');
const { Op } = require('sequelize');

/**
 * Upload form template (Word document)
 * Extract fields dan simpan ke database
 * 
 * POST /api/forms/upload
 * Body: multipart/form-data
 *   - file: Word document
 *   - name: Form name
 *   - description: Form description (optional)
 *   - approver1UserId: Admin user ID untuk approver 1
 *   - approver2UserId: Admin user ID untuk approver 2 (optional)
 */
exports.uploadFormTemplate = async (req, res) => {
  try {
    const { name, description, approver1UserId, approver2UserId } = req.body || {};
    const userId = req.user.id;
    
    // Validate input
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Form name is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Word document file is required' });
    }

    // Validate file format
    const isValid = await isValidWordDocument(req.file.buffer);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid Word document format. Please upload a valid .docx file' });
    }

    // Get document info
    const docInfo = await getDocumentInfo(req.file.buffer);
    if (!docInfo.isValid) {
      return res.status(400).json({ error: `Cannot read document: ${docInfo.error}` });
    }

    // Extract fields dari document
    const extractedFields = await extractFieldsFromWordDocument(req.file.buffer);
    
    if (extractedFields.length === 0) {
      return res.status(400).json({ 
        error: 'No form fields found. Please ensure your Word document contains field placeholders like {fieldName}' 
      });
    }

    // Create Form record
    const form = await Form.create({
      name: name.trim(),
      description: description?.trim() || null,
      originalFile: req.file.buffer,
      status: 'active',
      createdBy: userId
    });

    // Create FormField records
    const formFields = await Promise.all(
      extractedFields.map((field, index) =>
        FormField.create({
          formId: form.id,
          fieldName: field.fieldName,
          fieldType: field.fieldType || 'text',
          isRequired: field.isRequired !== false,
          placeholder: field.placeholder || `Enter ${field.fieldName}`,
          displayOrder: index,
          validationRules: null
        })
      )
    );

    // Fetch complete form dengan fields
    const completeForm = await Form.findByPk(form.id, {
      include: {
        model: FormField,
        as: 'fields'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Form template uploaded successfully',
      form: completeForm,
      fieldCount: formFields.length
    });

  } catch (error) {
    console.error('Error uploading form template:', error);
    res.status(500).json({ error: error.message || 'Failed to upload form template' });
  }
};

/**
 * Get all form templates (with pagination and search)
 * 
 * GET /api/forms?page=1&limit=10&search=name&status=active
 */
exports.getFormsList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || 'active';
    const offset = (page - 1) * limit;

    const whereClause = {
      status: status
    };

    if (search) {
      whereClause.name = {
        [Op.iLike]: `%${search}%`
      };
    }

    const { count, rows } = await Form.findAndCountAll({
      where: whereClause,
      include: {
        model: FormField,
        as: 'fields',
        attributes: ['id', 'fieldName', 'fieldType']
      },
      order: [['createdAt', 'DESC']],
      offset,
      limit,
      distinct: true
    });

    // Tambah field count untuk setiap form
    const formsWithStats = rows.map(form => ({
      ...form.toJSON(),
      fieldCount: form.fields.length,
      submissionCount: 0 // Will be updated if needed
    }));

    res.json({
      success: true,
      data: formsWithStats,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching forms list:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch forms' });
  }
};

/**
 * Get form detail dengan fields
 * 
 * GET /api/forms/:id
 */
exports.getFormDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findByPk(id, {
      include: {
        model: FormField,
        as: 'fields',
        order: [['displayOrder', 'ASC']]
      }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Count submissions
    const submissionCount = await FormSubmission.count({ where: { formId: id } });

    res.json({
      success: true,
      form: {
        ...form.toJSON(),
        fieldCount: form.fields.length,
        submissionCount
      }
    });

  } catch (error) {
    console.error('Error fetching form detail:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch form' });
  }
};

/**
 * Update form (name, description only)
 * 
 * PUT /api/forms/:id
 * Body: { name, description }
 */
exports.updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    const form = await Form.findByPk(id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check permission (only creator can edit)
    if (form.createdBy !== userId && req.user.userLevel !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this form' });
    }

    // Validate name if provided
    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({ error: 'Form name cannot be empty' });
    }

    // Update
    if (name) form.name = name.trim();
    if (description !== undefined) form.description = description?.trim() || null;

    await form.save();

    const updatedForm = await Form.findByPk(id, {
      include: { model: FormField, as: 'fields' }
    });

    res.json({
      success: true,
      message: 'Form updated successfully',
      form: updatedForm
    });

  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: error.message || 'Failed to update form' });
  }
};

/**
 * Deactivate form (soft delete)
 * 
 * PATCH /api/forms/:id/deactivate
 */
exports.deactivateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const form = await Form.findByPk(id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check permission
    if (form.createdBy !== userId && req.user.userLevel !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to deactivate this form' });
    }

    form.status = 'archived';
    await form.save();

    res.json({
      success: true,
      message: 'Form deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating form:', error);
    res.status(500).json({ error: error.message || 'Failed to deactivate form' });
  }
};

/**
 * Delete form (hard delete)
 * 
 * DELETE /api/forms/:id
 */
exports.deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const form = await Form.findByPk(id);

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check permission (only creator or admin)
    if (form.createdBy !== userId && req.user.userLevel !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this form' });
    }

    // Check if form has submissions
    const submissionCount = await FormSubmission.count({ where: { formId: id } });
    if (submissionCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete form with existing submissions (${submissionCount} submissions)` 
      });
    }

    await form.destroy();

    res.json({
      success: true,
      message: 'Form deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: error.message || 'Failed to delete form' });
  }
};
