## 🗄️ Using MySQL

CandyPack provides a powerful query builder for safe and easy database operations.

### Selecting Data

#### Get All Records

```javascript
const users = await Candy.Mysql.table('users').get()
```

#### Get First Record

```javascript
const user = await Candy.Mysql.table('users').where('id', 1).first()
```

#### Select Specific Columns

```javascript
const users = await Candy.Mysql.table('users')
  .select('id', 'name', 'email')
  .get()
```

### Where Conditions

```javascript
// Single condition
const users = await Candy.Mysql.table('users')
  .where('status', 'active')
  .get()

// Multiple conditions (AND)
const users = await Candy.Mysql.table('users')
  .where('status', 'active')
  .where('verified', 1)
  .get()

// OR condition
const users = await Candy.Mysql.table('users')
  .where('role', 'admin')
  .orWhere('role', 'moderator')
  .get()

// Comparison operators
const products = await Candy.Mysql.table('products')
  .where('price', '>', 100)
  .where('stock', '<=', 10)
  .get()

// LIKE
const users = await Candy.Mysql.table('users')
  .where('name', 'LIKE', '%John%')
  .get()

// IN
const users = await Candy.Mysql.table('users')
  .where('role', 'IN', ['admin', 'moderator'])
  .get()
```

### Ordering and Limiting

```javascript
// Order by
const users = await Candy.Mysql.table('users')
  .order('created_at', 'desc')
  .get()

// Limit
const users = await Candy.Mysql.table('users')
  .limit(10)
  .get()

// Pagination
const page = 2
const perPage = 20
const users = await Candy.Mysql.table('users')
  .limit((page - 1) * perPage, perPage)
  .get()
```

### Counting Records

```javascript
const userCount = await Candy.Mysql.table('users')
  .where('status', 'active')
  .rows()
```

### Joins

```javascript
const orders = await Candy.Mysql.table('orders')
  .leftJoin('users', 'orders.user_id', 'users.id')
  .select('orders.*', 'users.name', 'users.email')
  .get()
```

### Inserting Data

```javascript
// Insert single record
const result = await Candy.Mysql.table('users').insert({
  name: 'John Doe',
  email: 'john@example.com',
  status: 'active'
})

console.log(result.id) // Inserted ID
console.log(result.affected) // Affected rows
```

### Updating Data

```javascript
const result = await Candy.Mysql.table('users')
  .where('id', 1)
  .set({
    name: 'Jane Doe',
    email: 'jane@example.com'
  })

console.log(result.affected) // Number of updated rows
```

### Deleting Data

```javascript
const result = await Candy.Mysql.table('users')
  .where('id', 1)
  .delete()

console.log(result.affected) // Number of deleted rows
```

### Raw Queries

For complex queries, use raw SQL:

```javascript
// Raw value in select
const users = await Candy.Mysql.table('users')
  .select('id', 'name', Candy.Mysql.raw('COUNT(*) as total'))
  .get()

// Raw query
const result = await Candy.Mysql.run('SELECT * FROM users WHERE status = ?', ['active'])
```

### Group By

```javascript
const stats = await Candy.Mysql.table('orders')
  .select('user_id', Candy.Mysql.raw('COUNT(*) as order_count'))
  .groupBy('user_id')
  .get()
```

### Complete Example

```javascript
module.exports = async function (Candy) {
  const page = await Candy.request('page') || 1
  const perPage = 20
  const search = await Candy.request('search')
  
  // Build query
  let query = Candy.Mysql.table('products')
    .select('id', 'name', 'price', 'stock')
    .where('status', 'active')
  
  // Add search filter
  if (search) {
    query = query.where('name', 'LIKE', `%${search}%`)
  }
  
  // Get products
  const products = await query
    .order('created_at', 'desc')
    .limit((page - 1) * perPage, perPage)
    .get()
  
  // Get total count
  const totalCount = await Candy.Mysql.table('products')
    .where('status', 'active')
    .rows()
  
  Candy.set({
    products: products,
    currentPage: page,
    totalPages: Math.ceil(totalCount / perPage)
  })
  
  Candy.View.set({
    skeleton: 'main',
    content: 'products.list'
  })
}
```

### Best Practices

1. **Always use the query builder** - It protects against SQL injection
2. **Use async/await** - All database methods are asynchronous
3. **Handle errors** - Wrap database calls in try/catch blocks
4. **Limit results** - Use `.limit()` to prevent loading too much data
5. **Select only needed columns** - Use `.select()` instead of selecting all columns

### Error Handling

```javascript
module.exports = async function (Candy) {
  try {
    const user = await Candy.Mysql.table('users')
      .where('id', await Candy.request('id'))
      .first()
    
    if (!user) {
      Candy.set('error', 'User not found')
    } else {
      Candy.set('user', user)
    }
  } catch (error) {
    console.error('Database error:', error)
    Candy.set('error', 'An error occurred')
  }
  
  Candy.View.set({
    skeleton: 'main',
    content: 'user.profile'
  })
}
```
