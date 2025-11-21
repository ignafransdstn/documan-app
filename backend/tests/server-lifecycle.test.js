const path = require('path');

describe('Server lifecycle and DB connection handling', () => {
	const ORIGINAL_ENV = process.env.NODE_ENV;

	afterEach(() => {
		// restore env and modules
		process.env.NODE_ENV = ORIGINAL_ENV;
		jest.resetModules();
	});

		it('should call process.exit when DB authentication fails during startup', async () => {
			// Simulate environment where server would start
			process.env.NODE_ENV = 'development';

			// We'll mock models and keep a spy on process.exit until async authenticate runs
			await new Promise((resolve) => {
				let exitSpy;
				jest.isolateModules(() => {
					jest.mock('../src/models', () => ({
						sequelize: {
							authenticate: jest.fn().mockRejectedValue(new Error('auth failed'))
						}
					}));

					exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

					// Requiring app will schedule the async authenticate which will reject and call process.exit
					require('../src/app');
				});

				// wait a bit for the async startup to run
				setTimeout(() => {
					try {
						expect(exitSpy).toHaveBeenCalledWith(1);
					} finally {
						exitSpy.mockRestore();
						resolve();
					}
				}, 100);
			});
		});

	it('should not start server when NODE_ENV is test', () => {
		process.env.NODE_ENV = 'test';

		jest.isolateModules(() => {
			const mockAuth = jest.fn().mockResolvedValue();
			jest.mock('../src/models', () => ({
				sequelize: {
					authenticate: mockAuth,
					sync: jest.fn()
				}
			}));

			// Requiring app in test env should not call authenticate/start server
			require('../src/app');

			expect(mockAuth).not.toHaveBeenCalled();
		});
	});
});
