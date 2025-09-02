# Views: Making Things Pretty

Sending back plain text is fine, but let's be honest—you want to build beautiful web pages! This is where Views come in. Views help you separate your pretty HTML code from your application logic, which makes your project much cleaner.

The `Candy.View` service is your tool for rendering these HTML templates.

## 📁 The `view/` Directory

By convention, all your view files should live in the `view/` folder at the root of your project.

## 🎨 Rendering a View

To bring a view to life, you'll use the `Candy.View.render()` method.

`Candy.View.render('path/to/your-view', { some: 'data' })`

*   `'path/to/your-view'`: The path to your view file inside the `view/` folder. No need to add the file extension!
*   `{ some: 'data' }`: An optional object of data you want to pass to your view. This is how you send dynamic information from your controller to your HTML.

#### Let's Build a Profile Page!

Imagine you have a user profile page at `view/user/profile.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>User Profile</title>
</head>
<body>
    <!-- The 'name' and 'email' variables come from our controller -->
    <h1>Hello, {{ name }}!</h1>
    <p>We've got your email down as {{ email }}.</p>
</body>
</html>
```

Now, let's make a controller to render it:

```javascript
module.exports = function (Candy) {
  // Let's create some data to send to the view
  const userData = {
    name: 'Captain Coder',
    email: 'captain@coder.com'
  };

  // Now, render the view and pass the data along
  return Candy.View.render('user/profile', userData);
}
```

When this code runs, CandyPack's simple template engine will find the `{{ name }}` and `{{ email }}` placeholders in your HTML and replace them with the data from your controller. Voila! A beautiful, dynamic page.
