/** @type {import('jest').Config} */
const config = {
  verbose: true,
  roots: ['<rootDir>/tests'],
   testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
};

module.exports = config;
