---
inclusion: always
---

# Code Style Guidelines

## Comments

- **Language**: All code comments MUST be written in English
- **Minimalism**: Avoid unnecessary comments - write self-documenting code instead
- **When to comment**: Only add comments when the code's intent is not immediately clear from the code itself
- **What not to comment**: 
  - Obvious operations (e.g., `// Set variable` before `x = 5`)
  - Code that explains itself through clear naming
  - Redundant descriptions of what the code does

## Examples

### Bad (unnecessary comments):
```javascript
// Get user email
const email = user.email

// Loop through items
for (const item of items) {
  // Process item
  processItem(item)
}
```

### Good (self-documenting):
```javascript
const email = user.email

for (const item of items) {
  processItem(item)
}
```

### Good (necessary comment):
```javascript
// ACME protocol requires 30-second delay between retries
await sleep(30000)

// Workaround for MySQL connection pool bug in v2.3.0
if (connection.threadId === null) {
  connection = await reconnect()
}
```

## General Principles

- Let the code speak for itself through clear variable and function names
- Use comments sparingly to explain "why" not "what"
- Keep comments concise and to the point
- Update or remove comments when code changes
