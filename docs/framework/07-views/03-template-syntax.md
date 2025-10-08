## 🔧 Template Syntax

CandyPack uses a powerful template engine to create dynamic content in view files. This engine allows you to execute JavaScript code within HTML and display variables.

### Variable Display

#### Safe HTML Output (Auto-Escape)

```html
{{ username }}
{{ user.email }}
{{ product.price }}
```

This syntax makes the variable HTML-safe and converts `\n` characters to `<br>` tags.

#### Raw HTML Output (No Escape)

```html
{!! htmlContent !!}
{!! user.bio !!}
```

This syntax renders HTML content as-is. Be careful about XSS attacks!

### Comments

```html
{{-- This is a comment line --}}
{{-- 
  Multi-line
  comments are
  also supported
--}}
```

Template comments don't appear in the HTML output.

### Conditional Statements

#### If Structure

```html
<candy-if if="user.isAdmin">
  <p>Welcome to the admin panel!</p>
</candy-if>
```

#### If-Else Structure

```html
<candy-if if="user.isLoggedIn">
  <p>Welcome back, {{ user.name }}!</p>
<candy-else>
  <p>Please log in.</p>
</candy-if>
```

#### If-ElseIf-Else Structure

```html
<candy-if if="user.role === 'admin'">
  <p>You have admin privileges</p>
<candy-elseif elseif="user.role === 'moderator'">
  <p>You have moderator privileges</p>
<candy-else>
  <p>You have regular user privileges</p>
</candy-if>
```

### Loops

#### For Loop

```html
<candy-for in="users" key="index" value="user">
  <div class="user-card">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
  </div>
</candy-for>
```

Parameters:
- `in`: Array or object to loop through
- `key`: Index/key variable name (optional, default: "key")
- `value`: Value variable name (optional, default: "value")

#### List Loop (Auto UL Wrapper)

```html
<candy-list list="menuItems" key="index" value="item">
  <li>
    <a href="{{ item.url }}">{{ item.title }}</a>
  </li>
</candy-list>
```

This is automatically wrapped in a `<ul>` tag:

```html
<ul>
  <li><a href="/home">Home</a></li>
  <li><a href="/about">About</a></li>
</ul>
```

#### While Loop

```html
<candy-while while="counter < 10">
  <p>Counter: {{ counter }}</p>
  <candy-js>counter++</candy-js>
</candy-while>
```

### Loop Control Statements

#### Break

```html
<candy-for in="products" value="product">
  <candy-if if="product.stock === 0">
    <candy-break/>
  </candy-if>
  <div>{{ product.name }}</div>
</candy-for>
```

#### Continue

```html
<candy-for in="users" value="user">
  <candy-if if="user.isBlocked">
    <candy-continue/>
  </candy-if>
  <div>{{ user.name }}</div>
</candy-for>
```

### Executing JavaScript Code

```html
<candy-js>
  let total = 0
  for (let item of cart) {
    total += item.price * item.quantity
  }
</candy-js>

<p>Total: ${{ total }}</p>
```

### Special Functions

#### get() - Get Request Parameter

```html
<p>Search term: {{ get('search') }}</p>
<p>Page: {{ get('page') }}</p>
```

#### __() - Translation (i18n)

```html
<h1>{{ __('welcome.title') }}</h1>
<p>{{ __('welcome.message', { name: user.name }) }}</p>
```

### Candy Object Access

You have full access to the `Candy` object within templates:

```html
<candy-if if="Candy.Auth.check()">
  <p>User ID: {{ Candy.Auth.user().id }}</p>
</candy-if>

<p>Request Method: {{ Candy.Request.method }}</p>
<p>Current URL: {{ Candy.Request.url }}</p>
```

### Practical Examples

#### User List

```html
<div class="users-container">
  <candy-for in="users" key="index" value="user">
    <div class="user-card">
      <img src="{{ user.avatar }}" alt="{{ user.name }}">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      
      <candy-if if="user.isOnline">
        <span class="badge online">Online</span>
      <candy-else>
        <span class="badge offline">Offline</span>
      </candy-if>
    </div>
  </candy-for>
</div>
```

#### Product Table

```html
<table>
  <thead>
    <tr>
      <th>Product</th>
      <th>Price</th>
      <th>Stock</th>
    </tr>
  </thead>
  <tbody>
    <candy-for in="products" value="product">
      <tr>
        <td>{{ product.name }}</td>
        <td>${{ product.price }}</td>
        <td>
          <candy-if if="product.stock > 0">
            <span class="in-stock">{{ product.stock }} units</span>
          <candy-else>
            <span class="out-of-stock">Out of stock</span>
          </candy-if>
        </td>
      </tr>
    </candy-for>
  </tbody>
</table>
```

#### Conditional Menu

```html
<nav>
  <candy-list list="menuItems" value="item">
    <candy-if if="!item.requiresAuth || Candy.Auth.check()">
      <li>
        <a href="{{ item.url }}" 
           class="{{ Candy.Request.url === item.url ? 'active' : '' }}">
          {{ item.title }}
        </a>
      </li>
    </candy-if>
  </candy-list>
</nav>
```
