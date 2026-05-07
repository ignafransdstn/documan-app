const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const {
  listProjects, createProject, getProject, updateProject, deleteProject,
  linkDocument, unlinkDocument, uploadSupportingDoc, upload,
  downloadSupportingDoc, deleteSupportingDoc, getProjectReport
} = require('../controllers/projectController');

// All routes require authentication; write operations require admin
router.get('/report', verifyToken, getProjectReport);
router.get('/', verifyToken, listProjects);
router.post('/', verifyToken, isAdmin, createProject);
router.get('/:id', verifyToken, getProject);
router.put('/:id', verifyToken, isAdmin, updateProject);
router.delete('/:id', verifyToken, isAdmin, deleteProject);

// Document linking
router.post('/:id/documents', verifyToken, isAdmin, linkDocument);
router.delete('/:id/documents/:linkId', verifyToken, isAdmin, unlinkDocument);

// Supporting documents
router.post('/:id/supporting-docs', verifyToken, isAdmin, upload.single('file'), uploadSupportingDoc);
router.get('/:id/supporting-docs/:fileId/download', verifyToken, downloadSupportingDoc);
router.delete('/:id/supporting-docs/:fileId', verifyToken, isAdmin, deleteSupportingDoc);

module.exports = router;
