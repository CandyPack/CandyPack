class Auth {
  #request = null
  #table = null
  #user = null

  constructor(request) {
    this.#request = request
  }

  async check(where) {
    if (!Candy.Config.auth) Candy.Config.auth = {}
    this.#table = Candy.Config.auth.table || 'users'
    if (!this.#table) return false
    if (where) {
      let sql = Candy.Mysql.table(this.#table)
      for (let key in where) sql = sql.orWhere(key, where[key] instanceof Promise ? await where[key] : where[key])
      if (!sql.rows()) return false
      let get = await sql.get()
      let equal = false
      for (var user of get) {
        equal = Object.keys(where).length > 0
        for (let key of Object.keys(where)) {
          if (where[key] instanceof Promise) where[key] = await where[key]
          if (!user[key]) equal = false
          if (user[key] === where[key]) equal = equal && true
          else if (Candy.Var(user[key]).is('bcrypt')) equal = equal && Candy.Var(user[key]).hashCheck(where[key])
          else if (Candy.Var(user[key]).is('md5')) equal = equal && Candy.Var(where[key]).md5() === user[key]
        }
        if (equal) break
      }
      if (!equal) return false
      return user
    } else if (this.#user) {
      return true
    } else {
      let check_table = await Candy.Mysql.run('SHOW TABLES LIKE ?', true, [this.#table])
      if (check_table.length == 0) return false
      let candy_x = this.#request.cookie('candy_x')
      let candy_y = this.#request.cookie('candy_y')
      let browser = this.#request.header('user-agent')
      if (!candy_x || !candy_y || !browser) return false
      const tokenTable = Candy.Config.auth.token || 'user_tokens'
      const primaryKey = Candy.Config.auth.key || 'id'
      let sql_token = await Candy.Mysql.table(tokenTable).where(['token_x', candy_x], ['browser', browser]).get()
      if (sql_token.length !== 1) return false
      if (!Candy.Var(sql_token[0].token_y).hashCheck(candy_y)) return false
      this.#user = await Candy.Mysql.table(this.#table).where(primaryKey, sql_token[0].user).first()
      // Candy.Mysql.table(Candy.Config.auth.token).where(sql_token[0].id).set({'ip': this.#request.ip,'active': Date.now()});
      return true
    }
  }

  async login(where) {
    this.#user = null
    let user = await this.check(where)
    if (!user) return false
    if (!Candy.Config.auth) Candy.Config.auth = {}
    let key = Candy.Config.auth.key || 'id'
    let token = Candy.Config.auth.token || 'user_tokens'
    let check_table = await Candy.Mysql.run('SHOW TABLES LIKE ?', [token])
    if (check_table.length == 0)
      await Candy.Mysql.run(
        'CREATE TABLE ' +
          token +
          ' (id INT NOT NULL AUTO_INCREMENT, user INT NOT NULL, token_x VARCHAR(255) NOT NULL, token_y VARCHAR(255) NOT NULL, browser VARCHAR(255) NOT NULL, ip VARCHAR(255) NOT NULL, `date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `active` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id))'
      )
    let token_y = Candy.Var(this.#request.id + this.#request.ip).md5()
    let cookie = {
      user: user[key],
      token_x: Candy.Var(Math.random().toString() + Date.now().toString()).md5(),
      token_y: Candy.Var(token_y).hash(),
      browser: this.#request.header('user-agent'),
      ip: this.#request.ip
    }
    this.#request.cookie('candy_x', cookie.token_x, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict'
    })
    this.#request.cookie('candy_y', token_y, {httpOnly: true, secure: true, sameSite: 'Strict'})
    let sql = Candy.Mysql.table(token).insert(cookie)
    return sql !== false
  }

  async register(data, options = {}) {
    if (!Candy.Config.auth) {
      Candy.Config.auth = {}
    }

    this.#table = Candy.Config.auth.table || 'users'
    const primaryKey = Candy.Config.auth.key || 'id'
    const passwordField = options.passwordField || 'password'
    const uniqueFields = options.uniqueFields || ['email']

    const checkTable = await Candy.Mysql.run('SHOW TABLES LIKE ?', true, [this.#table])
    if (checkTable.length === 0) {
      await this.#createUserTable(this.#table, primaryKey, passwordField, uniqueFields, data)
    }

    if (!data || typeof data !== 'object') {
      return {success: false, error: 'Invalid data provided'}
    }

    if (data[passwordField] && !Candy.Var(data[passwordField]).is('bcrypt')) {
      data[passwordField] = Candy.Var(data[passwordField]).hash()
    }

    for (const field of uniqueFields) {
      if (data[field]) {
        const existing = await Candy.Mysql.table(this.#table).where(field, data[field]).first()
        if (existing) {
          return {success: false, error: `${field} already exists`, field}
        }
      }
    }

    try {
      const insertResult = await Candy.Mysql.table(this.#table).insert(data)
      if (!insertResult || !insertResult.affectedRows) {
        return {success: false, error: 'Failed to create user'}
      }

      const userId = insertResult.insertId
      const newUser = await Candy.Mysql.table(this.#table).where(primaryKey, userId).first()

      if (!newUser) {
        return {success: false, error: 'User created but could not be retrieved'}
      }

      delete newUser[passwordField]

      if (options.autoLogin !== false) {
        const loginData = {}
        loginData[primaryKey] = userId
        const loginSuccess = await this.login(loginData)

        if (!loginSuccess) {
          return {success: true, user: newUser, autoLogin: false, message: 'User created but auto-login failed'}
        }
      }

      return {success: true, user: newUser}
    } catch (error) {
      return {success: false, error: error.message || 'Registration failed'}
    }
  }

  async logout() {
    if (!this.#user) return false

    if (!Candy.Config.auth) Candy.Config.auth = {}
    const token = Candy.Config.auth.token || 'user_tokens'
    const candyX = this.#request.cookie('candy_x')
    const browser = this.#request.header('user-agent')

    if (candyX && browser) {
      await Candy.Mysql.table(token).where(['token_x', candyX], ['browser', browser]).delete()
    }

    this.#request.cookie('candy_x', '', {maxAge: -1})
    this.#request.cookie('candy_y', '', {maxAge: -1})

    this.#user = null
    return true
  }

  async #createUserTable(tableName, primaryKey, passwordField, uniqueFields, sampleData) {
    const columns = []

    columns.push(`\`${primaryKey}\` INT NOT NULL AUTO_INCREMENT`)

    for (const field of uniqueFields) {
      if (field !== primaryKey) {
        columns.push(`\`${field}\` VARCHAR(255) NOT NULL UNIQUE`)
      }
    }

    if (!uniqueFields.includes(passwordField) && passwordField !== primaryKey) {
      columns.push(`\`${passwordField}\` VARCHAR(255) NOT NULL`)
    }

    for (const key in sampleData) {
      if (key === primaryKey || uniqueFields.includes(key) || key === passwordField) continue

      const value = sampleData[key]
      let columnType = 'VARCHAR(255)'

      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          columnType = value > 2147483647 ? 'BIGINT' : 'INT'
        } else {
          columnType = 'DECIMAL(10,2)'
        }
      } else if (typeof value === 'boolean') {
        columnType = 'TINYINT(1)'
      } else if (value && value.length > 255) {
        columnType = 'TEXT'
      }

      columns.push(`\`${key}\` ${columnType} NULL`)
    }

    columns.push(`\`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
    columns.push(`\`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
    columns.push(`PRIMARY KEY (\`${primaryKey}\`)`)

    const sql = `CREATE TABLE \`${tableName}\` (${columns.join(', ')}) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`

    await Candy.Mysql.run(sql)
  }

  user(col) {
    if (!this.#user) return false
    if (col === null) return this.#user
    else return this.#user[col]
  }
}

module.exports = Auth
