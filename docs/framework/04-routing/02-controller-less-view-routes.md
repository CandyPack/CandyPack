## ⚡ Controller-less View Routes

For simple pages that don't require complex logic in a controller, you can render a view directly from your route file. This is done by chaining the `.view()` method to a `page` route.

#### `page(path).view({ ... })`
This defines a page and immediately tells it which view components to render.

```javascript
Candy.Route.page("/users").view({
    skeleton: "dashboard",
    header: "dashboard.main",
    sidebar: "dashboard.main",
    footer: "dashboard.main",
    content: "users"
});
```
This example tells CandyPack to render the `/users` page by assembling a view from multiple parts, likely using a main `dashboard` skeleton and filling it with different content blocks.
