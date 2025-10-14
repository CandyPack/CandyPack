## 📥 The Request Object

The `Candy.Request` object contains information about the user's incoming request.

### Getting Request Parameters

#### Using Candy.request() (Recommended)

The easiest way to get request parameters is using `Candy.request()`:

```javascript
module.exports = async function (Candy) {
  // Get parameter from GET or POST automatically
  const userName = await Candy.request('name')
  const userId = await Candy.request('id')
  
  return `Hello ${userName}!`
}
```

**Specify Method (Optional):**

```javascript
module.exports = async function (Candy) {
  // Get from GET parameters only
  const searchQuery = await Candy.request('q', 'GET')
  
  // Get from POST parameters only
  const formName = await Candy.request('name', 'POST')
  
  return `Searching for: ${searchQuery}`
}
```

#### Direct Access

You can also access request data directly:

```javascript
module.exports = function (Candy) {
  // GET parameters (URL query string like ?id=123)
  const userId = Candy.Request.get('id')
  
  // POST parameters (form data)
  const userName = Candy.Request.post('name')
  
  return `User: ${userName}`
}
```

### Request Properties

*   `Candy.Request.method` - HTTP method ('GET', 'POST', etc.)
*   `Candy.Request.url` - Full URL the user visited
*   `Candy.Request.host` - Website's hostname
*   `Candy.Request.ip` - User's IP address
*   `Candy.Request.ssl` - Whether connection is SSL/HTTPS

### Request Headers

```javascript
module.exports = function (Candy) {
  const userAgent = Candy.Request.header('user-agent')
  const contentType = Candy.Request.header('content-type')
  
  return `Browser: ${userAgent}`
}
```

### Complete Example

```javascript
module.exports = async function (Candy) {
  // Get request parameters
  const productId = await Candy.request('id')
  const quantity = await Candy.request('quantity') || 1
  
  // Check request method
  if (Candy.Request.method === 'POST') {
    // Handle form submission
    const result = await processOrder(productId, quantity)
    return { success: true, orderId: result.id }
  }
  
  // Show product page
  Candy.set({
    productId: productId,
    quantity: quantity
  })
  
  Candy.View.set({
    skeleton: 'main',
    content: 'product.detail'
  })
}
```
