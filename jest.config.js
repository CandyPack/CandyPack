/** @type {import('jest').Config} */
const config = {
  verbose: true,
  roots: ['<rootDir>/test'],
   testMatch: [
    '**/test/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
};

module.exports = config;
