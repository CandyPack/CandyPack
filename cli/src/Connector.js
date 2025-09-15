const {WebSocket: NodeWebSocket} = require('ws')
const axios = require('axios')
const findProcess = require('find-process').default
const nodeCrypto = require('crypto')

class Connector {
  constructor() {
    this.ws = null
    this.queue = new Map() // id -> {resolve, reject}
    this.connected = false
    this.connecting = false
    this.manualClose = false
  }

  #connect() {
    if (this.connected || this.connecting) return
    this.connecting = true
    this.ws = new NodeWebSocket('ws://127.0.0.1:1453')

    this.ws.on('open', () => {
      this.connected = true
      this.connecting = false
    })

    this.ws.on('message', raw => {
      let payload
      try {
        payload = JSON.parse(raw.toString())
      } catch {
        return
      }
      const {id, result, message, ...rest} = payload
      if (id && this.queue.has(id)) {
        const {resolve} = this.queue.get(id)
        this.queue.delete(id)
        resolve({result, message, ...rest})
        if (message) {
          if (result) console.log(message)
          else console.error(message)
        }
        if (this.queue.size === 0) {
          this.manualClose = true
          try {
            this.ws.close()
          } catch {
            // ignore
          }
        }
      }
    })

    this.ws.on('close', () => {
      this.connected = false
      this.connecting = false
      // Reject all pending
      for (const [, {reject}] of this.queue.entries()) {
        reject(new Error('connection_closed'))
      }
      this.queue.clear()
      if (this.manualClose) {
        this.manualClose = false
        return
      }
      setTimeout(() => this.#connect(), 500)
    })

    this.ws.on('error', err => {
      console.error('WebSocket error:', err.message)
    })
  }

  call(command) {
    if (!command) return
    this.manualClose = false
    this.#connect()
    return new Promise((resolve, reject) => {
      const sendPayload = () => {
        if (!this.connected) {
          // After 1s fallback to HTTP once
          const fallbackAfter = 1000
          const start = Date.now()
          const wait = () => {
            if (this.connected) return sendPayload()
            if (Date.now() - start >= fallbackAfter) {
              // HTTP fallback
              return axios
                .post('http://127.0.0.1:1453', command, {headers: {Authorization: Candy.core('Config').config.api.auth}})
                .then(r => {
                  if (r.data && r.data.message) console.log(r.data.message)
                  resolve(r.data)
                })
                .catch(err => reject(err))
            }
            setTimeout(wait, 50)
          }
          return wait()
        }
        const queueLimit = (Candy.core('Config').config.api && Candy.core('Config').config.api.queueLimit) || 100
        if (this.queue.size >= queueLimit) {
          return reject(new Error('queue_limit'))
        }
        const id = nodeCrypto.randomBytes(8).toString('hex')
        this.queue.set(id, {resolve, reject})
        const timeoutMs = (Candy.core('Config').config.api && Candy.core('Config').config.api.timeout) || 10000
        const timer = setTimeout(() => {
          if (this.queue.has(id)) {
            this.queue.delete(id)
            reject(new Error('timeout'))
          }
        }, timeoutMs)
        // Wrap original resolve to clear timer
        const original = this.queue.get(id)
        this.queue.set(id, {
          resolve: data => {
            clearTimeout(timer)
            original.resolve(data)
          },
          reject: err => {
            clearTimeout(timer)
            original.reject(err)
          }
        })
        try {
          this.ws.send(
            JSON.stringify({
              id,
              auth: Candy.core('Config').config.api.auth,
              action: command.action,
              data: command.data
            })
          )
        } catch (err) {
          this.queue.delete(id)
          reject(err)
        }
      }
      sendPayload()
    })
  }

  check() {
    return new Promise(resolve => {
      if (!Candy.core('Config').config.server.watchdog) return resolve(false)
      findProcess('pid', Candy.core('Config').config.server.watchdog)
        .then(list => {
          if (list.length > 0 && list[0].name == 'node') return resolve(true)
          return resolve(false)
        })
        .catch(err => {
          console.error('Error checking process:', err)
          return resolve(false)
        })
    })
  }
}

module.exports = new Connector()
