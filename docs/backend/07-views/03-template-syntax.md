## 🔧 Template Syntax

CandyPack uses a powerful template engine to create dynamic content in view files. This engine allows you to execute JavaScript code within HTML and display variables.

> **Note:** CandyPack also supports legacy syntax (`{{ }}`, `{!! !!}`, `{{-- --}}`) for backward compatibility, but the new `<candy>` tag syntax is recommended for all new projects.

### Variable Display

#### Variables with `var` Attribute

```html
<!-- HTML-safe output (auto-escape + nl2br) -->
<candy var="username" />
<candy var="user.email" />
<candy var="product.price" />

<!-- Raw HTML output (no escape) -->
<candy var="htmlContent" raw />
<candy var="user.bio" raw />
```

#### String Literals

```html
<!-- Direct string output -->
<candy>Hello World</candy>
<candy>Welcome</candy>
```

#### Controller Data with `get`

```html
<!-- Get request parameters -->
<candy get="search" />
<candy get="page" />
```

### Translation (i18n)

Translation tags allow you to use placeholders that will be replaced with dynamic content. The content inside `<candy translate>` is used as the translation key.

#### Translation with Placeholders

```html
<!-- With variable placeholder -->
<candy translate>Hello <candy var="user.name" /></candy>
<!-- Locale file: { "Hello %s1": "Merhaba %s1" } -->

<!-- With string placeholder -->
<candy translate>Hello <candy>John</candy>, how are you?</candy>
<!-- Locale file: { "Hello %s1, how are you?": "Merhaba %s1, nasılsın?" } -->

<!-- With raw HTML placeholder -->
<candy translate>Message: <candy var="htmlVar" raw /></candy>
<!-- Locale file: { "Message: %s1": "Mesaj: %s1" } -->

<!-- Multiple placeholders -->
<candy translate>
  <candy var="user.firstName" /> <candy var="user.lastName" />
</candy>
<!-- Locale file: { "%s1 %s2": "%s1 %s2" } -->
```

**How it works:**
1. The entire content becomes the translation key
2. Nested `<candy>` tags are replaced with `%s1`, `%s2`, etc.
3. The translation is looked up in your locale file
4. Placeholders are replaced with actual values

#### Raw Translation (HTML Preserved)

When your translation contains HTML tags that should be preserved:

```html
<!-- Normal translation (HTML will be encoded) -->
<candy translate>Hello, <br /> I'm <span><candy>Emre</candy></span></candy>
<!-- Output: {{ __('Hello, <br /> I\'m <span>%s1</span>', 'Emre') }}
     Result: "Hello, &lt;br /&gt; I'm &lt;span&gt;Emre&lt;/span&gt;" -->

<!-- Raw translation (HTML preserved) -->
<candy translate raw>Hello, <br /> I'm <span><candy>Emre</candy></span></candy>
<!-- Output: {!! __('Hello, <br /> I\'m <span>%s1</span>', 'Emre') !!}
     Result: "Hello, <br /> I'm <span>Emre</span>" -->
```

**Use Cases for Raw Translation:**
- Translation strings with formatting tags (`<br>`, `<strong>`, `<em>`)
- Links in translations: `<candy translate raw>Click <a href="/help">here</a></candy>`
- Rich text content from CMS
- Styled text: `<candy translate raw>Price: <span class="price"><candy var="amount" /></span></candy>`

**Security Warning:** Only use `raw` with trusted translation content. Never use it with user-generated content to prevent XSS attacks.

### Comments

#### Backend Comments (Not Rendered)

```html
<!--candy Single-line backend comment -->

<!--candy
  Multi-line backend comment
  Won't be rendered in output
candy-->
```

#### Regular HTML Comments (Rendered)

```html
<!-- This will appear in HTML output -->
```

### Conditional Statements

#### If Structure

```html
<candy:if condition="user.isAdmin">
  <p>Welcome to the admin panel!</p>
</candy:if>
```

#### If-Else Structure

```html
<candy:if condition="user.isLoggedIn">
  <p>Welcome back, <candy var="user.name" />!</p>
<candy:else>
  <p>Please log in.</p>
</candy:if>
```

#### If-ElseIf-Else Structure

```html
<candy:if condition="user.role === 'admin'">
  <p>You have admin privileges</p>
<candy:elseif condition="user.role === 'moderator'">
  <p>You have moderator privileges</p>
<candy:else>
  <p>You have regular user privileges</p>
</candy:if>
```

### Loops

#### For Loop

```html
<candy:for in="users" key="index" value="user">
  <div class="user-card">
    <h3><candy var="user.name" /></h3>
    <p><candy var="user.email" /></p>
  </div>
</candy:for>
```

Parameters:
- `in`: Array or object to loop through
- `key`: Index/key variable name (optional, default: "key")
- `value`: Value variable name (optional, default: "value")

#### While Loop

```html
<script:candy>
  let counter = 0;
</script:candy>

<candy:while condition="counter < 10">
  <p>Counter: <candy var="counter" /></p>
  <script:candy>counter++;</script:candy>
</candy:while>
```

### Loop Control Statements

#### Break

```html
<candy:for in="products" value="product">
  <candy:if condition="product.stock === 0">
    <candy:break />
  </candy:if>
  <div><candy var="product.name" /></div>
</candy:for>
```

#### Continue

```html
<candy:for in="users" value="user">
  <candy:if condition="user.isBlocked">
    <candy:continue />
  </candy:if>
  <div><candy var="user.name" /></div>
</candy:for>
```

### Backend JavaScript (Server-Side Execution)

Execute JavaScript code during template rendering on the server. This code runs **before** the HTML is sent to the browser.

```html
<script:candy>
  // This runs on the SERVER during template rendering
  let total = 0;
  for (let item of cart) {
    total += item.price * item.quantity;
  }
  
  // Calculate discount
  const discount = total > 100 ? total * 0.1 : 0;
  const finalTotal = total - discount;
  
  // IDE provides full JavaScript syntax highlighting!
</script:candy>

<p>Total: $<candy var="total" /></p>
<p>Discount: $<candy var="discount" /></p>
<p>Final: $<candy var="finalTotal" /></p>
```

**Important:** 
- ✅ Runs on the **server** during template rendering
- ✅ Has access to all backend variables and Candy object
- ✅ Perfect for calculations, data manipulation, filtering
- ❌ Does NOT run in the browser
- ❌ Cannot access browser APIs (window, document, etc.)

**Use Cases:**
- Calculate totals, averages, statistics
- Filter or transform data before display
- Complex logic that shouldn't be in the controller
- Generate dynamic content based on multiple variables

### Candy Object Access

You have full access to the `Candy` object within templates:

```html
<candy:if condition="Candy.Auth.check()">
  <p>User ID: <candy var="Candy.Auth.user().id" /></p>
</candy:if>

<p>Request Method: <candy var="Candy.Request.method" /></p>
<p>Current URL: <candy var="Candy.Request.url" /></p>
```

### Practical Examples

#### User List with Translation

```html
<div class="users-container">
  <h2><candy translate>Users (<candy var="users.length" />)</candy></h2>
  
  <candy:for in="users" key="index" value="user">
    <div class="user-card">
      <img src="<candy var="user.avatar" />" alt="<candy var="user.name" />">
      <h3><candy var="user.name" /></h3>
      <p><candy var="user.email" /></p>
      
      <candy:if condition="user.isOnline">
        <span class="badge online">
          <candy translate>Online</candy>
        </span>
      <candy:else>
        <span class="badge offline">
          <candy translate>Offline</candy>
        </span>
      </candy:if>
    </div>
  </candy:for>
</div>
```

#### Product Table

```html
<table>
  <thead>
    <tr>
      <th><candy translate>Product Name</candy></th>
      <th><candy translate>Price</candy></th>
      <th><candy translate>Stock</candy></th>
    </tr>
  </thead>
  <tbody>
    <candy:for in="products" value="product">
      <tr>
        <td><candy var="product.name" /></td>
        <td>$<candy var="product.price" /></td>
        <td>
          <candy:if condition="product.stock > 0">
            <span class="in-stock">
              <candy translate>
                <candy var="product.stock" /> <candy>units</candy>
              </candy>
            </span>
          <candy:else>
            <span class="out-of-stock">
              <candy translate>Out of stock</candy>
            </span>
          </candy:if>
        </td>
      </tr>
    </candy:for>
  </tbody>
</table>
```

#### Dynamic Content with Server-Side Script

```html
<script:candy>
  // SERVER-SIDE: Calculate featured products during rendering
  const featured = products.filter(p => p.featured);
  const total = featured.reduce((sum, p) => sum + p.price, 0);
  const avgPrice = total / featured.length;
  
  // Sort by price
  featured.sort((a, b) => a.price - b.price);
</script:candy>

<div class="featured-section">
  <h2><candy translate>Featured Products</candy></h2>
  
  <candy:for in="featured" value="product">
    <div class="product-card">
      <h3><candy var="product.name" /></h3>
      <p class="price">$<candy var="product.price" /></p>
      
      <candy:if condition="product.price < avgPrice">
        <span class="badge">
          <candy translate>Great Deal!</candy>
        </span>
      </candy:if>
    </div>
  </candy:for>
  
  <p class="summary">
    <candy translate>
      Average price: $<candy var="avgPrice" />
    </candy>
  </p>
</div>

<!-- For client-side JavaScript, use regular <script> tag -->
<script>
  // CLIENT-SIDE: This runs in the browser
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');
  });
</script>
```

#### Conditional Menu

```html
<nav>
  <ul>
    <candy:for in="menuItems" value="item">
      <candy:if condition="!item.requiresAuth || Candy.Auth.check()">
        <li>
          <a href="<candy var="item.url" />" 
             class="<candy:if condition="Candy.Request.url === item.url">active</candy:if>">
            <candy var="item.title" />
          </a>
        </li>
      </candy:if>
    </candy:for>
  </ul>
</nav>
```

### Syntax Summary

| Feature | Syntax | Description |
|---------|--------|-------------|
| Variable | `<candy var="x" />` | HTML-safe output with nl2br |
| Raw HTML | `<candy var="x" raw />` | Raw HTML output (no escape) |
| String | `<candy>text</candy>` | String literal output |
| Get Param | `<candy get="key" />` | Get request parameter |
| Translation | `<candy translate>key</candy>` | Translate with i18n (HTML encoded) |
| Translation Raw | `<candy translate raw>key</candy>` | Translate with HTML preserved |
| If | `<candy:if condition="x">` | Conditional rendering |
| Elseif | `<candy:elseif condition="x">` | Else-if condition |
| Else | `<candy:else>` | Else block |
| For | `<candy:for in="x" value="item">` | Loop through array/object |
| While | `<candy:while condition="x">` | While loop |
| Break | `<candy:break />` | Break from loop |
| Continue | `<candy:continue />` | Continue to next iteration |
| JavaScript | `<script:candy>...</script:candy>` | Server-side JavaScript (runs during rendering) |
| Comment | `<!--candy ... candy-->` | Backend comment (not rendered) |

