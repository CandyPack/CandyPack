# Technology Stack & Build System

## Tech Stack

- **Runtime**: Node.js 18+ (required)
- **Language**: JavaScript (ES6+, CommonJS modules)
- **Database**: MySQL2, SQLite3 support
- **Security**: bcrypt, node-forge, ACME client for SSL
- **Mail**: Built-in SMTP/IMAP server with DKIM signing
- **Proxy**: HTTP proxy for multi-domain hosting
- **DNS**: Native DNS server implementation

## Code Quality Tools

- **Linting**: ESLint with Prettier integration
- **Testing**: Jest with coverage reporting (no threshold enforcement)
- **Git Hooks**: Husky with pre-commit linting and test execution
- **Release**: Semantic Release with conventional commits
- **Test Check**: Automatic test execution on commit for changed files (pass/fail only)

## Common Commands

```bash
# Development
npm run lint          # Run ESLint
npm run lint:fix      # Fix linting issues automatically
npm test              # Run Jest tests with coverage
npm run test:watch    # Run tests in watch mode

# Release
npm run release       # Semantic release (automated)

# Installation
curl -sL https://candypack.dev/install | bash  # Quick install
npm install -g candypack                       # Manual install

# Git Hooks
# Pre-commit automatically runs:
# 1. lint-staged (ESLint + Prettier on staged files)
# 2. Test execution for changed core/ and server/ files (test/scripts/check-coverage.js)
# Note: Coverage is tracked but doesn't block commits - focus is on test pass/fail
```

## Code Style

- **Prettier Config**: No semicolons, single quotes, 140 char width, 2-space tabs
- **ESLint**: Separate configs for server/framework/web/browser contexts
- **Globals**: `Candy` and `__` are global variables across the codebase
- **Module System**: CommonJS (`require`/`module.exports`) for server-side code

## Logging Standards

- **Log Class**: Use `Candy.core('Log', false).init('ModuleName')` for all logging
- **Usage Pattern**:

  ```javascript
  const {log, error} = Candy.core('Log', false).init('ModuleName')

  log('Info message')
  log('Message with %s placeholder', 'value')
  error('Error message', errorObject)
  ```

- **CLI Mode**: Logs are automatically suppressed in CLI mode to avoid breaking the interface
- **Location**: Log class is in `core/Log.js` (also available via `server/src/Log.js` for backward compatibility)
- **Never use**: `console.log()` or `console.error()` directly - always use the Log class
