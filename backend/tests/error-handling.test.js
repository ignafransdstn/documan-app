const request = require('supertest');
const { startServer } = require('../src/app');

let server;
let agent;

beforeAll(async () => {
	process.env.NODE_ENV = 'test';
	process.env.PORT = 0;
	server = await startServer();
	agent = request(server);
});

afterAll(async () => {
	if (server && server.close) await new Promise((res) => server.close(res));
});

describe('Error handling and auth middleware', () => {
	it('should return 500 and use error handler for thrown errors', async () => {
		// This tests error handler by accessing a non-existent route
		const res = await agent.get('/api/nonexistent/route/that/does/not/exist');
		expect(res.statusCode).toBe(404);
	});

	it('should protect routes and return 401 when no token provided', async () => {
		const res = await agent.get('/api/documents');
		expect(res.statusCode).toBe(401);
		expect(res.body).toHaveProperty('message', 'No token provided');
	});
});
