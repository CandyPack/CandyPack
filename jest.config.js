/** @type {import('jest').Config} */
const config = {
  verbose: true,
  roots: ['<rootDir>/test'],
  testMatch: ['**/test/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['core/**/*.js', 'server/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}

module.exports = config
