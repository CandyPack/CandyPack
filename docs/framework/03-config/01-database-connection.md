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
