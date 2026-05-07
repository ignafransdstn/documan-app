const { Project, ProjectDocument, ProjectSupportingDocument, Document, SubDocument, User } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Multer config for supporting docs
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/project-supporting');
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Helper: auto-close if actualEndDate is set
function resolveStatus(body, existing = null) {
  if (body.actualEndDate) return 'closed';
  if (body.status) return body.status;
  return existing ? existing.status : 'active';
}

// GET /api/projects
async function listProjects(req, res) {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({ projects: rows, totalCount: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
  } catch (err) {
    console.error('listProjects error:', err);
    res.status(500).json({ message: 'Error fetching projects' });
  }
}

// POST /api/projects
async function createProject(req, res) {
  try {
    const { type, name, number, description, institution, institutionDetail, startDate, estimatedEndDate, actualEndDate } = req.body;
    if (!type || !name || !number || !startDate) {
      return res.status(400).json({ message: 'type, name, number, startDate are required' });
    }
    if (type === 'dispute' && !institution) {
      return res.status(400).json({ message: 'institution is required for dispute type' });
    }

    const status = resolveStatus(req.body);
    const project = await Project.create({
      type, name, number, description, institution: type === 'dispute' ? institution : null,
      institutionDetail: type === 'dispute' && institution === 'OTHERS' ? institutionDetail : null,
      startDate, estimatedEndDate: estimatedEndDate || null, actualEndDate: actualEndDate || null,
      status, createdBy: req.user.id
    });

    await logActivity({ userId: req.user.id, action: 'CREATE', entityType: 'project', entityId: project.id, description: `Created ${type}: ${name} (${number})`, req });
    res.status(201).json(project);
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ message: 'Error creating project' });
  }
}

// GET /api/projects/:id
async function getProject(req, res) {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        {
          model: ProjectDocument,
          as: 'linkedDocuments',
          include: [
            { model: Document, as: 'document', attributes: ['id', 'title', 'certificateType', 'status', 'expiredDate', 'location'] },
            { model: SubDocument, as: 'subDocument', attributes: ['id', 'title', 'certificateType', 'status', 'expiredDate', 'location'] }
          ]
        },
        {
          model: ProjectSupportingDocument,
          as: 'supportingDocuments',
          include: [{ model: User, as: 'uploader', attributes: ['id', 'username'] }]
        }
      ]
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('getProject error:', err);
    res.status(500).json({ message: 'Error fetching project' });
  }
}

// PUT /api/projects/:id
async function updateProject(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { type, name, number, description, institution, institutionDetail, startDate, estimatedEndDate, actualEndDate } = req.body;
    const newType = type || project.type;
    const status = resolveStatus(req.body, project);

    await project.update({
      type: newType,
      name: name || project.name,
      number: number || project.number,
      description: description !== undefined ? description : project.description,
      institution: newType === 'dispute' ? (institution || project.institution) : null,
      institutionDetail: newType === 'dispute' && (institution || project.institution) === 'OTHERS' ? (institutionDetail || project.institutionDetail) : null,
      startDate: startDate || project.startDate,
      estimatedEndDate: estimatedEndDate !== undefined ? (estimatedEndDate || null) : project.estimatedEndDate,
      actualEndDate: actualEndDate !== undefined ? (actualEndDate || null) : project.actualEndDate,
      status
    });

    await logActivity({ userId: req.user.id, action: 'UPDATE', entityType: 'project', entityId: project.id, description: `Updated ${project.type}: ${project.name}`, req });
    res.json(project);
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ message: 'Error updating project' });
  }
}

// DELETE /api/projects/:id
async function deleteProject(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Delete supporting doc files from disk
    const supportingDocs = await ProjectSupportingDocument.findAll({ where: { projectId: project.id } });
    for (const doc of supportingDocs) {
      await fs.unlink(doc.filePath).catch(() => {});
    }

    await logActivity({ userId: req.user.id, action: 'DELETE', entityType: 'project', entityId: project.id, description: `Deleted ${project.type}: ${project.name}`, req });
    await project.destroy();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('deleteProject error:', err);
    res.status(500).json({ message: 'Error deleting project' });
  }
}

// POST /api/projects/:id/documents
async function linkDocument(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { documentId, subDocumentId, documentType } = req.body;
    if (!documentType || (!documentId && !subDocumentId)) {
      return res.status(400).json({ message: 'documentType and documentId or subDocumentId required' });
    }

    // Prevent duplicate links
    const existing = await ProjectDocument.findOne({ where: { projectId: project.id, documentId: documentId || null, subDocumentId: subDocumentId || null } });
    if (existing) return res.status(409).json({ message: 'Document already linked to this project' });

    const link = await ProjectDocument.create({ projectId: project.id, documentId: documentId || null, subDocumentId: subDocumentId || null, documentType });

    let docTitle = documentId ? `Doc #${documentId}` : `Sub #${subDocumentId}`;
    if (documentId) {
      const doc = await Document.findByPk(documentId, { attributes: ['title'] });
      if (doc) docTitle = doc.title;
    } else if (subDocumentId) {
      const sub = await SubDocument.findByPk(subDocumentId, { attributes: ['title'] });
      if (sub) docTitle = sub.title;
    }
    await logActivity({ userId: req.user.id, action: 'CREATE', entityType: 'project', entityId: project.id, description: `Linked document "${docTitle}" to ${project.type}: ${project.name}`, req });
    res.status(201).json(link);
  } catch (err) {
    console.error('linkDocument error:', err);
    res.status(500).json({ message: 'Error linking document' });
  }
}

// DELETE /api/projects/:id/documents/:linkId
async function unlinkDocument(req, res) {
  try {
    const link = await ProjectDocument.findOne({ where: { id: req.params.linkId, projectId: req.params.id } });
    if (!link) return res.status(404).json({ message: 'Link not found' });

    const project = await Project.findByPk(link.projectId, { attributes: ['id', 'name', 'type'] });
    let docTitle = link.documentId ? `Doc #${link.documentId}` : `Sub #${link.subDocumentId}`;
    if (link.documentId) {
      const doc = await Document.findByPk(link.documentId, { attributes: ['title'] });
      if (doc) docTitle = doc.title;
    } else if (link.subDocumentId) {
      const sub = await SubDocument.findByPk(link.subDocumentId, { attributes: ['title'] });
      if (sub) docTitle = sub.title;
    }
    await link.destroy();
    await logActivity({ userId: req.user.id, action: 'DELETE', entityType: 'project', entityId: link.projectId, description: `Unlinked document "${docTitle}" from ${project ? project.type + ': ' + project.name : 'project #' + link.projectId}`, req });
    res.json({ message: 'Document unlinked' });
  } catch (err) {
    console.error('unlinkDocument error:', err);
    res.status(500).json({ message: 'Error unlinking document' });
  }
}

// POST /api/projects/:id/supporting-docs  (multipart)
async function uploadSupportingDoc(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const doc = await ProjectSupportingDocument.create({
      projectId: project.id,
      filePath: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id
    });

    await logActivity({ userId: req.user.id, action: 'UPLOAD', entityType: 'project', entityId: project.id, description: `Uploaded supporting document "${req.file.originalname}" for ${project.type}: ${project.name}`, req });
    res.status(201).json(doc);
  } catch (err) {
    console.error('uploadSupportingDoc error:', err);
    res.status(500).json({ message: 'Error uploading supporting document' });
  }
}

// GET /api/projects/:id/supporting-docs/:fileId/download
async function downloadSupportingDoc(req, res) {
  try {
    const doc = await ProjectSupportingDocument.findOne({ where: { id: req.params.fileId, projectId: req.params.id } });
    if (!doc) return res.status(404).json({ message: 'File not found' });

    const project = await Project.findByPk(req.params.id, { attributes: ['id', 'name', 'type'] });
    await logActivity({ userId: req.user.id, action: 'DOWNLOAD', entityType: 'project', entityId: parseInt(req.params.id), description: `Downloaded supporting document "${doc.originalName}" from ${project ? project.type + ': ' + project.name : 'project #' + req.params.id}`, req });
    res.download(doc.filePath, doc.originalName);
  } catch (err) {
    console.error('downloadSupportingDoc error:', err);
    res.status(500).json({ message: 'Error downloading file' });
  }
}

// DELETE /api/projects/:id/supporting-docs/:fileId
async function deleteSupportingDoc(req, res) {
  try {
    const doc = await ProjectSupportingDocument.findOne({ where: { id: req.params.fileId, projectId: req.params.id } });
    if (!doc) return res.status(404).json({ message: 'File not found' });

    const project = await Project.findByPk(req.params.id, { attributes: ['id', 'name', 'type'] });
    const originalName = doc.originalName;
    await fs.unlink(doc.filePath).catch(() => {});
    await doc.destroy();
    await logActivity({ userId: req.user.id, action: 'DELETE', entityType: 'project', entityId: parseInt(req.params.id), description: `Deleted supporting document "${originalName}" from ${project ? project.type + ': ' + project.name : 'project #' + req.params.id}`, req });
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('deleteSupportingDoc error:', err);
    res.status(500).json({ message: 'Error deleting file' });
  }
}

// GET /api/projects/report
async function getProjectReport(req, res) {
  try {
    const { dateFrom, dateTo } = req.query;

    const whereClause = {};
    if (dateFrom || dateTo) {
      whereClause.startDate = {};
      if (dateFrom) whereClause.startDate[Op.gte] = dateFrom;
      if (dateTo) whereClause.startDate[Op.lte] = dateTo;
    }

    const projects = await Project.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { model: ProjectDocument, as: 'linkedDocuments', attributes: ['id', 'documentType'] },
        { model: ProjectSupportingDocument, as: 'supportingDocuments', attributes: ['id'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const summary = { total: 0, byType: { project: 0, dispute: 0 }, byStatus: { active: 0, closed: 0, on_hold: 0 }, totalLinkedDocs: 0, totalSupportingDocs: 0 };
    const institutionBreakdown = { POLSEK: 0, POLRES: 0, POLDA: 0, KEJATI: 0, KEJARI: 0, KEJAGUNG: 0, MA: 0, MK: 0, OTHERS: 0 };
    const monthlyMap = {};

    const projectList = projects.map(p => {
      summary.total += 1;
      summary.byType[p.type] = (summary.byType[p.type] || 0) + 1;
      summary.byStatus[p.status] = (summary.byStatus[p.status] || 0) + 1;
      const linkedCount = p.linkedDocuments ? p.linkedDocuments.length : 0;
      const supportingCount = p.supportingDocuments ? p.supportingDocuments.length : 0;
      summary.totalLinkedDocs += linkedCount;
      summary.totalSupportingDocs += supportingCount;

      if (p.type === 'dispute' && p.institution) {
        const key = p.institution === 'OTHERS' ? 'OTHERS' : p.institution;
        institutionBreakdown[key] = (institutionBreakdown[key] || 0) + 1;
      }

      const month = new Date(p.createdAt).toISOString().slice(0, 7);
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;

      const startMs = new Date(p.startDate).getTime();
      const endDate = p.actualEndDate || new Date().toISOString().slice(0, 10);
      const durationDays = Math.round((new Date(endDate).getTime() - startMs) / 86400000);

      return {
        id: p.id,
        name: p.name,
        number: p.number,
        type: p.type,
        status: p.status,
        institution: p.institution || null,
        startDate: p.startDate,
        estimatedEndDate: p.estimatedEndDate || null,
        actualEndDate: p.actualEndDate || null,
        createdAt: p.createdAt,
        creator: p.creator ? p.creator.username : '-',
        linkedDocCount: linkedCount,
        supportingDocCount: supportingCount,
        durationDays
      };
    });

    const monthlyTrend = Object.keys(monthlyMap).sort().map(m => ({ month: m, count: monthlyMap[m] }));

    res.json({ summary, institutionBreakdown, monthlyTrend, projects: projectList });
  } catch (err) {
    console.error('getProjectReport error:', err);
    res.status(500).json({ message: 'Error generating report' });
  }
}

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject, linkDocument, unlinkDocument, uploadSupportingDoc, upload, downloadSupportingDoc, deleteSupportingDoc, getProjectReport };
