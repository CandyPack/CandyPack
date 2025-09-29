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
- **Testing**: Jest with coverage reporting
- **Git Hooks**: Husky with pre-commit linting
- **Release**: Semantic Release with conventional commits

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
```

## Code Style

- **Prettier Config**: No semicolons, single quotes, 140 char width, 2-space tabs
- **ESLint**: Separate configs for server/framework/web/browser contexts
- **Globals**: `Candy` and `__` are global variables across the codebase
- **Module System**: CommonJS (`require`/`module.exports`) for server-side code