const findProcess = require('find-process').default

class Server {
  async check() {
    let server = await Candy.core('Config').get('server')
    return new Promise(resolve => {
      if (!server.watchdog) return resolve(false)
      findProcess('pid', server.watchdog)
        .then(list => {
          if (list.length > 0) return resolve(true)
          return resolve(false)
        })
        .catch(err => {
          console.error('Error checking process:', err)
          return resolve(false)
        })
    })
  }

  async init() {
    Candy.core('Config').get('server').pid = process.pid
    Candy.core('Config').get('server').started = Date.now()
    Candy.server('Service')
    Candy.server('DNS')
    Candy.server('Web')
    Candy.server('Mail')
    Candy.server('Api')
    setTimeout(function () {
      setInterval(function () {
        Candy.server('Service').check()
        Candy.server('SSL').check()
        Candy.server('Web').check()
        Candy.server('Mail').check()
      }, 1000)
    }, 1000)
  }

  async services() {
    return new Promise(resolve => {
      let services = Candy.core('Config').get('server').services ?? []
      let running = 0
      for (const service of services) if (service.active && service.status == 'running') running++
      return resolve(running)
    })
  }

  async restart() {
    // Candy.Cli.log(await __('Restarting CandyPack Server...'))
    this.stop()
    // return new Promise(resolve => {
    //   // setTimeout(async () => this.#init() && resolve(), 1000)
    // })
  }

  stop() {
    if (!this.check()) return
    try {
      process.kill(Candy.core('Config').get('server').watchdog, 'SIGTERM')
      process.kill(Candy.core('Config').get('server').pid, 'SIGTERM')
    } catch (e) {
      console.error('Error stopping services:', e)
    }
    Candy.core('Config').get('server').pid = null
    Candy.core('Config').get('server').started = null
  }
}

module.exports = new Server()
