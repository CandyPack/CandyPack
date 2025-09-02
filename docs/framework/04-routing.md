# Routing: Directing Your Web Traffic

Routing is like being a traffic cop for your website. It's the process of looking at a URL a user is visiting and deciding which piece of your code should handle it. In CandyPack, you'll define all your routes in `route/` files using the global `Candy.Route` object.

Routes are defined for different HTTP methods (`GET`, `POST`, etc.) and can be configured to require authentication.

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

## 📦 API and Data Routes

#### `get(path, controller, options)`
Defines a route that responds to `GET` requests. This is ideal for API endpoints that return data (like JSON).

-   `options`: By default, CandyPack protects routes from CSRF attacks by checking for a token. For a public API or stateless endpoint, you must disable this by passing `{ token: false }`. If you don't, the server will expect a token and will not return a response if one isn't provided.

```javascript
// An API endpoint at GET /api/users/123
// We disable the token check as this is a public API.
Candy.Route.get('/api/users/{id}', 'api/users.get', { token: false });
```

#### `post(path, controller, options)`
Defines a route that responds to `POST` requests, typically used for form submissions. The `{ token: false }` option works here as well, but should be used with caution as POST routes are primary targets for CSRF attacks.

```javascript
// A form that posts data to /login
Candy.Route.post('/login', 'auth.login');
```

## 🔐 Authentication-Aware Routes

These are powerful helper methods that let you define different controllers for the same route based on whether the user is logged in or not.

#### `authPage(path, authController, guestController)`
Defines a `page` route that shows different content to logged-in and guest users.

-   `path`: The URL path.
-   `authController`: The controller to run if the user **is** logged in.
-   `guestController`: The controller to run if the user **is not** logged in.

```javascript
// If the user is logged in, show them their dashboard.
// If they are a guest, show them the login page.
Candy.Route.authPage('/dashboard', 'dashboard.index', 'auth.loginPage');
```

#### `authGet(path, authController, guestController)`
The same as `authPage`, but for API-style `GET` requests.

#### `authPost(path, authController, guestController)`
The same as `authPage`, but for `POST` requests.

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
