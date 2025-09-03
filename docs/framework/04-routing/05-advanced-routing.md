## 🛠️ Advanced Routing

#### `set(type, path, controller, options)`
This is the powerful base method that all other routing methods use internally. You can use it to create routes for any custom type.

-   `type`: A string defining the route type (e.g., `page`, `post`, `#page` for authenticated pages, etc.).

```javascript
// This is equivalent to Candy.Route.post('/register', 'auth.register')
Candy.Route.set('post', '/register', 'auth.register');

// This creates an authenticated page route
Candy.Route.set('#page', '/account', 'account.settings');
```
