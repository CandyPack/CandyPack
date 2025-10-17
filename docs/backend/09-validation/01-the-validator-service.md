## ✅ The `Validator` Service

The Validator service provides a fluent, chainable API for validating user input. It's automatically available in your controllers through `Candy.Validator`.

#### Basic Usage

The validator uses a method-chaining pattern:

```javascript
const validator = Candy.Validator
validator.post('email').check('required|email').message('Valid email required')
validator.post('password').check('required|minlen:8').message('Password must be at least 8 characters')

if (await validator.error()) {
  return validator.result('Validation failed')
}
```

#### Available Methods

- `post(key)` - Validate a POST field
- `get(key)` - Validate a GET field
- `var(name, value)` - Validate a custom variable
- `file(name)` - Validate a file upload
- `check(rules)` - Define validation rules (pipe-separated)
- `message(text)` - Set custom error message
- `error()` - Returns true if validation failed (async)
- `result(message, data)` - Returns formatted result object (async)
- `success(callback)` - Returns success result with data
- `brute(maxAttempts)` - Enable brute force protection (default: 5 attempts)

#### Validation Rules

**Type Validation:**
- `required` - Field cannot be empty
- `accepted` - Must be 1, 'on', 'yes', or true
- `numeric` - Must be a number
- `alpha` - Only alphabetic characters
- `alphaspace` - Alphabetic characters and spaces
- `alphanumeric` - Alphanumeric characters only
- `alphanumericspace` - Alphanumeric characters and spaces
- `username` - Alphanumeric username (no spaces or special chars)
- `email` - Valid email address
- `ip` - Valid IP address
- `float` - Floating point number
- `mac` - Valid MAC address
- `domain` - Valid domain name
- `url` - Valid URL
- `array` - Must be an array
- `date` - Valid date format

**Length Validation:**
- `len:X` - Exact length must be X
- `minlen:X` - Minimum length of X characters
- `maxlen:X` - Maximum length of X characters

**Value Validation:**
- `min:X` - Minimum value of X
- `max:X` - Maximum value of X
- `equal:value` - Must equal specific value
- `not:value` - Must not equal specific value
- `same:field` - Must match another field
- `different:field` - Must differ from another field

**Date Validation:**
- `mindate:date` - Must be after specified date
- `maxdate:date` - Must be before specified date

**String Validation:**
- `in:substring` - Must contain substring
- `notin:substring` - Must not contain substring
- `regex:pattern` - Must match regex pattern

**Security:**
- `xss` - Check for HTML tags (XSS protection)
- `usercheck` - User must be authenticated
- `user:field` - Must match authenticated user's field value

**Inverse Rules:**
Use `!` prefix to invert any rule: `!required`, `!email`, etc.

#### Example: User Registration

```javascript
module.exports = async function (Candy) {
  const validator = Candy.Validator

  validator.post('username').check('required|username|minlen:4|maxlen:20').message('Username must be 4-20 alphanumeric characters')
  validator.post('email').check('required|email').message('Valid email address required')
  validator.post('password').check('required|minlen:8').message('Password must be at least 8 characters')
  validator.post('password_confirm').check('required|same:password').message('Passwords must match')

  if (await validator.error()) {
    return validator.result('Validation failed')
  }

  return validator.success('User registered successfully')
}
```

#### Example: Login with Brute Force Protection

```javascript
module.exports = async function (Candy) {
  const validator = Candy.Validator

  validator.post('email').check('required|email').message('Email required')
  validator.post('password').check('required').message('Password required')
  validator.brute(5)

  if (await validator.error()) {
    return validator.result('Login failed')
  }

  return validator.success({token: 'abc123'})
}
```

#### Example: Custom Variable Validation

```javascript
module.exports = async function (Candy) {
  const validator = Candy.Validator
  const customValue = calculateSomething()

  validator.var('calculated_value', customValue).check('numeric|min:100|max:1000').message('Value must be between 100 and 1000')

  if (await validator.error()) {
    return validator.result('Invalid calculation')
  }

  return validator.success('Calculation valid')
}
```

#### Multiple Checks Per Field

You can chain multiple `check()` calls for the same field, each with its own specific error message. The validator will return the first error it encounters:

```javascript
module.exports = async function (Candy) {
  const validator = Candy.Validator

  validator
    .post('password')
    .check('required').message('Password is required')
    .check('minlen:8').message('Password must be at least 8 characters')
    .check('maxlen:50').message('Password cannot exceed 50 characters')
    .check('regex:[A-Z]').message('Password must contain at least one uppercase letter')
    .check('regex:[0-9]').message('Password must contain at least one number')

  if (await validator.error()) {
    return validator.result('Validation failed')
  }

  return validator.success('Password is strong')
}
```

#### Example: Complex Form Validation

```javascript
module.exports = async function (Candy) {
  const validator = Candy.Validator

  validator
    .post('username')
    .check('required').message('Username is required')
    .check('username').message('Username can only contain letters and numbers')
    .check('minlen:3').message('Username must be at least 3 characters')
    .check('maxlen:20').message('Username cannot exceed 20 characters')

  validator
    .post('email')
    .check('required').message('Email is required')
    .check('email').message('Please enter a valid email address')

  validator
    .post('age')
    .check('required').message('Age is required')
    .check('numeric').message('Age must be a number')
    .check('min:18').message('You must be at least 18 years old')
    .check('max:120').message('Please enter a valid age')

  validator
    .post('website')
    .check('!required').message('Website is optional')
    .check('url').message('Please enter a valid URL')

  validator
    .post('bio')
    .check('maxlen:500').message('Bio cannot exceed 500 characters')
    .check('xss').message('Bio contains invalid HTML tags')

  if (await validator.error()) {
    return validator.result('Please fix the errors')
  }

  return validator.success('Profile updated successfully')
}
```

#### Example: Date Range Validation

```javascript
module.exports = async function (Candy) {
  const validator = Candy.Validator

  validator
    .post('start_date')
    .check('required').message('Start date is required')
    .check('date').message('Invalid date format')
    .check('mindate:2024-01-01').message('Start date must be after January 1, 2024')

  validator
    .post('end_date')
    .check('required').message('End date is required')
    .check('date').message('Invalid date format')
    .check('maxdate:2025-12-31').message('End date must be before December 31, 2025')

  if (await validator.error()) {
    return validator.result('Invalid date range')
  }

  return validator.success('Date range is valid')
}
```

#### Example: Conditional Validation with Custom Variables

```javascript
module.exports = async function (Candy) {
  const validator = Candy.Validator
  const userRole = Candy.Auth.user('role')
  const isAdmin = userRole === 'admin'

  validator.post('title').check('required').message('Title is required')

  if (isAdmin) {
    validator
      .post('publish_immediately')
      .check('accepted').message('Admins must confirm immediate publishing')

    validator
      .var('admin_check', isAdmin)
      .check('equal:true').message('Only admins can publish')
  }

  if (await validator.error()) {
    return validator.result('Validation failed')
  }

  return validator.success('Article published')
}
```

#### Response Format

The `result()` method returns a standardized response:

**Success:**
```json
{
  "result": {
    "success": true,
    "message": "Operation successful"
  },
  "data": null
}
```

**Error:**
```json
{
  "result": {
    "success": false
  },
  "errors": {
    "email": "Valid email address required",
    "password": "Password must be at least 8 characters"
  }
}
```
