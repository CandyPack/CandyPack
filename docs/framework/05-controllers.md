# Controllers: The Brains of Your App

If routing is the traffic cop, then controllers are the destination! Controllers are where your application's main logic lives. They are JavaScript files that do the heavy lifting: they process user input, talk to the database, and decide what response to send back.

## 🏗️ How to Build a Controller

A controller is just a JavaScript module that exports a function. This function automatically gets the magical `Candy` context object we talked about in the overview.

#### A Simple "Hello World" Controller

Check out this basic example from `controller/page/index.js`:

```javascript
// This function is our controller!
module.exports = function (Candy) {
  // It simply returns a string.
  return 'Welcome to my awesome CandyPack server!'
}
```

This little guy is responsible for handling the homepage route (`/`). When it runs, it just sends a simple string back to the user's browser.

## 🤝 Your trusty `Candy` Assistant

Remember the `Candy` object? It's your best friend inside a controller. It's passed to your controller function and gives you all the tools you need for the current request.

#### Awesome Services at Your Fingertips

*   `Candy.Request`: Info about the user's request.
*   `Candy.View`: Renders your HTML pages.
*   `Candy.Auth`: Manages user logins.
*   `Candy.Token`: Protects your forms.
*   `Candy.Lang`: Helps with different languages.

#### Handy Helper Functions

*   `Candy.return(data)`: Send back a response.
*   `Candy.direct(url)`: Redirect the user to a new page.
*   `Candy.cookie(key, value)`: Set a browser cookie.
*   `Candy.validator()`: Check user input easily.

With controllers and the `Candy` object, you have everything you need to start building powerful application logic!
