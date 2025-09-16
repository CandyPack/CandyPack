const findProcess = require('find-process').default
const net = require('net')

class Connector {
  constructor() {
    this.socket = null
    this.connected = false
    this.connecting = false
    this.manualClose = false
  }

  #connect() {
    if (this.connected || this.connecting) return
    this.connecting = true
    this.socket = net.createConnection({port: 1453, host: '127.0.0.1'}, () => {
      this.connected = true
      this.connecting = false
    })

    this.socket.on('data', raw => {
      let payload
      try {
        payload = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (payload.message) {
        if (payload.status) {
          if (this.lastProcess == payload.process) {
            process.stdout.clearLine(0)
            process.stdout.cursorTo(0)
          } else {
            this.lastProcess = payload.process
            process.stdout.write('\n')
          }
          if (payload.status === 'progress') {
            process.stdout.write('- ' + payload.message + '\r')
          } else if (payload.status === 'success') {
            process.stdout.write('✔ ' + payload.message + '\r')
          } else {
            process.stdout.write('✖ ' + payload.message + '\r')
          }
        } else if (payload.result) {
          if (this.lastProcess) process.stdout.write('\n')
          console.log(payload.message)
        } else console.error(payload.message)
      }
    })

    this.socket.on('error', err => {
      console.error('Socket error:', err.message)
    })
  }

  call(command) {
    if (!command) return
    this.manualClose = false
    this.#connect()
    this.socket.write(
      JSON.stringify({
        auth: Candy.core('Config').config.api.auth,
        action: command.action,
        data: command.data
      })
    )
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
