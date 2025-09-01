# Authentication & Security

Keeping your application and your users safe is super important. CandyPack comes with some built-in tools to help you with user logins and to protect against common attacks.

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

## 🛡️ Foiling Villains with CSRF Protection

Cross-Site Request Forgery (CSRF) is a scary-sounding attack where a bad guy tries to trick your users into submitting forms they didn't mean to. The `Candy.Token` service is your shield against this!

#### How it Works

The idea is simple:
1.  When you show a form, you generate a secret, one-time-use token.
2.  You put this token in a hidden field in the form.
3.  When the user submits the form, you check if the token they sent back matches the one you generated.

If they don't match, it's a trap!

#### Generating and Checking Tokens

*   `Candy.Token.get()`: Creates a new secret token.
*   `Candy.Token.check(theToken)`: Checks if `theToken` is valid.

#### Example: Securing a Form

**1. Add the token to your form view:**
```html
<form action="/some-action" method="post">
    <!-- Add the secret token here! -->
    <input type="hidden" name="csrf_token" value="{{ csrfToken }}">

    <!-- ... your other form fields ... -->
    <button type="submit">Submit</button>
</form>
```

**2. Your controller that shows the form:**
```javascript
module.exports = function (Candy) {
    // Get a token and pass it to the view
    const token = Candy.Token.get();
    return Candy.View.render('your_form_view', { csrfToken: token });
}
```

**3. Your controller that handles the form submission:**
```javascript
module.exports = function (Candy) {
    const submittedToken = Candy.Request.post.csrf_token;

    // Check the token!
    if (!Candy.Token.check(submittedToken)) {
        // If it's bad, stop right here.
        return Candy.return('Invalid CSRF Token!').status(403);
    }

    // If we get here, the token was good!
    // ...you can now safely process the form...
}
```
