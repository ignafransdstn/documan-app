const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const {
  listProjects, createProject, getProject, updateProject, deleteProject,
  linkDocument, unlinkDocument, uploadSupportingDoc, upload,
  downloadSupportingDoc, deleteSupportingDoc, getProjectReport
} = require('../controllers/projectController');

/**
 * @swagger
 * /projects/report:
 *   get:
 *     summary: Get project summary report
 *     description: Returns aggregated stats for all projects (counts by type, status, institution, monthly timeline).
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Report data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProjects:
 *                   type: integer
 *                 byType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 byStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 byInstitution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       institution:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 monthlyTimeline:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
// All routes require authentication; write operations require admin
router.get('/report', verifyToken, getProjectReport);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [project, dispute]
 *         description: Filter by project type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed, on_hold]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or number (case-insensitive)
 *     responses:
 *       200:
 *         description: Projects list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 totalCount:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, name, number, startDate]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [project, dispute]
 *               name:
 *                 type: string
 *               number:
 *                 type: string
 *                 description: Project number/reference code
 *               description:
 *                 type: string
 *               institution:
 *                 type: string
 *                 enum: [POLSEK, POLRES, POLDA, KEJATI, KEJARI, KEJAGUNG, MA, MK, OTHERS]
 *                 description: Required when type=dispute
 *               institutionDetail:
 *                 type: string
 *                 description: Required when institution=OTHERS
 *               startDate:
 *                 type: string
 *                 format: date
 *               estimatedEndDate:
 *                 type: string
 *                 format: date
 *               actualEndDate:
 *                 type: string
 *                 format: date
 *                 description: Setting this auto-sets status to closed
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 */
router.get('/', verifyToken, listProjects);
router.post('/', verifyToken, isAdmin, createProject);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
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
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update project (Admin only)
 *     tags: [Projects]
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
 *               name:
 *                 type: string
 *               number:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, closed, on_hold]
 *               institution:
 *                 type: string
 *                 enum: [POLSEK, POLRES, POLDA, KEJATI, KEJARI, KEJAGUNG, MA, MK, OTHERS]
 *               institutionDetail:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               estimatedEndDate:
 *                 type: string
 *                 format: date
 *               actualEndDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete project (Admin only)
 *     tags: [Projects]
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
 *         description: Project deleted successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, getProject);
router.put('/:id', verifyToken, isAdmin, updateProject);
router.delete('/:id', verifyToken, isAdmin, deleteProject);

/**
 * @swagger
 * /projects/{id}/documents:
 *   post:
 *     summary: Link a document to a project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentId]
 *             properties:
 *               documentId:
 *                 type: integer
 *                 description: Master document ID to link
 *     responses:
 *       201:
 *         description: Document linked successfully
 *       400:
 *         description: Document already linked
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Project or document not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /projects/{id}/documents/{linkId}:
 *   delete:
 *     summary: Unlink a document from a project (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ProjectDocument link ID
 *     responses:
 *       200:
 *         description: Document unlinked successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Link not found
 *       500:
 *         description: Internal server error
 */
// Document linking
router.post('/:id/documents', verifyToken, isAdmin, linkDocument);
router.delete('/:id/documents/:linkId', verifyToken, isAdmin, unlinkDocument);

/**
 * @swagger
 * /projects/{id}/supporting-docs:
 *   post:
 *     summary: Upload a supporting document to a project (Admin only, max 50MB)
 *     tags: [Projects]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Any file type, max 50MB
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportingDocument'
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /projects/{id}/supporting-docs/{fileId}/download:
 *   get:
 *     summary: Download a supporting document
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Supporting document file ID
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /projects/{id}/supporting-docs/{fileId}:
 *   delete:
 *     summary: Delete a supporting document (Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: File not found
 *       500:
 *         description: Internal server error
 */
// Supporting documents
router.post('/:id/supporting-docs', verifyToken, isAdmin, upload.single('file'), uploadSupportingDoc);
router.get('/:id/supporting-docs/:fileId/download', verifyToken, downloadSupportingDoc);
router.delete('/:id/supporting-docs/:fileId', verifyToken, isAdmin, deleteSupportingDoc);

module.exports = router;
