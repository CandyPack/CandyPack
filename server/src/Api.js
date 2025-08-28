const http = require('http')
const nodeCrypto = require('crypto')

class Api {
  #commands = {
    'mail.create': (...args) => Candy.server('Mail').create(...args),
    'mail.delete': (...args) => Candy.server('Mail').delete(...args),
    'mail.list': (...args) => Candy.server('Mail').list(...args),
    'mail.password': (...args) => Candy.server('Mail').password(...args),
    'mail.send': (...args) => Candy.server('Mail').send(...args),
    'service.start': (...args) => Candy.server('Service').start(...args),
    'server.stop': () => Candy.server('Server').stop(),
    'ssl.renew': (...args) => Candy.server('SSL').renew(...args),
    'subdomain.create': (...args) => Candy.server('Subdomain').create(...args),
    'subdomain.list': (...args) => Candy.server('Subdomain').list(...args),
    'web.create': (...args) => Candy.server('Web').create(...args),
    'web.list': (...args) => Candy.server('Web').list(...args)
  }

  init() {
    if (!Candy.core('Config').config.api) Candy.core('Config').config.api = {}
    Candy.core('Config').config.api.auth = nodeCrypto.randomBytes(32).toString('hex')
    http
      .createServer((req, res) => {
        if (req.socket.remoteAddress !== '::ffff:127.0.0.1') return res.end('1')
        if (req.headers.authorization !== Candy.core('Config').config.api.auth) return res.end('2')
        if (req.method !== 'POST') return res.end()
        let data = ''
        req.on('data', chunk => {
          data += chunk
        })
        req.on('end', async () => {
          data = JSON.parse(data)
          if (!data || !data.action || !this.#commands[data.action]) return res.end('3')
          res.writeHead(200, {'Content-Type': 'application/json'})
          let result = await this.#commands[data.action](...(data.data ?? []))
          res.end(JSON.stringify(result))
        })
      })
      .listen(1453)
  }

  result(result, message) {
    return {result: result, message: message}
  }
}

module.exports = new Api()
