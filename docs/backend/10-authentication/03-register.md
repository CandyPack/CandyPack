# User Registration

The `Candy.Auth.register()` method provides a secure and user-friendly way to create new user accounts with automatic password hashing, duplicate checking, and optional auto-login.

## Basic Usage

```javascript
module.exports = async function (Candy) {
  const result = await Candy.Auth.register({
    email: 'user@example.com',
    username: 'johndoe',
    password: 'securePassword123',
    name: 'John Doe'
  })
  
  if (result.success) {
    return {message: 'Registration successful', user: result.user}
  } else {
    return {error: result.error}
  }
}
```

## Advanced Options

```javascript
const result = await Candy.Auth.register(
  {
    email: 'user@example.com',
    username: 'johndoe',
    password: 'securePassword123',
    name: 'John Doe',
    role: 'user'
  },
  {
    passwordField: 'password',      // Field name for password (default: 'password')
    uniqueFields: ['email', 'username'], // Fields to check for duplicates (default: ['email'])
    autoLogin: true                 // Auto-login after registration (default: true)
  }
)
```

## Response Format

### Success Response

```javascript
{
  success: true,
  user: {
    id: 123,
    email: 'user@example.com',
    username: 'johndoe',
    // ... other user fields
  }
}
```

### Error Response

```javascript
{
  success: false,
  error: 'email already exists',
  field: 'email'  // Only present for duplicate field errors
}
```

## Features

- **Automatic Password Hashing**: Passwords are automatically hashed using bcrypt
- **Duplicate Prevention**: Checks for existing users with the same email/username
- **Auto-Login**: Optionally logs in the user immediately after registration
- **Flexible Configuration**: Customize password field name and unique fields
- **Detailed Error Messages**: Returns specific error information for better UX

## Example Controller

```javascript
module.exports = async function (Candy) {
  // Get form data
  const email = await Candy.request('email')
  const username = await Candy.request('username')
  const password = await Candy.request('password')
  const name = await Candy.request('name')
  
  // Validate input
  if (!email || !password) {
    return {error: 'Email and password are required'}
  }
  
  // Register user
  const result = await Candy.Auth.register(
    {email, username, password, name},
    {uniqueFields: ['email', 'username']}
  )
  
  if (result.success) {
    // User is now registered and logged in
    return Candy.direct('/dashboard')
  } else {
    // Show error message
    return {error: result.error}
  }
}
```

## Configuration

Make sure your `config.json` has the auth configuration:

```json
{
  "auth": {
    "table": "users",
    "key": "id",
    "token": "user_tokens"
  }
}
```

## Security Notes

- Passwords are automatically hashed with bcrypt before storage
- The system automatically detects already-hashed passwords (bcrypt pattern) to prevent double-hashing
- Never store plain text passwords
- Use HTTPS in production to protect credentials in transit
- Consider adding rate limiting to prevent brute force attacks
