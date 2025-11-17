## 🔁 Loops and Iteration

Loops allow you to repeat content for each item in an array or object. This is essential for displaying lists, tables, and collections.

### For Loop

The most common way to iterate over arrays and objects:

```html
<candy:for in="users" key="index" value="user">
  <div class="user-card">
    <h3><candy var="user.name" /></h3>
    <p><candy var="user.email" /></p>
  </div>
</candy:for>
```

**Parameters:**
- `in`: The array or object to loop through (required)
- `key`: Variable name for the index/key (optional, default: "key")
- `value`: Variable name for the value (optional, default: "value")

### Iterating Over Arrays

```javascript
// Controller
Candy.set('products', [
  { name: 'Laptop', price: 999 },
  { name: 'Mouse', price: 29 },
  { name: 'Keyboard', price: 79 }
])
```

```html
<!-- View -->
<div class="products">
  <candy:for in="products" key="index" value="product">
    <div class="product">
      <span class="number"><candy var="index + 1" />.</span>
      <h3><candy var="product.name" /></h3>
      <p>$<candy var="product.price" /></p>
    </div>
  </candy:for>
</div>
```

### Iterating Over Objects

```javascript
// Controller
Candy.set('settings', {
  theme: 'dark',
  language: 'en',
  notifications: true
})
```

```html
<!-- View -->
<table>
  <candy:for in="settings" key="settingKey" value="settingValue">
    <tr>
      <td><candy var="settingKey" /></td>
      <td><candy var="settingValue" /></td>
    </tr>
  </candy:for>
</table>
```

### While Loop

Use while loops for conditional iteration:

```html
<script:candy>
  let counter = 0;
</script:candy>

<candy:while condition="counter < 5">
  <p>Item <candy var="counter + 1" /></p>
  <script:candy>counter++;</script:candy>
</candy:while>
```

**Note:** Be careful with while loops to avoid infinite loops. The condition must eventually become false.

### Loop Control Statements

#### Break

Exit the loop early:

```html
<candy:for in="products" value="product">
  <candy:if condition="product.stock === 0">
    <p class="notice">Some products are out of stock</p>
    <candy:break />
  </candy:if>
  <div><candy var="product.name" /></div>
</candy:for>
```

#### Continue

Skip to the next iteration:

```html
<candy:for in="users" value="user">
  <candy:if condition="user.isBlocked">
    <candy:continue />
  </candy:if>
  
  <div class="user">
    <h3><candy var="user.name" /></h3>
    <p><candy var="user.email" /></p>
  </div>
</candy:for>
```

### Practical Examples

#### Product List with Numbering

```html
<div class="product-list">
  <h2>Our Products</h2>
  
  <candy:for in="products" key="i" value="product">
    <div class="product-item">
      <span class="number">#<candy var="i + 1" /></span>
      <img src="<candy var="product.image" />" alt="<candy var="product.name" />">
      <h3><candy var="product.name" /></h3>
      <p class="price">$<candy var="product.price" /></p>
      
      <candy:if condition="product.discount">
        <span class="discount">-<candy var="product.discount" />%</span>
      </candy:if>
    </div>
  </candy:for>
</div>
```

#### Table with Data

```html
<table class="users-table">
  <thead>
    <tr>
      <th>#</th>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <candy:for in="users" key="index" value="user">
      <tr>
        <td><candy var="index + 1" /></td>
        <td><candy var="user.name" /></td>
        <td><candy var="user.email" /></td>
        <td><candy var="user.role" /></td>
        <td>
          <candy:if condition="user.isActive">
            <span class="badge success">Active</span>
          <candy:else>
            <span class="badge danger">Inactive</span>
          </candy:if>
        </td>
      </tr>
    </candy:for>
  </tbody>
</table>
```

#### Nested Loops

```html
<div class="categories">
  <candy:for in="categories" value="category">
    <div class="category">
      <h2><candy var="category.name" /></h2>
      
      <div class="products">
        <candy:for in="category.products" value="product">
          <div class="product">
            <h3><candy var="product.name" /></h3>
            <p>$<candy var="product.price" /></p>
          </div>
        </candy:for>
      </div>
    </div>
  </candy:for>
</div>
```

#### Grid Layout

```html
<div class="grid">
  <candy:for in="items" key="i" value="item">
    <div class="grid-item">
      <img src="<candy var="item.image" />" alt="<candy var="item.title" />">
      <h3><candy var="item.title" /></h3>
      <p><candy var="item.description" /></p>
      
      <!-- Add row break every 3 items -->
      <candy:if condition="(i + 1) % 3 === 0">
        <div class="row-break"></div>
      </candy:if>
    </div>
  </candy:for>
</div>
```

#### Filtering with Continue

```html
<div class="active-users">
  <h2>Active Users</h2>
  
  <candy:for in="users" value="user">
    <!-- Skip inactive users -->
    <candy:if condition="!user.isActive">
      <candy:continue />
    </candy:if>
    
    <!-- Skip blocked users -->
    <candy:if condition="user.isBlocked">
      <candy:continue />
    </candy:if>
    
    <div class="user-card">
      <h3><candy var="user.name" /></h3>
      <p><candy var="user.email" /></p>
    </div>
  </candy:for>
</div>
```

#### Empty State Handling

```html
<div class="products-section">
  <h2>Products</h2>
  
  <candy:if condition="products && products.length > 0">
    <div class="products-grid">
      <candy:for in="products" value="product">
        <div class="product-card">
          <h3><candy var="product.name" /></h3>
          <p>$<candy var="product.price" /></p>
        </div>
      </candy:for>
    </div>
  <candy:else>
    <div class="empty-state">
      <p>No products found.</p>
      <a href="/products/add">Add your first product</a>
    </div>
  </candy:if>
</div>
```

#### Alternating Row Colors

```html
<table>
  <candy:for in="items" key="i" value="item">
    <tr class="<candy:if condition="i % 2 === 0">even<candy:else>odd</candy:if>">
      <td><candy var="item.name" /></td>
      <td><candy var="item.value" /></td>
    </tr>
  </candy:for>
</table>
```

#### Limited Results with Break

```html
<div class="top-products">
  <h2>Top 5 Products</h2>
  
  <script:candy>
    let count = 0;
  </script:candy>
  
  <candy:for in="products" value="product">
    <candy:if condition="count >= 5">
      <candy:break />
    </candy:if>
    
    <div class="product">
      <h3><candy var="product.name" /></h3>
      <p>$<candy var="product.price" /></p>
    </div>
    
    <script:candy>count++;</script:candy>
  </candy:for>
</div>
```

#### Pagination with While

```html
<script:candy>
  const itemsPerPage = 10;
  const currentPage = parseInt(Candy.Request.get('page')) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  let index = startIndex;
</script:candy>

<div class="items">
  <candy:while condition="index < endIndex && index < items.length">
    <div class="item">
      <candy var="items[index].name" />
    </div>
    <script:candy>index++;</script:candy>
  </candy:while>
</div>
```

### Best Practices

1. **Check for existence**: Always verify the array/object exists before looping
2. **Use meaningful names**: Choose descriptive variable names for keys and values
3. **Avoid complex logic**: Keep loop bodies simple, move complex logic to controllers
4. **Handle empty states**: Always provide feedback when there are no items
5. **Be careful with while**: Ensure while loops will eventually terminate

**Good:**
```javascript
// Controller - prepare data
Candy.set('activeUsers', users.filter(u => u.isActive))
```

```html
<!-- View - simple loop -->
<candy:for in="activeUsers" value="user">
  <div><candy var="user.name" /></div>
</candy:for>
```

**Avoid:**
```html
<!-- Too complex for a view -->
<candy:for in="users" value="user">
  <candy:if condition="user.isActive && !user.isBlocked && user.role !== 'guest'">
    <div><candy var="user.name" /></div>
  </candy:if>
</candy:for>
```
