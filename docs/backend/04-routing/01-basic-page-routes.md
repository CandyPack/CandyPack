## 📄 Basic Page Routes

#### `page(path, controller)`
This is the most common method. It maps a URL path to a controller that is expected to render a standard HTML page. It handles `GET` requests.

-   `path`: The URL path to match (e.g., `/about`).
-   `controller`: The name of the controller file.

```javascript
// When a user visits yoursite.com/
Candy.Route.page('/', 'index');

// When a user visits yoursite.com/contact
Candy.Route.page('/contact', 'contact-form');
```
