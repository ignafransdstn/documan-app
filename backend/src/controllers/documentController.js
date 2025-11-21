const { Document, SubDocument, User } = require('../models');
const { sequelize } = require('../models');
const fs = require('fs').promises;
const path = require('path');
const { logActivity } = require('../utils/activityLogger');

const createDocument = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { title, location, status, description, longitude, latitude } = req.body;
    const file = req.file;

    if (!file) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Generate unique document number MD-000001 with lock
    // Get all documentNos and parse to find max
    const allDocs = await Document.findAll({
      attributes: ['documentNo'],
      transaction
    });
    
    let nextNumber = 1;
    if (allDocs.length > 0) {
      const numbers = allDocs
        .map(d => parseInt(d.documentNo.replace('MD-', '')))
        .filter(n => !isNaN(n));
      
      console.log('📋 All documentNos:', allDocs.map(d => d.documentNo));
      console.log('🔢 Parsed numbers:', numbers);
      
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }
    const documentNo = `MD-${nextNumber.toString().padStart(6, '0')}`;
    console.log('✨ Generated documentNo:', documentNo);

    const document = await Document.create({
      documentNo,
      title,
      location,
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      description: description || '',
      status,
      filePath: file.path,
      createdBy: req.user.id,
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      }
    }, { transaction });

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'document',
      entityId: document.id,
      description: `Created master document: ${title}`,
      req
    });

    await transaction.commit();
    res.status(201).json(document);
  } catch (error) {
    await transaction.rollback();
    console.error('Create document error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    res.status(500).json({ 
      message: 'Error creating document',
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : undefined
    });
  }
};

const createSubDocument = async (req, res) => {
  try {
    const { title, location, status, parentDocumentId, subDocumentNo, description, longitude, latitude } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!subDocumentNo) {
      return res.status(400).json({ message: 'Sub Document No is required' });
    }

    // Check if parent document exists
    const parentDocument = await Document.findByPk(parentDocumentId);
    if (!parentDocument) {
      return res.status(404).json({ message: 'Parent document not found' });
    }

    // Auto-format subDocumentNo to SUB-XXX if not already formatted
    let formattedSubDocNo = subDocumentNo;
    if (!subDocumentNo.startsWith('SUB-')) {
      const numOnly = subDocumentNo.replace(/\D/g, '');
      formattedSubDocNo = `SUB-${numOnly.padStart(3, '0')}`;
    }

    const subDocument = await SubDocument.create({
      title,
      location,
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      description: description || '',
      status,
      subDocumentNo: formattedSubDocNo,
      filePath: file.path,
      parentDocumentId,
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      }
    });

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'subdocument',
      entityId: subDocument.id,
      description: `Created sub-document: ${title}`,
      req
    });

    res.status(201).json(subDocument);
  } catch (error) {
    console.error('Create sub-document error:', error);
    res.status(500).json({ message: 'Error creating sub-document' });
  }
};

const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        },
        {
          model: SubDocument,
          as: 'subDocuments'
        }
      ]
    });
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Error getting documents' });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        },
        {
          model: SubDocument,
          as: 'subDocuments'
        }
      ]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Error getting document' });
  }
};

const updateDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user.userLevel === 'level3') {
      return res.status(403).json({ message: 'Not authorized to update documents' });
    }

    const { title, location, status } = req.body;
    await document.update({ title, location, status });

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'document',
      entityId: document.id,
      description: `Updated master document: ${document.title}`,
      req
    });

    res.json(document);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Error updating document' });
  }
};

const updateDocumentInfo = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions
    if (req.user.userLevel === 'level3') {
      return res.status(403).json({ message: 'Not authorized to update documents' });
    }

    const { title, location, description, longitude, latitude } = req.body;
    
    if (title !== undefined) document.title = title;
    if (location !== undefined) document.location = location;
    if (description !== undefined) document.description = description;
    if (longitude !== undefined) document.longitude = longitude ? parseFloat(longitude) : null;
    if (latitude !== undefined) document.latitude = latitude ? parseFloat(latitude) : null;
    
    await document.save();

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'document',
      entityId: document.id,
      description: `Updated document info: ${document.title}`,
      req
    });

    res.json(document);
  } catch (error) {
    console.error('Update document info error:', error);
    res.status(500).json({ message: 'Error updating document info' });
  }
};

const updateSubDocumentInfo = async (req, res) => {
  try {
    const subDocument = await SubDocument.findByPk(req.params.id);

    if (!subDocument) {
      return res.status(404).json({ message: 'Sub-document not found' });
    }

    // Check permissions
    if (req.user.userLevel === 'level3') {
      return res.status(403).json({ message: 'Not authorized to update sub-documents' });
    }

    const { title, location, description, longitude, latitude } = req.body;
    
    if (title !== undefined) subDocument.title = title;
    if (location !== undefined) subDocument.location = location;
    if (description !== undefined) subDocument.description = description;
    if (longitude !== undefined) subDocument.longitude = longitude ? parseFloat(longitude) : null;
    if (latitude !== undefined) subDocument.latitude = latitude ? parseFloat(latitude) : null;
    
    await subDocument.save();

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'subdocument',
      entityId: subDocument.id,
      description: `Updated sub-document info: ${subDocument.title}`,
      req
    });

    res.json(subDocument);
  } catch (error) {
    console.error('Update sub-document info error:', error);
    res.status(500).json({ message: 'Error updating sub-document info' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id, {
      include: [{
        model: SubDocument,
        as: 'subDocuments'
      }]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions based on user level
    if (!['admin', 'level1'].includes(req.user.userLevel)) {
      return res.status(403).json({ message: 'Not authorized to delete documents' });
    }

    try {
      // Delete file from storage
      await fs.unlink(document.filePath);
    } catch (error) {
      // If file doesn't exist, continue with deletion
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Delete related sub-documents
    const subDocuments = await SubDocument.findAll({
      where: { parentDocumentId: document.id }
    });

    for (const subDoc of subDocuments) {
      try {
        await fs.unlink(subDoc.filePath);
      } catch (error) {
        // If file doesn't exist, continue with deletion
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
      await subDoc.destroy();
    }

    // Log activity before deleting
    const documentTitle = document.title;
    const documentId = document.id;
    
    await document.destroy();

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'document',
      entityId: documentId,
      description: `Deleted master document: ${documentTitle}`,
      req
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Error deleting document' });
  }
};

const deleteSubDocument = async (req, res) => {
  try {
    const subDocument = await SubDocument.findByPk(req.params.id);

    if (!subDocument) {
      return res.status(404).json({ message: 'Sub-document not found' });
    }

    // Check permissions
    if (!['admin', 'level1'].includes(req.user.userLevel)) {
      return res.status(403).json({ message: 'Not authorized to delete sub-documents' });
    }

    // Delete the file from filesystem
    if (subDocument.filePath) {
      try {
        await fs.unlink(subDocument.filePath);
      } catch (err) {
        console.warn('File already deleted or not found:', err.message);
      }
    }

    // Store info before deleting
    const subDocTitle = subDocument.title;
    const subDocId = subDocument.id;

    await subDocument.destroy();

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'subdocument',
      entityId: subDocId,
      description: `Deleted sub-document: ${subDocTitle}`,
      req
    });

    res.json({ message: 'Sub-document deleted successfully' });
  } catch (error) {
    console.error('Delete sub-document error:', error);
    res.status(500).json({ message: 'Error deleting sub-document' });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions based on user level
    if (req.user.userLevel === 'level3') {
      return res.status(403).json({ message: 'Not authorized to download documents' });
    }

    // Log download activity
    await logActivity({
      userId: req.user.id,
      action: 'DOWNLOAD',
      entityType: 'document',
      entityId: document.id,
      description: `Downloaded master document: ${document.title}`,
      req
    });

    res.download(document.filePath);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Error downloading document' });
  }
};

const downloadSubDocument = async (req, res) => {
  try {
    const subDocument = await SubDocument.findByPk(req.params.id);

    if (!subDocument) {
      return res.status(404).json({ message: 'Sub-document not found' });
    }

    // Check permissions based on user level
    if (req.user.userLevel === 'level3') {
      return res.status(403).json({ message: 'Not authorized to download documents' });
    }

    // Log download activity
    await logActivity({
      userId: req.user.id,
      action: 'DOWNLOAD',
      entityType: 'subdocument',
      entityId: subDocument.id,
      description: `Downloaded sub-document: ${subDocument.title}`,
      req
    });

    res.download(subDocument.filePath);
  } catch (error) {
    console.error('Download sub-document error:', error);
    res.status(500).json({ message: 'Error downloading sub-document' });
  }
};

const updateSubDocumentNumber = async (req, res) => {
  try {
    const { subDocumentNo } = req.body;
    const subDocument = await SubDocument.findByPk(req.params.id);

    if (!subDocument) {
      return res.status(404).json({ message: 'Sub-document not found' });
    }

    // Check permissions - only admin, level1, level2 can update
    if (req.user.userLevel === 'level3') {
      return res.status(403).json({ message: 'Not authorized to update sub-documents' });
    }

    if (!subDocumentNo) {
      return res.status(400).json({ message: 'Sub Document No is required' });
    }

    // Auto-format subDocumentNo to SUB-XXX if not already formatted
    let formattedSubDocNo = subDocumentNo;
    if (!subDocumentNo.startsWith('SUB-')) {
      const numOnly = subDocumentNo.replace(/\D/g, '');
      formattedSubDocNo = `SUB-${numOnly.padStart(3, '0')}`;
    }

    subDocument.subDocumentNo = formattedSubDocNo;
    await subDocument.save();

    res.json(subDocument);
  } catch (error) {
    console.error('Update sub-document number error:', error);
    res.status(500).json({ message: 'Error updating sub-document number' });
  }
};

module.exports = {
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
};