## ⚡ Controller-less View Routes

For simple pages that don't require complex logic in a controller, you can render a view directly from your route file by passing a view configuration object as the second parameter.

#### `page(path, { ... })`
This defines a page and immediately tells it which view components to render.

```javascript
Candy.Route.page("/users", {
    skeleton: "dashboard",
    header: "dashboard.main",
    sidebar: "dashboard.main",
    footer: "dashboard.main",
    content: "users"
});
```
This example tells CandyPack to render the `/users` page by assembling a view from multiple parts, likely using a main `dashboard` skeleton and filling it with different content blocks.

#### `authPage(path, { ... }, { ... })`
Similar to `page()`, but requires authentication. You can provide two view configurations: one for authenticated users and one for guests.

```javascript
// Authenticated users see the dashboard, guests see the login page
Candy.Route.authPage('/', 
    {skeleton: 'main', content: 'dashboard'},
    {skeleton: 'auth', content: 'auth.login'}
);
```

See [Authentication-Aware Routes](04-authentication-aware-routes.md) for more details.
