## 🔐 Authentication-Aware Routes

These are powerful helper methods that let you define different controllers or views for the same route based on whether the user is logged in or not.

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

#### `authPage(path).view(viewConfig, guestViewConfig)`
Defines a controller-less route with different views for authenticated and guest users.

```javascript
// Show dashboard view to logged-in users
Candy.Route.authPage('/').view({
  skeleton: 'main',
  head: 'dashboard.head',
  content: 'dashboard',
  script: 'dashboard'
});

// Show login view to guests (fallback)
Candy.Route.page('/').view({
  skeleton: 'auth',
  head: 'auth',
  content: 'auth.login',
  script: 'auth'
});
```

This pattern allows you to define two separate routes for the same path:
- The `authPage` route is checked first and requires authentication
- If authentication fails, it falls back to the regular `page` route
- No redirect needed - seamless view switching based on auth state

#### `authGet(path, authController, guestController)`
The same as `authPage`, but for API-style `GET` requests.

#### `authPost(path, authController, guestController)`
The same as `authPage`, but for `POST` requests.
