## ✅ The `Validator` Service

To start validating, just grab a new validator instance by calling the `Candy.validator()` helper function.

#### The 3-Step Validation Dance

1.  **Get a validator**: `const validator = Candy.validator()`
2.  **Check your data**: `validator.check(data, rules)`
3.  **Ask if it failed**: `validator.fails()`

The `check` method is the star of the show. It takes:
*   `data`: The object you want to check (usually `Candy.Request.post`).
*   `rules`: An object where you define the rules for each piece of data. You can even chain rules together with a pipe (`|`).

#### Rules of the Game

Here are some of the rules you can use:

*   `required`: The field can't be empty.
*   `email`: Must be a valid-looking email address.
*   `numeric`: Must be a number.
*   `min:X`: Must be at least `X` characters long (for text) or `X` in value (for numbers).
*   `max:X`: Must be no more than `X` characters long (for text) or `X` in value (for numbers).
*   `equals:fieldName`: The field must have the same value as another field (great for password confirmation!).

#### Handling Errors

If the validation doesn't pass, you can get an array of all the error messages with `validator.getErrors()`.

#### Example: A User Signup Form

Let's see how you'd validate a typical user registration form.

```javascript
module.exports = function (Candy) {
    // 1. Get a new validator
    const validator = Candy.validator();
    const userInput = Candy.Request.post;

    // 2. Define the rules for our dream user
    const rules = {
        username: 'required|min:4',
        email: 'required|email',
        password: 'required|min:8',
        password_confirm: 'required|equals:password'
    };

    // 3. Check the user's input against our rules
    validator.check(userInput, rules);

    // 4. Did it fail?
    if (validator.fails()) {
        // If so, send back an error response with the messages
        return Candy.return({
            error: 'Houston, we have a validation problem!',
            messages: validator.getErrors()
        }).status(400); // 400 means "Bad Request"
    }

    // If we get here, the data is valid and clean!
    // Now you can safely create the new user.
    // ...

    return { success: true, message: 'Welcome aboard! User created.' };
}
```
