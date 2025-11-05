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

#### `authPage(path, authViewConfig, guestViewConfig)`
Defines a controller-less route with different views for authenticated and guest users.

```javascript
// Show dashboard to logged-in users, login page to guests
Candy.Route.authPage('/', 
  {
    skeleton: 'main',
    head: 'dashboard.head',
    content: 'dashboard',
    script: 'dashboard'
  },
  {
    skeleton: 'auth',
    head: 'auth',
    content: 'auth.login',
    script: 'auth'
  }
);
```

This pattern allows you to define different views for the same path based on authentication:
- The authenticated view is shown to logged-in users
- The guest view is shown to non-authenticated users
- No redirect needed - seamless view switching based on auth state

#### Guest-Only Pages
For pages that should only be accessible to non-authenticated users (like login or register pages), you can redirect authenticated users to another page:

```javascript
// Register page - redirect logged-in users to dashboard
Candy.Route.authPage('/register', 
  (Candy) => Candy.direct('/dashboard'),  // Authenticated users get redirected
  {skeleton: 'auth', content: 'auth.register'}  // Guests see register form
);

// Or return 404 to authenticated users by passing null
Candy.Route.authPage('/login',
  null,  // Authenticated users get 404
  {skeleton: 'auth', content: 'auth.login'}
);
```

This ensures that users who are already logged in cannot access registration or login pages. If you pass `null` as the authenticated handler, logged-in users will receive a 404 error.

#### `authGet(path, authController, guestController)`
The same as `authPage`, but for API-style `GET` requests.

#### `authPost(path, authController, guestController)`
The same as `authPage`, but for `POST` requests.
