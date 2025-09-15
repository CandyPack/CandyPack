## 🔐 User Logins with `Auth.js`

The `Candy.Auth` service is your bouncer, managing who gets in and who stays out. It handles user login sessions for you.

#### Letting a User In

`Candy.Auth.login(userId, userData)`

*   `userId`: A unique ID for the user (like their database ID).
*   `userData`: An object with any user info you want to remember, like their username or role.

When you call this, `Auth` creates a secure session for the user.

#### Checking the Guest List

*   `Candy.Auth.isLogin()`: Is the current user logged in? Returns `true` or `false`.
*   `Candy.Auth.getId()`: Gets the ID of the logged-in user.
*   `Candy.Auth.get('some-key')`: Grabs a specific piece of info from the `userData` you stored.

#### Showing a User Out

*   `Candy.Auth.logout()`: Ends the user's session and logs them out.

#### Example: A Login Flow
```javascript
// Controller for your login form
module.exports = async function (Candy) {
    const { username, password } = Candy.Request.post;

    // IMPORTANT: You need to write your own code to find the user in your database!
    const user = await yourDatabase.findUser(username, password);

    if (user) {
        // User is valid! Log them in.
        Candy.Auth.login(user.id, { username: user.username });
        return Candy.direct('/dashboard'); // Send them to their dashboard
    } else {
        // Bad credentials, send them back to the login page
        return Candy.direct('/login?error=1');
    }
}

// A protected dashboard page
module.exports = function (Candy) {
    // If they're not logged in, kick them back to the login page.
    if (!Candy.Auth.isLogin()) {
        return Candy.direct('/login');
    }

    const username = Candy.Auth.get('username');
    return `Welcome back, ${username}!`;
}
```
