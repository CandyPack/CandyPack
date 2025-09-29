# Project Structure & Architecture

## Directory Organization

```
├── bin/              # Executable binaries (candy, candypack)
├── cli/              # Command-line interface
│   └── src/          # CLI implementation (Cli.js, Connector.js, Monitor.js)
├── core/             # Core dependency injection system
├── framework/        # Web framework implementation
│   ├── src/          # Framework modules (Auth, Route, Server, etc.)
│   └── web/          # Client-side JavaScript (candy.js)
├── server/           # Server infrastructure
│   └── src/          # Server modules (DNS, SSL, Mail, Web, etc.)
├── watchdog/         # Process monitoring system
├── web/              # Example web application
│   └── controller/   # Example controllers
├── docs/             # Documentation (framework & server)
├── locale/           # Internationalization files
└── test/             # Jest test files
```

## Architecture Patterns

### Dependency Injection (Core)
- **Global Candy**: Singleton registry pattern via `global.Candy`
- **Module Loading**: Dynamic require with `core()`, `cli()`, `server()`, `watchdog()` methods
- **Singleton Management**: Automatic instantiation and caching

### Framework Pattern
- **Request Lifecycle**: Each request gets a fresh Candy instance with req/res context
- **Controller Pattern**: Simple function exports in `controller/` directories
- **Helper Functions**: Global shortcuts (`__()`, `abort()`, `return()`, etc.)

### File Naming Conventions
- **PascalCase**: Class files and main modules (e.g., `Candy.js`, `Server.js`)
- **camelCase**: Utility functions and instances
- **lowercase**: Entry points (`index.js`)

### Module Structure
- Each module can have an optional `init()` method for setup
- Framework modules receive Candy instance for request context
- Server modules are typically singletons for infrastructure