# Handling Requests and Sending Responses

At its heart, a web app is all about communication. A user sends a "request," and your app sends back a "response." Let's look at how you can handle this conversation in CandyPack.

## 📥 The Request Object: What is the User Asking For?

Your `Candy.Request` object is a treasure chest of information about the user's incoming request. It tells you everything you need to know about what they're trying to do.

#### Peeking Inside the Request

Here are some of the goodies you can find:

*   `Candy.Request.get`: Data from the URL's query string (like `?id=123`).
*   `Candy.Request.post`: Data from a submitted HTML form.
*   `Candy.Request.headers`: The HTTP headers sent by the browser.
*   `Candy.Request.ip`: The user's IP address.
*   `Candy.Request.method`: The HTTP method used ('GET', 'POST', etc.).
*   `Candy.Request.url`: The full URL the user visited.
*   `Candy.Request.host`: The website's hostname.
*   `Candy.Request.files`: Any files the user uploaded.

**Example Time!**
```javascript
module.exports = function (Candy) {
  // Let's get the user's name from the URL (?name=Jules)
  const userName = Candy.Request.get.name;
  // And find out what browser they're using
  const userAgent = Candy.Request.headers['user-agent'];

  return `Hey ${userName}! Thanks for visiting with ${userAgent}.`;
}
```

## 📤 Sending a Response: Replying to the User

Once you've processed the request, it's time to send something back. You've got a few options.

#### The Simple Way: Just Return It!

For many cases, you can just `return` a value from your controller. CandyPack is smart enough to figure out what to do.

```javascript
// Return some HTML
module.exports = function (Candy) {
  return '<h1>Welcome to the site!</h1>';
}

// Return some JSON for an API
module.exports = function (Candy) {
  return { status: 'success', message: 'Your data was saved!' };
}
```

#### The Helper Functions: More Control

Need a bit more control? The `Candy` object has your back.

*   `Candy.return(data)`: Does the same thing as a direct return, but you can call it from anywhere in your function. It stops everything and sends the response immediately.
*   `Candy.direct(url)`: Need to send the user to a different page? This function performs a redirect, telling the user's browser to go to a new URL.

**Example:**
```javascript
module.exports = function (Candy) {
  // If the user isn't logged in...
  if (!Candy.Auth.isLogin()) {
    // ...send them to the login page!
    return Candy.direct('/login');
  }

  // Otherwise, give them their data.
  Candy.return({ data: 'here is your secret stuff' });
}
```
