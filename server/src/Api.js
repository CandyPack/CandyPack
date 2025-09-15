const http = require('http')
const {WebSocketServer} = require('ws')
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
    'web.delete': (...args) => Candy.server('Web').delete(...args),
    'web.list': (...args) => Candy.server('Web').list(...args)
  }

  init() {
    if (!Candy.core('Config').config.api) Candy.core('Config').config.api = {}
    // Regenerate auth token every start
    Candy.core('Config').config.api.auth = nodeCrypto.randomBytes(32).toString('hex')

    const server = http.createServer()
    const wss = new WebSocketServer({server})

    wss.on('connection', (ws, req) => {
      // Only allow localhost
      if (req.socket.remoteAddress !== '::ffff:127.0.0.1' && req.socket.remoteAddress !== '127.0.0.1') {
        ws.close(4001, 'forbidden')
        return
      }

      ws.on('message', async raw => {
        let payload
        try {
          payload = JSON.parse(raw.toString())
        } catch {
          return ws.send(JSON.stringify(this.result(false, 'invalid_json')))
        }

        const {id, auth, action, data} = payload || {}
        if (!auth || auth !== Candy.core('Config').config.api.auth) {
          return ws.send(JSON.stringify({id, ...this.result(false, 'unauthorized')}))
        }
        if (!action || !this.#commands[action]) {
          return ws.send(JSON.stringify({id, ...this.result(false, 'unknown_action')}))
        }
        try {
          const result = await this.#commands[action](...(data ?? []))
          ws.send(JSON.stringify({id, ...result}))
        } catch (err) {
          ws.send(JSON.stringify({id, ...this.result(false, err.message || 'error')}))
        }
      })
    })

    // Legacy HTTP fallback (POST)
    server.on('request', (req, res) => {
      // Ignore websocket upgrade handshake (GET with Upgrade header) so ws can proceed
      if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') return
      // Only handle POST fallback, respond 404 for others (avoid 200 that breaks ws client expectation)
      if (req.method !== 'POST') {
        res.writeHead(404)
        return res.end()
      }
      if (req.socket.remoteAddress !== '::ffff:127.0.0.1' && req.socket.remoteAddress !== '127.0.0.1') return res.end('1')
      if (req.headers.authorization !== Candy.core('Config').config.api.auth) return res.end('2')
      let data = ''
      req.on('data', c => (data += c))
      req.on('end', async () => {
        try {
          data = JSON.parse(data || '{}')
        } catch {
          return res.end('3')
        }
        if (!data || !data.action || !this.#commands[data.action]) return res.end('3')
        try {
          const result = await this.#commands[data.action](...(data.data ?? []))
          res.writeHead(200, {'Content-Type': 'application/json'})
          res.end(JSON.stringify(result))
        } catch (err) {
          res.writeHead(200, {'Content-Type': 'application/json'})
          res.end(JSON.stringify(this.result(false, err.message || 'error')))
        }
      })
    })

    server.listen(1453)
  }

  result(result, message) {
    return {result: result, message: message}
  }
}

module.exports = new Api()
