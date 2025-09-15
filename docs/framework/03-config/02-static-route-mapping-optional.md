## 🗺️ Static Route Mapping (Optional)

Normally, all publicly served files should be in your `public` folder. However, if you need to expose a specific file from somewhere else on your server, you can use the optional `route` object in your `config.json`. This creates a direct mapping from a URL path to that file.

```json
"route": {
  "/assets/js/candy.js": "${candy}/framework/web/candy.js",
  "/css/main.css": "/path/to/your/project/assets/css/main.css"
}
```

When a user visits a URL that matches a key in the `route` object, CandyPack will serve the corresponding file from your filesystem.

#### Using the `${candy}` Variable

The special variable `${candy}` is a shortcut that points to the root directory where CandyPack is installed. This is helpful for linking to files that are part of the framework itself.

#### Absolute Paths

For your own project files, you should provide a full, absolute path to the file on your server.
