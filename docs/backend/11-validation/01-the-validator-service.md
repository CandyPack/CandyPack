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
