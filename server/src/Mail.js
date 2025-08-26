const bcrypt = require('bcrypt')
const SMTPServer = require('smtp-server').SMTPServer
const parser = require('mailparser').simpleParser
const sqlite3 = require('sqlite3').verbose()
const forge = require('node-forge')
const fs = require('fs')
const os = require('os')
const server = require('./mail/server')
const smtp = require('./mail/smtp')
const tls = require('tls')

class Mail {
  #checking = false
  #clients = {}
  #counts = {}
  #db
  #server_smtp
  #started = false

  check() {
    if (this.#checking) return
    if (!this.#started) this.init()
    if (!this.#started) return
    this.#checking = true
    for (const domain of Object.keys(Candy.core('Config').config.websites)) {
      if (!Candy.core('Config').config.websites[domain].DNS || !Candy.core('Config').config.websites[domain].DNS.MX) continue
      if (Candy.core('Config').config.websites[domain].cert !== false && !Candy.core('Config').config.websites[domain].cert?.dkim)
        this.#dkim(domain)
    }
    this.#checking = false
  }

  async create(email, password, retype) {
    if (!email || !password || !retype) return Candy.server('Api').result(false, await __('All fields are required.'))
    if (password != retype) return Candy.server('Api').result(false, await __('Passwords do not match.'))
    password = await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) reject(err)
        resolve(hash)
      })
    })
    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
      return Candy.server('Api').result(false, await __('Invalid email address.'))
    if (await this.exists(email)) return Candy.server('Api').result(false, await __('Mail account %s already exists.', email))
    let domain = email.split('@')[1]
    if (!Candy.core('Config').config.websites[domain]) {
      for (let d in Candy.core('Config').config.websites) {
        if (domain.substr(-d.length) != d) continue
        if (Candy.core('Config').config.websites[d].subdomain.includes(domain.substr(-d.length))) {
          domain = d
          break
        }
      }
      return Candy.server('Api').result(false, await __('Domain %s not found.', domain))
    }
    this.#db.serialize(() => {
      let stmt = this.#db.prepare("INSERT INTO mail_account ('email', 'password', 'domain') VALUES (?, ?, ?)")
      stmt.run(email, password, domain)
      stmt.finalize()
    })
    return Candy.server('Api').result(true, await __('Mail account %s created successfully.', email))
  }

  async delete(email) {
    if (!email) return Candy.server('Api').result(false, await __('Email address is required.'))
    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
      return Candy.server('Api').result(false, await __('Invalid email address.'))
    if (!(await this.exists(email))) return Candy.server('Api').result(false, await __('Mail account %s not found.', email))
    this.#db.serialize(() => {
      let stmt = this.#db.prepare('DELETE FROM mail_account WHERE email = ?')
      stmt.run(email)
      stmt.finalize()
    })
    return Candy.server('Api').result(true, await __('Mail account %s deleted successfully.', email))
  }

  #dkim(domain) {
    let keys = forge.pki.rsa.generateKeyPair(1024)
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey)
    let publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey)
    if (!fs.existsSync(os.homedir() + '/.candypack/cert/dkim')) fs.mkdirSync(os.homedir() + '/.candypack/cert/dkim', {recursive: true})
    fs.writeFileSync(os.homedir() + '/.candypack/cert/dkim/' + domain + '.key', privateKeyPem)
    fs.writeFileSync(os.homedir() + '/.candypack/cert/dkim/' + domain + '.pub', publicKeyPem)
    publicKeyPem = publicKeyPem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\r\n/g, '')
      .replace(/\n/g, '')
    if (!Candy.core('Config').config.websites[domain].cert) Candy.core('Config').config.websites[domain].cert = {}
    Candy.core('Config').config.websites[domain].cert.dkim = {
      private: os.homedir() + '/.candypack/cert/dkim/' + domain + '.key',
      public: os.homedir() + '/.candypack/cert/dkim/' + domain + '.pub'
    }
    Candy.DNS.record({
      type: 'TXT',
      name: `default._domainkey.${domain}`,
      value: `v=DKIM1; k=rsa; p=${publicKeyPem}`
    })
  }

  exists(email) {
    return new Promise(resolve => {
      this.#db.get('SELECT * FROM mail_account WHERE email = ?', [email], (err, row) => {
        if (row) resolve(row)
        else resolve(false)
      })
    })
  }

  init() {
    let start = false
    for (let domain in Candy.core('Config').config.websites) {
      let web = Candy.core('Config').config.websites[domain]
      if (web && web.DNS && web.DNS.MX) start = true
    }
    if (!start || this.#started) return
    this.#started = true
    if (!fs.existsSync(os.homedir() + '/.candypack/db')) fs.mkdirSync(os.homedir() + '/.candypack/db', {recursive: true})
    this.#db = new sqlite3.Database(os.homedir() + '/.candypack/db/mail', err => {
      if (err) console.error(err.message)
    })
    this.#db.serialize(() => {
      this.#db.run(`CREATE TABLE IF NOT EXISTS mail_received ('id'          INTEGER PRIMARY KEY AUTOINCREMENT,
                                                                    'uid'         INTEGER NOT NULL,
                                                                    'email'       VARCHAR(255) NOT NULL,
                                                                    'mailbox'     VARCHAR(255),
                                                                    'flags'       JSON DEFAULT '[]',
                                                                    'attachments' JSON,
                                                                    'headers'     JSON,
                                                                    'headerLines' JSON,
                                                                    'html'        TEXT,
                                                                    'text'        TEXT,
                                                                    'textAsHtml'  TEXT,
                                                                    'subject'     TEXT,
                                                                    'date'        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                    'to'          JSON,
                                                                    'from'        JSON,
                                                                    'messageId'   TEXT,
                                                                    UNIQUE(email, uid))`)
      this.#db.run(`CREATE TABLE IF NOT EXISTS mail_account ('id'       INTEGER PRIMARY KEY AUTOINCREMENT,
                                                                   'email'    VARCHAR(255) UNIQUE,
                                                                   'password' VARCHAR(255),
                                                                   'domain'   VARCHAR(255),
                                                                   'created'  TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`)
      this.#db.run(`CREATE TABLE IF NOT EXISTS mail_box ('id'       INTEGER PRIMARY KEY AUTOINCREMENT,
                                                               'email'    VARCHAR(255),
                                                               'title'    VARCHAR(255),
                                                               'parent'   INTEGER DEFAULT 0,
                                                               'deleted'  BOOLEAN DEFAULT 0,
                                                               'date'     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                                UNIQUE(email, title))`)
      this.#db.run(`CREATE INDEX IF NOT EXISTS idx_email  ON mail_account  (email);`)
      this.#db.run(`CREATE INDEX IF NOT EXISTS idx_domain ON mail_account  (domain);`)
      this.#db.run(`CREATE INDEX IF NOT EXISTS idx_uid    ON mail_received (uid);`)
      this.#db.run(`CREATE INDEX IF NOT EXISTS idx_email  ON mail_received (email);`)
      this.#db.run(`CREATE INDEX IF NOT EXISTS idx_flags  ON mail_received (flags);`)
      this.#db.run(`CREATE INDEX IF NOT EXISTS idx_date   ON mail_received (date);`)
      this.#db.run(`CREATE INDEX IF NOT EXISTS idx_email  ON mail_box      (email);`)
      this.#db.run(`CREATE INDEX IF NOT EXISTS idx_title  ON mail_box      (title);`)
    })
    const self = this
    let options = {
      logger: true,
      secure: false,
      banner: 'CandyPack',
      size: 1024 * 1024 * 10,
      authOptional: true,
      onAuth(auth, session, callback) {
        let ip = session.remoteAddress
        if (self.#clients[ip]) {
          if (self.#clients[ip].attempts > 1 && Date.now() - self.#clients[ip].last < 1000 * 60 * 60)
            return callback(new Error('Too many attempts from this IP: ' + ip))
          if (self.#clients[ip].last < Date.now() - 1000 * 60 * 60) self.#clients[ip] = {attempts: 0, last: 0}
        }
        if (!auth.username.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
          return callback(new Error('Invalid username or password'))
        self.exists(auth.username).then(async result => {
          if (result && (await bcrypt.compare(auth.password, result.password))) return callback(null, {user: auth.username})
          if (!self.#clients[ip]) self.#clients[ip] = {attempts: 0, last: 0}
          self.#clients[ip].attempts++
          self.#clients[ip].last = Date.now()
          return callback(new Error('Invalid username or password'))
        })
      },
      onData(stream, session, callback) {
        parser(stream, {}, async (err, parsed) => {
          if (err) return console.error(err)
          // console.log('ON DATA:', session);
          if (!parsed.to.value[0].address.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            console.error('Invalid recipient:', parsed.to.value[0].address)
            return callback(new Error('Invalid recipient'))
          }
          if (!parsed.from.value[0].address.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
            console.error('Invalid sender:', parsed.from.value[0].address)
            return callback(new Error('Invalid sender'))
          }
          let sender = await self.exists(parsed.from.value[0].address)
          if (sender && (!session.user || parsed.from.value[0].address !== session.user)) {
            console.error('Unexpected sender:', parsed.from.value[0].address)
            return callback(new Error('Unexpected sender'))
          }
          if (
            !sender &&
            !['hostmaster', 'postmaster'].includes(parsed.to.value[0].address.split('@')[0]) &&
            !(await self.exists(parsed.to.value[0].address))
          ) {
            console.error('Unexpected recipient:', parsed.to.value[0].address)
            return callback(new Error('Unexpected recipient'))
          }
          await self.#store(session.user ?? parsed.to.value[0].address, parsed)
          if (session.user && parsed.from.value[0].address === session.user) smtp.send(parsed)
          callback()
        })
      },
      onFetch(data, session, callback) {
        let limit = ``
        if (data.limit) {
          if (data.limit[0] && !isNaN(data.limit[0])) limit += `AND uid >= ${parseInt(data.limit[0])} `
          if (data.limit[1] && !isNaN(data.limit[1])) limit += `AND uid <= ${parseInt(data.limit[1])} `
        }
        self.#db.all(
          `SELECT * FROM mail_received
                              WHERE email = ? AND mailbox = ? ${limit}
                              ORDER BY id DESC`,
          [data.email, data.mailbox],
          (err, rows) => {
            if (err) {
              console.error(err)
              return callback(false)
            }
            callback(rows)
          }
        )
      },
      onMailFrom(address, session, callback) {
        if (!address.address.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) return callback(new Error('Invalid email address'))
        return callback()
      },
      onRcptTo(address, session, callback) {
        if (!address.address.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) return callback(new Error('Invalid email address'))
        return callback()
      },
      onSelect(data, session, callback) {
        self.#db.get(
          "SELECT COUNT(*) AS 'exists', SUM(IIF(flags LIKE '%seen%', 0, 1)) AS 'unseen', MAX(uid) + 1 AS uidnext, MAX(uid) AS uidvalidity FROM mail_received WHERE email = ? AND mailbox = ?",
          [data.address, data.mailbox],
          (err, row) => {
            if (err) {
              console.error(err)
              return callback(err)
            }
            callback(row)
          }
        )
      },
      onStore(data, session, callback) {
        let uids = data.uids
        for (let flag of data.flags)
          for (let uid of uids) {
            uid = [uid, uid]
            if (uid.includes(':')) uid = uid.split(':')
            self.#db.run(
              `UPDATE mail_received
                                SET flags = JSON_INSERT(flags, '$[#]', ?)
                                WHERE email = ? AND uid BETWEEN ? AND ? AND flags NOT LIKE ?`,
              [flag, data.address, uid[0], uid[1], `%${flag}%`],
              err => {
                if (err) {
                  console.error(err)
                  return callback(err)
                }
              }
            )
          }
        callback()
      },
      onError(err) {
        console.error('Error:', err)
      }
    }
    let serv = new SMTPServer(options)
    serv.listen(25)
    serv.on('error', err => log('SMTP Server Error: ', err))
    const imap = new server(options)
    imap.listen(143)
    options.SNICallback = (hostname, callback) => {
      let ssl = Candy.core('Config').config.ssl ?? {}
      let sslOptions = {}
      while (!Candy.core('Config').config.websites[hostname] && hostname.includes('.')) hostname = hostname.split('.').slice(1).join('.')
      let website = Candy.core('Config').config.websites[hostname]
      if (
        website &&
        website.cert.ssl &&
        website.cert.ssl.key &&
        website.cert.ssl.cert &&
        fs.existsSync(website.cert.ssl.key) &&
        fs.existsSync(website.cert.ssl.cert)
      ) {
        sslOptions = {
          key: fs.readFileSync(website.cert.ssl.key),
          cert: fs.readFileSync(website.cert.ssl.cert)
        }
      } else {
        sslOptions = {
          key: fs.readFileSync(ssl.key),
          cert: fs.readFileSync(ssl.cert)
        }
      }
      const ctx = tls.createSecureContext(sslOptions)
      callback(null, ctx)
    }
    options.secure = true
    this.#server_smtp = new SMTPServer(options)
    this.#server_smtp.listen(465)
    this.#server_smtp.on('error', err => console.error('SMTP Server Error: ', err))
    const imap_sec = new server(options)
    imap_sec.listen(993)
  }

  async list(domain) {
    if (!domain) return Candy.server('Api').result(false, await __('Domain is required.'))
    if (!Candy.core('Config').config.websites[domain]) return Candy.server('Api').result(false, await __('Domain %s not found.', domain))
    let accounts = []
    await new Promise((resolve, reject) => {
      this.#db.each(
        'SELECT * FROM mail_account WHERE domain = ?',
        [domain],
        (err, row) => {
          if (err) reject(err)
          accounts.push(row.email)
        },
        (err, count) => {
          if (err) reject(err)
          resolve(count)
        }
      )
    })
    return Candy.server('Api').result(true, (await __('Mail accounts for domain %s.', domain)) + '\n' + accounts.join('\n'))
  }

  async password(email, password, retype) {
    if (!email || !password || !retype) return Candy.server('Api').result(false, await __('All fields are required.'))
    if (password != retype) return Candy.server('Api').result(false, await __('Passwords do not match.'))
    password = await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) reject(err)
        resolve(hash)
      })
    })
    if (!email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
      return Candy.server('Api').result(false, await __('Invalid email address.'))
    if (!this.exists(email)) return Candy.server('Api').result(false, await __('Mail account %s not found.', email))
    this.#db.serialize(() => {
      let stmt = this.#db.prepare('UPDATE mail_account SET password = ? WHERE email = ?')
      stmt.run(password, email)
      stmt.finalize()
    })
    return Candy.server('Api').result(true, await __('Mail account %s password updated successfully.', email))
  }

  async send(data) {
    if (!data || !data.from || !data.to || !data.header) return Candy.server('Api').result(false, await __('All fields are required.'))
    if (!data.from.value[0].address.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
      return Candy.server('Api').result(false, await __('Invalid email address.'))
    if (!data.to.value[0].address.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))
      return Candy.server('Api').result(false, await __('Invalid email address.'))
    let domain = data.from.value[0].address.split('@')[1].split('.')
    while (domain.length > 2 && !Candy.core('Config').config.websites[domain.join('.')]) domain.shift()
    domain = domain.join('.')
    if (!Candy.core('Config').config.websites[domain]) return Candy.server('Api').result(false, await __('Domain %s not found.', domain))
    let mail = {
      atttachments: [],
      headerLines: [],
      from: data.from,
      to: data.to,
      subject: data.subject ?? ''
    }
    for (let key in data.header) mail.headerLines.push({key: key.toLowerCase(), line: key + ': ' + data.header[key]})
    if (data.html) mail.html = data.html
    if (data.text) mail.text = data.text
    mail.attachments = data.attachments ?? []
    smtp.send(mail)
    return Candy.server('Api').result(true, await __('Mail sent successfully.'))
  }

  #store(email, data) {
    return new Promise(resolve => {
      let mailbox = 'INBOX'
      let flags = '[]'
      if (email === data.from.value[0].address) {
        flags = JSON.stringify(['seen'])
        mailbox = 'Sent'
      }
      this.#db.serialize(async () => {
        if (!this.#counts[email]) {
          await new Promise((sub_resolve, sub_reject) => {
            this.#db.get('SELECT COUNT(*) AS count FROM mail_received WHERE email = ?', [email], (err, row) => {
              if (err) return sub_reject(err)
              this.#counts[email] = row.count + 1
              return sub_resolve()
            })
          })
        } else this.#counts[email]++
        if (data.html === '0') data.html = ''
        this.#db.run(
          "INSERT INTO mail_received ('uid', 'email', 'mailbox', 'attachments', 'headers', 'headerLines', 'html', 'text', 'textAsHtml', 'subject', 'to', 'from', 'messageId', 'flags') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            this.#counts[email],
            email,
            mailbox,
            JSON.stringify(data.attachments),
            JSON.stringify(data.headers),
            JSON.stringify(data.headerLines),
            data.html,
            data.text,
            data.textAsHtml,
            data.subject,
            JSON.stringify(data.to),
            JSON.stringify(data.from),
            data.messageId,
            flags
          ],
          async err => {
            if (!err) return resolve(true)
            console.error(err)
            return resolve(await this.#store(email, data))
          }
        )
      })
    })
  }
}

module.exports = new Mail()
