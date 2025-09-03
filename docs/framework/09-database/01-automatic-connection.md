## 🔌 Automatic Connection

Connecting to your database in CandyPack is automatic! You don't need to write any connection code. Simply add a `database` object with your credentials to your `config.json` file. Once this object exists, the `Candy.Mysql` service is enabled and ready to use.

```json
"database": {
    "host": "localhost",
    "user": "your_user",
    "password": "your_password",
    "database": "your_database"
}
```

With this configuration in place, you can use `Candy.Mysql` commands directly in your controllers to run queries. No separate connection setup is needed.
