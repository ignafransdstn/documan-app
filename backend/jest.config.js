module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  verbose: true,
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  moduleFileExtensions: ['js', 'json'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/migrations/**',
    '!src/seeders/**'
  ],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 10000,
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.JWT_SECRET': 'test_secret_key'
  }
};