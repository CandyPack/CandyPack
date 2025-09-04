/** @type {import('jest').Config} */
const config = {
  verbose: true,
  roots: ['<rootDir>/test'],
  testMatch: ['**/test/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['core/**/*.js', 'server/**/*.js']
}

module.exports = config
