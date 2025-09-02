# Configuring Your Application

Every app needs a place to store its settings. CandyPack uses a single `config.json` file for this purpose, which must be a valid JSON file. This is your go-to spot for things like your app's name, database details, or any other settings you need.

## 🔌 Database Connection

When you add a `database` object to your `config.json`, the system will automatically connect to your MySQL database. No separate connection setup is needed in your code.

```json
"database": {
    "host": "localhost",
    "user": "your_user",
    "password": "your_password",
    "database": "your_database"
}
```

Once this is configured, you can directly use `Candy.Mysql` commands to run queries.

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

## ⏱️ Request Timeout

You can configure the global timeout for incoming requests by adding a `request` object to your `config.json`.

```json
"request": {
  "timeout": 10000
}
```

The `timeout` value is in milliseconds. In this example, any request that takes longer than 10,000 milliseconds (10 seconds) to process will be timed out.
