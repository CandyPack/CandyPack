## 📦 Variables in Views

Variables allow you to display dynamic data in your templates. Data is passed from controllers to views and can be displayed in various ways.

### Displaying Variables

#### HTML-Safe Output (Recommended)

```html
<candy var="username" />
<candy var="user.email" />
<candy var="product.price" />
```

This automatically:
- Escapes HTML to prevent XSS attacks
- Converts newlines (`\n`) to `<br>` tags

**Example:**
```javascript
// Controller
Candy.set('message', 'Hello\nWorld')
```

```html
<!-- View -->
<candy var="message" />
<!-- Output: Hello<br>World -->
```

#### Raw HTML Output

When you need to display HTML content without escaping:

```html
<candy var="htmlContent" raw />
<candy var="user.bio" raw />
```

**Security Warning:** Only use `raw` with trusted content. Never use it with user-generated content to prevent XSS attacks.

**Example:**
```javascript
// Controller
Candy.set('content', '<strong>Bold text</strong>')
```

```html
<!-- View -->
<candy var="content" raw />
<!-- Output: <strong>Bold text</strong> -->
```

### Accessing Nested Properties

You can access nested object properties using dot notation:

```javascript
// Controller
Candy.set('user', {
  name: 'John',
  profile: {
    email: 'john@example.com',
    address: {
      city: 'Istanbul'
    }
  }
})
```

```html
<!-- View -->
<p>Name: <candy var="user.name" /></p>
<p>Email: <candy var="user.profile.email" /></p>
<p>City: <candy var="user.profile.address.city" /></p>
```

### String Literals

Display static text directly:

```html
<candy>Hello World</candy>
<candy>Welcome to our site</candy>
```

This is useful when you want consistent syntax throughout your templates.

### Accessing the Candy Object

You have full access to the `Candy` object within templates:

```html
<!-- Authentication -->
<candy:if condition="Candy.Auth.check()">
  <p>User ID: <candy var="Candy.Auth.user().id" /></p>
  <p>Email: <candy var="Candy.Auth.user().email" /></p>
</candy:if>

<!-- Request Information -->
<p>Method: <candy var="Candy.Request.method" /></p>
<p>URL: <candy var="Candy.Request.url" /></p>
<p>IP: <candy var="Candy.Request.ip" /></p>

<!-- Configuration -->
<candy:if condition="Candy.Config.debug">
  <div class="debug-info">Debug mode enabled</div>
</candy:if>
```

### Practical Examples

#### User Profile Card

```javascript
// Controller
module.exports = async function(Candy) {
  Candy.set('user', {
    name: 'Emre Kaya',
    email: 'emre@example.com',
    bio: '<p>Full-stack developer</p>',
    isVerified: true
  })
  
  Candy.View.skeleton('main').set('content', 'profile')
}
```

```html
<!-- View -->
<div class="profile-card">
  <h2><candy var="user.name" /></h2>
  <p><candy var="user.email" /></p>
  
  <candy:if condition="user.isVerified">
    <span class="badge">✓ Verified</span>
  </candy:if>
  
  <div class="bio">
    <candy var="user.bio" raw />
  </div>
</div>
```

#### Product Display

```javascript
// Controller
module.exports = async function(Candy) {
  Candy.set('product', {
    name: 'Laptop',
    price: 999.99,
    description: 'High-performance laptop\nPerfect for developers',
    specs: {
      ram: '16GB',
      storage: '512GB SSD'
    }
  })
  
  Candy.View.skeleton('main').set('content', 'product')
}
```

```html
<!-- View -->
<div class="product">
  <h1><candy var="product.name" /></h1>
  <p class="price">$<candy var="product.price" /></p>
  
  <div class="description">
    <candy var="product.description" />
  </div>
  
  <div class="specs">
    <p>RAM: <candy var="product.specs.ram" /></p>
    <p>Storage: <candy var="product.specs.storage" /></p>
  </div>
</div>
```

### Legacy Syntax (Backward Compatibility)

CandyPack also supports legacy syntax:

```html
<!-- HTML-safe output -->
{{ username }}
{{ user.email }}

<!-- Raw HTML output -->
{!! htmlContent !!}
{!! user.bio !!}
```

**Note:** The new `<candy>` tag syntax is recommended for all new projects as it provides better IDE support and readability.
