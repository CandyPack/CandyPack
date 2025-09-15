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
