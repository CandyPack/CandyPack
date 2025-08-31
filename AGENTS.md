# AGENTS Guidelines for This Repository

This repository contains the source code for CandyPack, a lightweight server and framework toolkit. When working on this project, please follow the guidelines below.

## 1. Useful Commands

| Command | Purpose |
|---|---|
| `npm install` | Installs all project dependencies. |
| `./bin/candy` | Runs the main command-line interface for development. |
| `npm test` | Executes the entire test suite using Jest. |
| `npm run lint:fix` | Automatically fixes linting and formatting issues. |

## 2. Coding Conventions

*   **Linting & Formatting:** This project uses ESLint and Prettier to maintain code consistency.
*   **Pre-commit Hook:** A Husky pre-commit hook is configured to automatically run `eslint --fix` and `prettier --write` on staged `.js` files. Please make sure your files are staged (`git add <file>`) for the hook to work correctly.

## 3. Commit Message Standard

This project uses **Conventional Commits** for all commit messages, which is required for the automated release process (`semantic-release`). Please format your commit messages as follows:

`<type>(<scope>): <subject>`

-   **type:** Must be one of `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
-   **scope:** (Optional) A noun describing a section of the codebase (e.g., `server`, `framework`).
-   **subject:** A short, imperative-tense description of the change.

Example: `feat(server): add rate limiting to API endpoints`

## 4. Directory Structure

-   `bin/`: Contains the executable scripts for the command-line interface (CLI).
-   `cli/`: Holds the source code for the command-line interface.
-   `core/`: Contains the core logic and central modules of the application.
-   `framework/`: The source code for the CandyPack web framework.
-   `locale/`: Stores localization files for internationalization (i18n).
-   `server/`: Contains server-side logic (HTTP, Mail, SSL, DNS).
-   `test/`: Holds all project test files.
-   `watchdog/`: A module for monitoring running server processes.
-   `web/`: Contains the default website template used when creating new sites.

---

Following these practices ensures that the development workflow stays efficient and consistent.
