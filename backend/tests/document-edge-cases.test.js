const { describe, it, beforeAll, beforeEach, afterAll, expect } = require('@jest/globals');
const request = require('supertest');
const { app } = require('../src/app');
const { User, Document, SubDocument } = require('../src/models');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;

describe('Document edge cases and authorization', () => {
	let adminUser, adminToken, level3User, level3Token;
	const testFile = path.join(__dirname, 'test.pdf');

	beforeAll(async () => {
		// Create a simple test file used for uploads/downloads
		await fs.writeFile(testFile, 'Test content');

		adminUser = await User.create({
			username: 'edgeadmin',
			email: 'edgeadmin@example.com',
			password: 'admin123',
			userLevel: 'admin'
		});

		level3User = await User.create({
			username: 'edgelevel3',
			email: 'edgelevel3@example.com',
			password: 'pass123',
			userLevel: 'level3'
		});

		adminToken = jwt.sign({ id: adminUser.id, username: adminUser.username, userLevel: 'admin' }, process.env.JWT_SECRET);
		level3Token = jwt.sign({ id: level3User.id, username: level3User.username, userLevel: 'level3' }, process.env.JWT_SECRET);
	});

	afterAll(async () => {
		try { await fs.unlink(testFile); } catch (e) { /* ignore */ }
	});

	beforeEach(async () => {
		await Document.destroy({ where: {} });
		await SubDocument.destroy({ where: {} });
	});

	it('should return 400 when creating document without file', async () => {
		const res = await request(app)
			.post('/api/documents')
			.set('Authorization', `Bearer ${adminToken}`)
			.field('title', 'No File')
			.field('location', 'Nowhere');

		expect(res.statusCode).toBe(400);
		expect(res.body).toHaveProperty('message', 'No file uploaded');
	});

	it('should return 404 when creating sub-document with non-existent parent', async () => {
		const res = await request(app)
			.post('/api/documents/sub-document')
			.set('Authorization', `Bearer ${adminToken}`)
			.attach('document', testFile)
			.field('title', 'Sub')
			.field('location', 'Loc')
			.field('parentDocumentId', 99999);

		expect(res.statusCode).toBe(404);
		expect(res.body).toHaveProperty('message', 'Parent document not found');
	});

	it('should forbid level3 from downloading but allow admin', async () => {
		// Create a document pointing to the test file
		const doc = await Document.create({
			title: 'DL Test',
			filePath: testFile,
			location: 'Loc',
			status: 'active',
			createdBy: adminUser.id
		});

		// level3 should be forbidden
		const resForbidden = await request(app)
			.get(`/api/documents/download/${doc.id}`)
			.set('Authorization', `Bearer ${level3Token}`);

		expect(resForbidden.statusCode).toBe(403);

		// admin should be able to download
			const resOk = await request(app)
				.get(`/api/documents/download/${doc.id}`)
				.set('Authorization', `Bearer ${adminToken}`);

			expect(resOk.statusCode).toBe(200);
			// response body may be a Buffer; normalize to string before asserting
			const bodyStr = resOk.body && resOk.body.length ? resOk.body.toString('utf8') : (resOk.text || '');
			expect(bodyStr).toContain('Test content');
	});

	it('should delete document even if file is missing and remove subdocuments', async () => {
		// Create a document with a non-existent file path
		const doc = await Document.create({
			title: 'Delete Missing File',
			filePath: path.join(__dirname, 'no-such-file.pdf'),
			location: 'Loc',
			status: 'active',
			createdBy: adminUser.id
		});

		const sub = await SubDocument.create({
			title: 'Sub to delete',
			filePath: path.join(__dirname, 'no-sub-file.pdf'),
			parentDocumentId: doc.id,
			location: 'Loc',
			status: 'active'
		});

		const res = await request(app)
			.delete(`/api/documents/${doc.id}`)
			.set('Authorization', `Bearer ${adminToken}`);

		expect(res.statusCode).toBe(200);

		const foundSub = await SubDocument.findByPk(sub.id);
		expect(foundSub).toBeNull();
	});
});
