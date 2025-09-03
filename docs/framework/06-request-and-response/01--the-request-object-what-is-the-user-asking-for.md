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
