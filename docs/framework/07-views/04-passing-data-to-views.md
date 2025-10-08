## 📦 Passing Data to Views

In CandyPack, you pass data to views using the `Candy.set()` method. This data is then accessible in view files using the `get()` function.

### Using Candy.set()

#### Single Variable

```javascript
module.exports = function (Candy) {
  Candy.set('pageTitle', 'User Profile')
  Candy.set('userName', 'John Doe')
  
  Candy.View.set({
    skeleton: 'main',
    content: 'user.profile'
  })
}
```

#### Multiple Variables at Once

```javascript
module.exports = function (Candy) {
  Candy.set({
    pageTitle: 'User Profile',
    pageDescription: 'View and edit your profile',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin'
    },
    products: [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 }
    ]
  })
  
  Candy.View.set({
    skeleton: 'main',
    content: 'user.profile'
  })
}
```

### Accessing Data in Views

Data set with `Candy.set()` is accessed using the `get()` function:

```html
<!-- view/content/user/profile.html -->
<div class="profile">
  <h1>{{ get('pageTitle') }}</h1>
  <p>{{ get('pageDescription') }}</p>
  
  <div class="user-info">
    <h2>{{ get('user').name }}</h2>
    <p>{{ get('user').email }}</p>
    <span class="badge">{{ get('user').role }}</span>
  </div>
  
  <div class="products">
    <candy-for in="get('products')" value="product">
      <div class="product-card">
        <h3>{{ product.name }}</h3>
        <p>${{ product.price }}</p>
      </div>
    </candy-for>
  </div>
</div>
```

### Working with Request Data

```javascript
module.exports = async function (Candy) {
  // Get request parameters (see Request documentation for details)
  const searchQuery = await Candy.request('q')
  const currentPage = await Candy.request('page') || 1
  
  Candy.set({
    searchQuery: searchQuery,
    currentPage: currentPage
  })
  
  Candy.View.set({
    skeleton: 'main',
    content: 'search.results'
  })
}
```

See the Request & Response documentation for more details on handling request data.

### Working with Database

Fetch data from database and pass it to views:

```javascript
module.exports = async function (Candy) {
  const userId = Candy.Request.get('id')
  
  // Fetch user data
  const user = await Candy.Mysql.table('users')
    .where('id', userId)
    .first()
  
  // Pass to view
  Candy.set('user', user)
  
  Candy.View.set({
    skeleton: 'main',
    content: 'user.profile'
  })
}
```

See the Database documentation for more details on querying data.

### Working with Authentication

```javascript
module.exports = function (Candy) {
  if (Candy.Auth.check()) {
    Candy.set({
      currentUser: Candy.Auth.user(),
      isLoggedIn: true
    })
  } else {
    Candy.set('isLoggedIn', false)
  }
  
  Candy.View.set({
    skeleton: 'main',
    content: 'home'
  })
}
```

View usage:

```html
<candy-if if="get('isLoggedIn')">
  <p>Welcome back, {{ get('currentUser').name }}!</p>
<candy-else>
  <a href="/login">Log In</a>
</candy-if>
```

### Computed Values

You can compute values before passing them to views:

```javascript
module.exports = async function (Candy) {
  const products = await Candy.Mysql.table('products').get()
  
  Candy.set({
    products: products,
    totalProducts: products.length,
    averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
    inStockCount: products.filter(p => p.stock > 0).length
  })
  
  Candy.View.set({
    skeleton: 'main',
    content: 'products.list'
  })
}
```

### Error Handling

```javascript
module.exports = async function (Candy) {
  try {
    const productId = Candy.Request.get('id')
    const product = await Candy.Mysql.table('products')
      .where('id', productId)
      .first()
    
    if (!product) {
      Candy.set('error', 'Product not found')
    } else {
      Candy.set('product', product)
    }
    
  } catch (error) {
    Candy.set('error', 'An error occurred')
  }
  
  Candy.View.set({
    skeleton: 'main',
    content: 'product.detail'
  })
}
```

View usage:

```html
<candy-if if="get('error')">
  <div class="alert alert-danger">
    {{ get('error') }}
  </div>
<candy-else>
  <div class="product">
    <h1>{{ get('product').name }}</h1>
    <p>{{ get('product').description }}</p>
  </div>
</candy-if>
```

### Best Practices

1. **Use Candy.set() for all data** - Consistent and structured
2. **Set data before rendering** - All `Candy.set()` calls should come before `Candy.View.set()`
3. **Use descriptive names** - `pageTitle`, `userProfile`, `productList` instead of `title`, `data`, `list`
4. **Group related data** - Use objects to group related data together
5. **Compute in controller** - Do calculations in the controller, not in views

### Alternative: Direct Property Assignment

While `Candy.set()` is recommended, you can also assign properties directly:

```javascript
module.exports = function (Candy) {
  // This works but Candy.set() is preferred
  Candy.pageTitle = 'Home'
  Candy.userName = 'John'
  
  Candy.View.set({
    skeleton: 'main',
    content: 'home'
  })
}
```

However, data set this way is accessed differently in views:

```html
<!-- Direct assignment uses Candy. prefix -->
<h1>{{ Candy.pageTitle }}</h1>

<!-- Candy.set() uses get() function -->
<h1>{{ get('pageTitle') }}</h1>
```

**Recommendation:** Always use `Candy.set()` for consistency and better AJAX support.
