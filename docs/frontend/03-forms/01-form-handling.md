# Form Handling with candy.js

Learn how to handle forms with automatic AJAX submission, CSRF protection, and validation in CandyPack.

## Quick Start

### Basic Form

```html
<form id="contact-form" action="/api/contact" method="POST">
  <input name="email" type="email" required>
  <span candy-form-error="email"></span>
  
  <button type="submit">Submit</button>
  <div candy-form-success></div>
</form>
```

```javascript
Candy.form('#contact-form', function(data) {
  if (data.result.success) {
    alert('Form submitted successfully!')
  }
})
```

That's it! candy.js handles:
- ✅ AJAX submission
- ✅ CSRF token (automatic)
- ✅ Validation errors
- ✅ Success messages
- ✅ Loading states

## Form Configuration

### Basic Usage

```javascript
Candy.form('#my-form', function(data) {
  console.log('Response:', data)
})
```

### With Options

```javascript
Candy.form({
  form: '#my-form',
  messages: true,  // Show error/success messages
  loading: function(percent) {
    console.log('Upload progress:', percent + '%')
  }
}, function(data) {
  if (data.result.success) {
    console.log('Success!')
  }
})
```

### Redirect After Submit

```javascript
Candy.form('#my-form', '/success-page')
// Redirects to /success-page on success
```

## Error Handling

### Inline Errors

Display errors next to fields:

```html
<input name="email" type="email">
<span candy-form-error="email"></span>
```

Errors are automatically displayed when validation fails.

### Custom Error Display

```javascript
Candy.form('#my-form', function(data) {
  if (!data.result.success) {
    // Custom error handling
    Object.entries(data.errors).forEach(([field, message]) => {
      console.log(`${field}: ${message}`)
    })
  }
})
```

### Styling Errors

```css
/* Error message */
[candy-form-error] {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: none;
}

/* Invalid input */
input._candy_error {
  border-color: #ef4444;
}
```

## Success Messages

### Inline Success

```html
<form id="my-form" action="/api/submit" method="POST">
  <!-- form fields -->
  <button type="submit">Submit</button>
  <div candy-form-success></div>
</form>
```

### Custom Success Message

```javascript
Candy.form('#my-form', function(data) {
  if (data.result.success) {
    document.querySelector('#custom-message').innerHTML = 
      'Thank you! Your form has been submitted.'
  }
})
```

## File Uploads

### Basic File Upload

```html
<form id="upload-form" action="/api/upload" method="POST">
  <input name="file" type="file" required>
  <button type="submit">Upload</button>
</form>
```

```javascript
Candy.form('#upload-form', function(data) {
  if (data.result.success) {
    console.log('File uploaded:', data.result.filename)
  }
})
```

### Upload Progress

```javascript
Candy.form({
  form: '#upload-form',
  loading: function(percent) {
    document.querySelector('#progress').style.width = percent + '%'
    document.querySelector('#progress-text').textContent = percent + '%'
  }
}, function(data) {
  console.log('Upload complete!')
})
```

### Multiple Files

```html
<input name="files[]" type="file" multiple>
```

## Advanced Features

### Disable Messages

```javascript
Candy.form({
  form: '#my-form',
  messages: false  // Don't show automatic messages
}, function(data) {
  // Handle messages manually
})
```

### Disable Specific Messages

```javascript
Candy.form({
  form: '#my-form',
  messages: ['error']  // Only show errors, not success
}, function(data) {
  // Custom success handling
})
```

### Form Reset

```javascript
Candy.form('#my-form', function(data) {
  if (data.result.success) {
    // Reset the form
    document.querySelector('#my-form').reset()
  }
})
```

### Conditional Submission

```javascript
document.querySelector('#my-form').addEventListener('submit', function(e) {
  if (!confirm('Are you sure?')) {
    e.preventDefault()
    e.stopPropagation()
  }
})

Candy.form('#my-form', function(data) {
  console.log('Submitted!')
})
```

## Server-Side Setup

### Controller Example

```javascript
// controller/post/contact.js
module.exports = async function(Candy) {
  const email = await Candy.Request.request('email')
  const message = await Candy.Request.request('message')
  
  // Validation
  const errors = {}
  if (!email) errors.email = 'Email is required'
  if (!message) errors.message = 'Message is required'
  
  if (Object.keys(errors).length > 0) {
    return {
      result: {success: false},
      errors: errors
    }
  }
  
  // Process form
  // ... send email, save to database, etc.
  
  return {
    result: {
      success: true,
      message: 'Thank you for your message!'
    }
  }
}
```

### Route Setup

```javascript
// route/www.js
Candy.Route.post('/api/contact', 'contact')
```

## Validation

### Client-Side Validation

Use HTML5 validation:

```html
<input name="email" type="email" required>
<input name="age" type="number" min="18" max="100">
<input name="website" type="url">
```

### Server-Side Validation

Always validate on the server:

```javascript
module.exports = async function(Candy) {
  const email = await Candy.Request.request('email')
  
  const errors = {}
  
  // Required field
  if (!email) {
    errors.email = 'Email is required'
  }
  
  // Email format
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email format'
  }
  
  // Check if exists
  else if (await emailExists(email)) {
    errors.email = 'Email already registered'
  }
  
  if (Object.keys(errors).length > 0) {
    return {result: {success: false}, errors}
  }
  
  // Process...
}
```

## Common Patterns

### Contact Form

```html
<form id="contact-form" action="/api/contact" method="POST">
  <input name="name" type="text" required>
  <span candy-form-error="name"></span>
  
  <input name="email" type="email" required>
  <span candy-form-error="email"></span>
  
  <textarea name="message" required></textarea>
  <span candy-form-error="message"></span>
  
  <button type="submit">Send Message</button>
  <div candy-form-success></div>
</form>
```

```javascript
Candy.form('#contact-form', function(data) {
  if (data.result.success) {
    document.querySelector('#contact-form').reset()
  }
})
```

### Login Form

```html
<form id="login-form" action="/api/login" method="POST">
  <input name="email" type="email" required>
  <span candy-form-error="email"></span>
  
  <input name="password" type="password" required>
  <span candy-form-error="password"></span>
  
  <button type="submit">Login</button>
  <div candy-form-success></div>
</form>
```

```javascript
Candy.form('#login-form', function(data) {
  if (data.result.success) {
    // Redirect to dashboard
    window.location.href = '/dashboard'
  }
})
```

### Registration Form

```html
<form id="register-form" action="/api/register" method="POST">
  <input name="name" type="text" required>
  <span candy-form-error="name"></span>
  
  <input name="email" type="email" required>
  <span candy-form-error="email"></span>
  
  <input name="password" type="password" required minlength="8">
  <span candy-form-error="password"></span>
  
  <input name="password_confirm" type="password" required>
  <span candy-form-error="password_confirm"></span>
  
  <button type="submit">Register</button>
  <div candy-form-success></div>
</form>
```

## Best Practices

1. **Always Validate Server-Side**: Never trust client-side validation alone
2. **Show Clear Errors**: Display errors next to the relevant fields
3. **Provide Feedback**: Show loading states during submission
4. **Reset on Success**: Clear the form after successful submission
5. **Handle Errors Gracefully**: Provide helpful error messages
6. **Use HTTPS**: Always use HTTPS for forms with sensitive data

## Troubleshooting

### Form Not Submitting

- Check that `Candy.form()` is called after DOM is ready
- Verify the form selector is correct
- Check browser console for errors

### Errors Not Displaying

- Ensure `candy-form-error` attributes match field names
- Check that server returns errors in correct format
- Verify `messages` option is not set to `false`

### CSRF Token Errors

- CSRF tokens are handled automatically
- If you get token errors, check server configuration
- Ensure cookies are enabled

## Next Steps

- Learn about [Validation](02-validation.md)
- Explore [File Uploads](03-file-uploads.md)
- Check [API Requests](../04-api-requests/01-get-post.md)
