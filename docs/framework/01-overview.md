# Welcome to the CandyPack Framework!

Hey there, developer! Welcome to the CandyPack web framework. This is your toolkit for building awesome websites and powerful APIs with ease.

When you write a controller, a `Candy` object is passed directly to your function, giving you access to all its powers. It's your personal assistant for the request.

## 🧰 What's in the `Candy` box?

Your `Candy` assistant comes with a bunch of handy services:

*   `Request`: All the details about the user's incoming request.
*   `View`: A tool to render your beautiful HTML pages.
*   `Auth`: Your friendly security guard for managing the current user's login.
*   `Token`: Helps protect the user's forms from nasty CSRF attacks.
*   `Lang`: A helper for translating your app into the user's language.

## ✨ Super-Handy Helper Functions

On top of that, `Candy` has some quick-and-easy helper functions:

*   `return(data)`: Quickly send a response back to the user and you're done.
*   `direct(url)`: Need to send the user to another page? This is your tool.
*   `cookie(key, value)`: Leave a little cookie in the user's browser.
*   `validator()`: A powerful tool to check the user's submitted data.
