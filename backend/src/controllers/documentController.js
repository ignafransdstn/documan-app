const { Document, SubDocument, User, DocumentVersion } = require('../models');
const { sequelize } = require('../models');
const fs = require('fs').promises;
const path = require('path');
const { logActivity } = require('../utils/activityLogger');

const FIELD_LABELS = {
  title: 'Title',
  location: 'Location',
  description: 'Description',
  category: 'Category',
  longitude: 'Longitude',
  latitude: 'Latitude',
  certificateType: 'Certificate Type',
  landSize: 'Land Size',
  areaName: 'Area Name',
  projectName: 'Project Name',
  zoneUrl: 'Zone URL',
  zoneRtdr: 'Zone RTDR',
  publishDate: 'Publish Date',
  expiredDate: 'Expired Date',
  documentObtained: 'Document Obtained',
  issuingAgency: 'Issuing Agency',
  originDocument: 'Origin Document',
  physicalLocation: 'Physical Location',
  physicalLocationDetail: 'Physical Location Detail',
  previousOwner: 'Previous Owner',
  company: 'Company',
  permitNumber: 'Permit Number',
  status: 'Status',
};

const createDocument = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { 
      title, location, status, description, category, longitude, latitude,
      certificateType, landSize, areaName, projectName, zoneUrl, zoneRtdr,
      publishDate, expiredDate, documentObtained, issuingAgency, originDocument, physicalLocation, physicalLocationDetail, previousOwner, company,
      permitNumber
    } = req.body;
    const file = req.file;

    if (!file) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate mandatory fields
    if (!certificateType) {
      await transaction.rollback();
      return res.status(400).json({ message: 'certificateType is required' });
    }
    if (!publishDate) {
      await transaction.rollback();
      return res.status(400).json({ message: 'publishDate is required' });
    }
    if (!company) {
      await transaction.rollback();
      return res.status(400).json({ message: 'company is required' });
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
      
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }
    const documentNo = `MD-${nextNumber.toString().padStart(6, '0')}`;

    const document = await Document.create({
      documentNo,
      title,
      location,
      category: category || 'Corporate Document',
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      description: description || '',
      status,
      filePath: file.path,
      createdBy: req.user.id,
      certificateType,
      landSize: landSize || null,
      areaName: areaName || null,
      projectName: projectName || null,
      zoneUrl: zoneUrl || null,
      zoneRtdr: zoneRtdr || null,
      publishDate: publishDate ? new Date(publishDate) : null,
      expiredDate: expiredDate ? new Date(expiredDate) : null,
      documentObtained: documentObtained ? new Date(documentObtained) : null,
      issuingAgency: issuingAgency || null,
      originDocument: originDocument || null,
      physicalLocation: physicalLocation || null,
      physicalLocationDetail: physicalLocationDetail || null,
      previousOwner: previousOwner || null,
      company,
      permitNumber: permitNumber || null,
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
    const { 
      title, location, status, parentDocumentId, subDocumentNo, description, category, longitude, latitude,
      certificateType, landSize, areaName, projectName, zoneUrl, zoneRtdr,
      publishDate, expiredDate, documentObtained, issuingAgency, originDocument, physicalLocation, physicalLocationDetail, previousOwner, company,
      permitNumber
    } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!subDocumentNo) {
      return res.status(400).json({ message: 'Sub Document No is required' });
    }

    // Validate mandatory fields
    if (!certificateType) {
      return res.status(400).json({ message: 'certificateType is required' });
    }
    if (!publishDate) {
      return res.status(400).json({ message: 'publishDate is required' });
    }
    if (!company) {
      return res.status(400).json({ message: 'company is required' });
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
      category: category || 'Corporate Document',
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      description: description || '',
      status,
      subDocumentNo: formattedSubDocNo,
      filePath: file.path,
      parentDocumentId,
      certificateType,
      landSize: landSize || null,
      areaName: areaName || null,
      projectName: projectName || null,
      zoneUrl: zoneUrl || null,
      zoneRtdr: zoneRtdr || null,
      publishDate: publishDate ? new Date(publishDate) : null,
      expiredDate: expiredDate ? new Date(expiredDate) : null,
      documentObtained: documentObtained ? new Date(documentObtained) : null,
      issuingAgency: issuingAgency || null,
      originDocument: originDocument || null,
      physicalLocation: physicalLocation || null,
      physicalLocationDetail: physicalLocationDetail || null,
      previousOwner: previousOwner || null,
      company,
      permitNumber: permitNumber || null,
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

    const { 
      title, location, status, description, longitude, latitude,
      certificateType, landSize, areaName, projectName, zoneUrl, zoneRtdr,
      publishDate, expiredDate, documentObtained, originDocument, previousOwner, company
    } = req.body;
    
    // Validate mandatory fields if provided
    if (certificateType !== undefined && !certificateType) {
      return res.status(400).json({ message: 'certificateType is required' });
    }
    if (publishDate !== undefined && !publishDate) {
      return res.status(400).json({ message: 'publishDate is required' });
    }
    if (company !== undefined && !company) {
      return res.status(400).json({ message: 'company is required' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (certificateType !== undefined) updateData.certificateType = certificateType;
    if (landSize !== undefined) updateData.landSize = landSize;
    if (areaName !== undefined) updateData.areaName = areaName;
    if (projectName !== undefined) updateData.projectName = projectName;
    if (zoneUrl !== undefined) updateData.zoneUrl = zoneUrl;
    if (zoneRtdr !== undefined) updateData.zoneRtdr = zoneRtdr;
    if (publishDate !== undefined) updateData.publishDate = publishDate ? new Date(publishDate) : null;
    if (expiredDate !== undefined) updateData.expiredDate = expiredDate ? new Date(expiredDate) : null;
    if (documentObtained !== undefined) updateData.documentObtained = documentObtained ? new Date(documentObtained) : null;
    if (originDocument !== undefined) updateData.originDocument = originDocument;
    if (previousOwner !== undefined) updateData.previousOwner = previousOwner;
    if (company !== undefined) updateData.company = company;

    // Capture original values before update for change detection
    const origValues = {};
    Object.keys(updateData).forEach(f => { origValues[f] = document[f]; });

    await document.update(updateData);

    // Build detailed change description
    const statusChangedDoc = 'status' in updateData && String(origValues.status) !== String(updateData.status);
    let updateDescDoc;
    if (statusChangedDoc) {
      updateDescDoc = `Status changed: ${document.title} (${origValues.status} → ${updateData.status})`;
    } else {
      const changedKeys = Object.keys(updateData).filter(f => String(origValues[f]) !== String(updateData[f]));
      const fieldList = changedKeys.slice(0, 4).map(f => FIELD_LABELS[f] || f).join(', ');
      updateDescDoc = `Updated master document: ${document.title}${fieldList ? ' [' + fieldList + ']' : ''}`;
    }

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'document',
      entityId: document.id,
      description: updateDescDoc,
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

    const { 
      title, location, description, category, longitude, latitude,
      certificateType, landSize, areaName, projectName, zoneUrl, zoneRtdr,
      publishDate, expiredDate, documentObtained, issuingAgency, originDocument, physicalLocation, physicalLocationDetail, previousOwner, company,
      permitNumber, status
    } = req.body;
    
    // Validate mandatory fields if provided
    if (certificateType !== undefined && !certificateType) {
      return res.status(400).json({ message: 'certificateType is required' });
    }
    if (publishDate !== undefined && !publishDate) {
      return res.status(400).json({ message: 'publishDate is required' });
    }
    if (company !== undefined && !company) {
      return res.status(400).json({ message: 'company is required' });
    }
    
    if (title !== undefined) document.title = title;
    if (location !== undefined) document.location = location;
    if (description !== undefined) document.description = description;
    if (category !== undefined) document.category = category;
    if (longitude !== undefined) document.longitude = longitude ? parseFloat(longitude) : null;
    if (latitude !== undefined) document.latitude = latitude ? parseFloat(latitude) : null;
    if (certificateType !== undefined) document.certificateType = certificateType;
    if (landSize !== undefined) document.landSize = landSize;
    if (areaName !== undefined) document.areaName = areaName;
    if (projectName !== undefined) document.projectName = projectName;
    if (zoneUrl !== undefined) document.zoneUrl = zoneUrl;
    if (zoneRtdr !== undefined) document.zoneRtdr = zoneRtdr;
    if (publishDate !== undefined) document.publishDate = publishDate ? new Date(publishDate) : null;
    if (expiredDate !== undefined) document.expiredDate = expiredDate ? new Date(expiredDate) : null;
    if (documentObtained !== undefined) document.documentObtained = documentObtained ? new Date(documentObtained) : null;
    if (issuingAgency !== undefined) document.issuingAgency = issuingAgency;
    if (originDocument !== undefined) document.originDocument = originDocument;
    if (physicalLocation !== undefined) document.physicalLocation = physicalLocation || null;
    if (physicalLocationDetail !== undefined) document.physicalLocationDetail = physicalLocationDetail || null;
    if (previousOwner !== undefined) document.previousOwner = previousOwner;
    if (company !== undefined) document.company = company;
    if (permitNumber !== undefined) document.permitNumber = permitNumber;
    if (status !== undefined) document.status = status;

    // Capture changed fields before save
    const changedFieldsDoc = document.changed() || [];
    const fieldChangesDoc = {};
    changedFieldsDoc.forEach(f => { fieldChangesDoc[f] = { from: document.previous(f), to: document[f] }; });

    await document.save();

    // Build detailed change description
    const statusChangedInfo = 'status' in fieldChangesDoc;
    let updateDescInfo;
    if (statusChangedInfo) {
      updateDescInfo = `Status changed: ${document.title} (${fieldChangesDoc.status.from} → ${fieldChangesDoc.status.to})`;
    } else {
      const fields = changedFieldsDoc.filter(f => f !== 'updatedAt').slice(0, 4).map(f => FIELD_LABELS[f] || f).join(', ');
      updateDescInfo = `Updated document info: ${document.title}${fields ? ' [' + fields + ']' : ''}`;
    }

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'document',
      entityId: document.id,
      description: updateDescInfo,
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

    const { 
      title, location, description, category, longitude, latitude,
      certificateType, landSize, areaName, projectName, zoneUrl, zoneRtdr,
      publishDate, expiredDate, documentObtained, issuingAgency, originDocument, physicalLocation, physicalLocationDetail, previousOwner, company,
      permitNumber, status
    } = req.body;
    
    // Validate mandatory fields if provided
    if (certificateType !== undefined && !certificateType) {
      return res.status(400).json({ message: 'certificateType is required' });
    }
    if (publishDate !== undefined && !publishDate) {
      return res.status(400).json({ message: 'publishDate is required' });
    }
    if (company !== undefined && !company) {
      return res.status(400).json({ message: 'company is required' });
    }
    
    if (title !== undefined) subDocument.title = title;
    if (location !== undefined) subDocument.location = location;
    if (description !== undefined) subDocument.description = description;
    if (category !== undefined) subDocument.category = category;
    if (longitude !== undefined) subDocument.longitude = longitude ? parseFloat(longitude) : null;
    if (latitude !== undefined) subDocument.latitude = latitude ? parseFloat(latitude) : null;
    if (certificateType !== undefined) subDocument.certificateType = certificateType;
    if (landSize !== undefined) subDocument.landSize = landSize;
    if (areaName !== undefined) subDocument.areaName = areaName;
    if (projectName !== undefined) subDocument.projectName = projectName;
    if (zoneUrl !== undefined) subDocument.zoneUrl = zoneUrl;
    if (zoneRtdr !== undefined) subDocument.zoneRtdr = zoneRtdr;
    if (publishDate !== undefined) subDocument.publishDate = publishDate ? new Date(publishDate) : null;
    if (expiredDate !== undefined) subDocument.expiredDate = expiredDate ? new Date(expiredDate) : null;
    if (documentObtained !== undefined) subDocument.documentObtained = documentObtained ? new Date(documentObtained) : null;
    if (issuingAgency !== undefined) subDocument.issuingAgency = issuingAgency;
    if (permitNumber !== undefined) subDocument.permitNumber = permitNumber;
    if (originDocument !== undefined) subDocument.originDocument = originDocument;
    if (physicalLocation !== undefined) subDocument.physicalLocation = physicalLocation || null;
    if (physicalLocationDetail !== undefined) subDocument.physicalLocationDetail = physicalLocationDetail || null;
    if (previousOwner !== undefined) subDocument.previousOwner = previousOwner;
    if (company !== undefined) subDocument.company = company;
    if (status !== undefined) subDocument.status = status;

    // Capture changed fields before save
    const changedFieldsSub = subDocument.changed() || [];
    const fieldChangesSub = {};
    changedFieldsSub.forEach(f => { fieldChangesSub[f] = { from: subDocument.previous(f), to: subDocument[f] }; });

    await subDocument.save();

    // Build detailed change description
    const statusChangedSub = 'status' in fieldChangesSub;
    let updateDescSub;
    if (statusChangedSub) {
      updateDescSub = `Status changed: ${subDocument.title} (${fieldChangesSub.status.from} → ${fieldChangesSub.status.to})`;
    } else {
      const fields = changedFieldsSub.filter(f => f !== 'updatedAt').slice(0, 4).map(f => FIELD_LABELS[f] || f).join(', ');
      updateDescSub = `Updated sub-document info: ${subDocument.title}${fields ? ' [' + fields + ']' : ''}`;
    }

    // Log activity
    await logActivity({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'subdocument',
      entityId: subDocument.id,
      description: updateDescSub,
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

// ─── Document Version functions ───────────────────────────────────────────────

const getDocumentVersions = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    const versions = await DocumentVersion.findAll({
      where: { documentId: req.params.id },
      include: [{ model: User, as: 'uploader', attributes: ['username'] }],
      order: [['versionNumber', 'DESC']]
    });

    // If no explicit versions exist, synthesise version 1 from the document's own filePath
    if (versions.length === 0) {
      return res.json([{
        id: null,
        documentId: document.id,
        subDocumentId: null,
        versionNumber: 1,
        filePath: document.filePath,
        originalName: document.metadata?.originalName || null,
        fileSize: document.metadata?.size || null,
        uploadedBy: document.createdBy,
        label: 'Original',
        createdAt: document.createdAt,
        updatedAt: document.createdAt,
        syntheticVersion: true,
        uploader: null
      }]);
    }

    res.json(versions);
  } catch (error) {
    console.error('Get document versions error:', error);
    res.status(500).json({ message: 'Error getting document versions' });
  }
};

const getSubDocumentVersions = async (req, res) => {
  try {
    const subDocument = await SubDocument.findByPk(req.params.id);
    if (!subDocument) return res.status(404).json({ message: 'Sub-document not found' });

    const versions = await DocumentVersion.findAll({
      where: { subDocumentId: req.params.id },
      include: [{ model: User, as: 'uploader', attributes: ['username'] }],
      order: [['versionNumber', 'DESC']]
    });

    if (versions.length === 0) {
      return res.json([{
        id: null,
        documentId: null,
        subDocumentId: subDocument.id,
        versionNumber: 1,
        filePath: subDocument.filePath,
        originalName: subDocument.metadata?.originalName || null,
        fileSize: subDocument.metadata?.size || null,
        uploadedBy: subDocument.createdBy,
        label: 'Original',
        createdAt: subDocument.createdAt,
        updatedAt: subDocument.createdAt,
        syntheticVersion: true,
        uploader: null
      }]);
    }

    res.json(versions);
  } catch (error) {
    console.error('Get sub-document versions error:', error);
    res.status(500).json({ message: 'Error getting sub-document versions' });
  }
};

const uploadDocumentVersion = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { label } = req.body;

    // Count existing versions
    const existingCount = await DocumentVersion.count({ where: { documentId: document.id } });

    // If first new-version upload, save the original as v1 first
    if (existingCount === 0) {
      await DocumentVersion.create({
        documentId: document.id,
        versionNumber: 1,
        filePath: document.filePath,
        originalName: document.metadata?.originalName || null,
        fileSize: document.metadata?.size || null,
        uploadedBy: document.createdBy,
        label: 'Original'
      });
    }

    const nextVersionNumber = existingCount === 0 ? 2 : existingCount + 1;

    const version = await DocumentVersion.create({
      documentId: document.id,
      versionNumber: nextVersionNumber,
      filePath: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      label: label || null
    });

    // Update the document's filePath to point to the newest version
    document.filePath = req.file.path;
    document.metadata = {
      ...document.metadata,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    };
    await document.save();

    await logActivity({
      userId: req.user.id,
      action: 'UPLOAD',
      entityType: 'document',
      entityId: document.id,
      description: `Uploaded new version (v${nextVersionNumber}) for document: ${document.title}`,
      req
    });

    res.status(201).json(version);
  } catch (error) {
    console.error('Upload document version error:', error);
    res.status(500).json({ message: 'Error uploading document version' });
  }
};

const uploadSubDocumentVersion = async (req, res) => {
  try {
    const subDocument = await SubDocument.findByPk(req.params.id);
    if (!subDocument) return res.status(404).json({ message: 'Sub-document not found' });

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { label } = req.body;

    const existingCount = await DocumentVersion.count({ where: { subDocumentId: subDocument.id } });

    if (existingCount === 0) {
      await DocumentVersion.create({
        subDocumentId: subDocument.id,
        versionNumber: 1,
        filePath: subDocument.filePath,
        originalName: subDocument.metadata?.originalName || null,
        fileSize: subDocument.metadata?.size || null,
        uploadedBy: subDocument.createdBy,
        label: 'Original'
      });
    }

    const nextVersionNumber = existingCount === 0 ? 2 : existingCount + 1;

    const version = await DocumentVersion.create({
      subDocumentId: subDocument.id,
      versionNumber: nextVersionNumber,
      filePath: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      label: label || null
    });

    subDocument.filePath = req.file.path;
    subDocument.metadata = {
      ...subDocument.metadata,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    };
    await subDocument.save();

    await logActivity({
      userId: req.user.id,
      action: 'UPLOAD',
      entityType: 'subdocument',
      entityId: subDocument.id,
      description: `Uploaded new version (v${nextVersionNumber}) for sub-document: ${subDocument.title}`,
      req
    });

    res.status(201).json(version);
  } catch (error) {
    console.error('Upload sub-document version error:', error);
    res.status(500).json({ message: 'Error uploading sub-document version' });
  }
};

const viewDocumentVersion = async (req, res) => {
  try {
    const version = await DocumentVersion.findByPk(req.params.versionId);
    if (!version) return res.status(404).json({ message: 'Version not found' });

    if (req.user.userLevel === 'level3') {
      return res.status(403).json({ message: 'Not authorized to view documents' });
    }

    await logActivity({
      userId: req.user.id,
      action: 'VIEW',
      entityType: version.documentId ? 'document' : 'subdocument',
      entityId: version.documentId || version.subDocumentId,
      description: `Viewed version ${version.versionNumber}`,
      req
    });

    res.download(version.filePath);
  } catch (error) {
    console.error('View document version error:', error);
    res.status(500).json({ message: 'Error viewing document version' });
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
  updateSubDocumentInfo,
  getDocumentVersions,
  getSubDocumentVersions,
  uploadDocumentVersion,
  uploadSubDocumentVersion,
  viewDocumentVersion
};