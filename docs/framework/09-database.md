# Talking to Your Database

Most web apps need to store data, and CandyPack gives you a simple way to talk to a MySQL database without the usual headaches.

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

## 🏃 Running a Query

The `Candy.Mysql.query()` method is your gateway to the database.

`Candy.Mysql.query(sql, params)`

*   `sql`: The SQL query you want to run. **Pro Tip:** Use `?` as placeholders for your data. This is a crucial security practice that prevents malicious database commands.
*   `params`: An array of values that will safely replace the `?` placeholders in your query.

The `query` method is an `async` function, which means it returns a Promise. The easiest way to use it is with `async/await` in your controller.

#### Example: Getting Data from the Database

```javascript
module.exports = async function (Candy) {
  const userId = Candy.Request.get.id;

  try {
    const sql = 'SELECT id, name, email FROM users WHERE id = ?';
    const params = [userId]; // This will safely replace the `?` above

    const [rows] = await Candy.Mysql.query(sql, params);

    if (rows.length > 0) {
      return { user: rows[0] };
    } else {
      return { error: 'Sorry, we could not find that user!' };
    }
  } catch (error) {
    // It's always a good idea to handle potential errors!
    console.error(error);
    return { error: 'Oh no! A database error occurred.' };
  }
}
```

#### Example: Adding New Data to the Database

```javascript
module.exports = async function (Candy) {
  const { name, email } = Candy.Request.post;

  try {
    const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
    const params = [name, email];

    const [result] = await Candy.Mysql.query(sql, params);

    return { success: true, message: `User created with ID: ${result.insertId}` };
  } catch (error) {
    console.error(error);
    return { error: 'We could not create the new user.' };
  }
}
```
