## 🔗 Accessing Request Data in Views

Views can access data from the current HTTP request, including query parameters, form data, and request properties.

### Getting Query Parameters

Use `<candy get="key" />` to access URL query parameters:

```html
<!-- URL: /search?q=laptop&page=2 -->

<p>Search query: <candy get="q" /></p>
<p>Current page: <candy get="page" /></p>
```

**How it works:**
1. User visits `/search?q=laptop&page=2`
2. `<candy get="q" />` retrieves the value of `q` parameter
3. If parameter doesn't exist, it returns empty string (no error)

### Undefined Parameters

If a parameter doesn't exist, it safely returns an empty string:

```html
<!-- URL: /products (no query parameters) -->

<candy get="search" />
<!-- Output: (empty string, no error) -->
```

This prevents errors when parameters are optional.

### Using Request Data in Controllers

While you can access request data directly in views, it's often better to process it in the controller:

```javascript
// Controller: controller/search.js
module.exports = async function(Candy) {
  const query = Candy.Request.get('q') || 'all products'
  const page = parseInt(Candy.Request.get('page')) || 1
  
  // Fetch results based on query
  const results = await searchProducts(query, page)
  
  Candy.set('query', query)
  Candy.set('page', page)
  Candy.set('results', results)
  
  Candy.View.skeleton('main').set('content', 'search')
}
```

```html
<!-- View: view/content/search.html -->
<h1>Search Results for "<candy var="query" />"</h1>
<p>Page <candy var="page" /></p>

<candy:for in="results" value="product">
  <div class="product">
    <h3><candy var="product.name" /></h3>
    <p><candy var="product.price" /></p>
  </div>
</candy:for>
```

### Accessing Request Object

You can access the full Request object through the Candy object:

```html
<!-- Request method -->
<p>Method: <candy var="Candy.Request.method" /></p>

<!-- Current URL -->
<p>URL: <candy var="Candy.Request.url" /></p>

<!-- Client IP -->
<p>IP: <candy var="Candy.Request.ip" /></p>

<!-- User agent -->
<p>Browser: <candy var="Candy.Request.headers['user-agent']" /></p>
```

### Practical Examples

#### Search Form with Results

```html
<!-- Search form -->
<form action="/search" method="GET">
  <input 
    type="text" 
    name="q" 
    value="<candy get="q" />" 
    placeholder="Search products..."
  >
  <button type="submit">Search</button>
</form>

<!-- Display search query if exists -->
<candy:if condition="Candy.Request.get('q')">
  <p>Showing results for: "<candy get="q" />"</p>
</candy:if>
```

#### Pagination

```html
<script:candy>
  const currentPage = parseInt(Candy.Request.get('page')) || 1
  const totalPages = 10
</script:candy>

<div class="pagination">
  <candy:if condition="currentPage > 1">
    <a href="?page=<candy var="currentPage - 1" />">Previous</a>
  </candy:if>
  
  <span>Page <candy var="currentPage" /> of <candy var="totalPages" /></span>
  
  <candy:if condition="currentPage < totalPages">
    <a href="?page=<candy var="currentPage + 1" />">Next</a>
  </candy:if>
</div>
```

#### Filter Form

```html
<!-- URL: /products?category=electronics&sort=price&order=asc -->

<form action="/products" method="GET">
  <select name="category">
    <option value="">All Categories</option>
    <option value="electronics" <candy:if condition="Candy.Request.get('category') === 'electronics'">selected</candy:if>>
      Electronics
    </option>
    <option value="clothing" <candy:if condition="Candy.Request.get('category') === 'clothing'">selected</candy:if>>
      Clothing
    </option>
  </select>
  
  <select name="sort">
    <option value="name" <candy:if condition="Candy.Request.get('sort') === 'name'">selected</candy:if>>
      Name
    </option>
    <option value="price" <candy:if condition="Candy.Request.get('sort') === 'price'">selected</candy:if>>
      Price
    </option>
  </select>
  
  <button type="submit">Filter</button>
</form>
```

#### Active Navigation

```html
<nav>
  <a href="/" class="<candy:if condition="Candy.Request.url === '/'">active</candy:if>">
    Home
  </a>
  <a href="/products" class="<candy:if condition="Candy.Request.url.startsWith('/products')">active</candy:if>">
    Products
  </a>
  <a href="/about" class="<candy:if condition="Candy.Request.url === '/about'">active</candy:if>">
    About
  </a>
</nav>
```

### Best Practices

1. **Validate in Controller**: Always validate and sanitize request data in the controller before using it
2. **Default Values**: Provide default values for optional parameters
3. **Type Conversion**: Convert string parameters to appropriate types (numbers, booleans)
4. **Security**: Never trust user input - always validate and escape

**Good:**
```javascript
// Controller
const page = Math.max(1, parseInt(Candy.Request.get('page')) || 1)
const limit = Math.min(100, parseInt(Candy.Request.get('limit')) || 20)

Candy.set('page', page)
Candy.set('limit', limit)
```

**Avoid:**
```html
<!-- Don't do complex logic in views -->
<candy:if condition="parseInt(Candy.Request.get('page')) > 0 && parseInt(Candy.Request.get('page')) < 100">
  ...
</candy:if>
```
