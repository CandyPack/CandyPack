class Server {
  async check() {
    return new Promise(resolve => {
      if (!Candy.Config.config.server.watchdog) return resolve(false)
      Candy.ext
        .process('pid', Candy.Config.config.server.watchdog)
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

  #init() {
    let pid = Candy.Config.config.server.watchdog
    if (!pid) {
      this.watchdog()
    } else {
      Candy.ext
        .process('pid', pid)
        .then(list => {
          if (list.length == 0 || list[0].name !== 'node') this.watchdog()
        })
        .catch(err => {
          console.error('Error checking process:', err)
          this.watchdog()
        })
    }
  }

  async init() {
    process.on('uncaughtException', err => {
      console.error('Uncaught Exception:', err.stack || err)
    })
    if (!Candy.Config.config) Candy.Config.config = {}
    if (!Candy.Config.config.server) Candy.Config.config.server = {}
    return new Promise(resolve => {
      var args = process.argv.slice(2)
      switch (args[0]) {
        case 'start':
          if (args.length > 1 || global.trigger !== 'cli') break
          this.start()
          resolve()
          break
        case 'services':
          Candy.Service.status().then(services => {
            let data = []
            Candy.Cli.log('')
            Candy.Cli.log('CandyPack')
            Candy.Cli.log('')
            if (services.length == 0) {
              Candy.Cli.log(' ', __('No services found.'))
              Candy.Cli.log(' ')
              return resolve()
            }
            Candy.Cli.log(' ', __('Services') + ': ', services.length)
            for (const service of services) {
              let status = 'Stopped'
              if (service.active)
                status = service.status == 'running' ? 'Running' : service.status.charAt(0).toUpperCase() + service.status.slice(1)
              let row = {}
              row['ID'] = {
                content: service.id,
                direction: 'right'
              }
              row[__('Name')] = service.name
              row['PID'] = service.status == 'running' ? service.pid : '-'
              row[__('Uptime')] = service.uptime
              row[__('Status')] = __(status)
              row[__('Active')] = service.active ? '\u2713' : '\u2717'
              data.push(row)
            }
            Candy.Cli.table(data)
            Candy.Cli.log(' ')
            resolve()
          })
          break
        case 'websites':
          Candy.Web.status().then(websites => {
            Candy.Cli.log('')
            Candy.Cli.log('CandyPack')
            Candy.Cli.log('')
            if (Object.keys(websites).length == 0) {
              Candy.Cli.log(' ', __('No websites found.'))
              Candy.Cli.log(' ')
              return resolve()
            }
            Candy.Cli.log(' ', __('Websites') + ': ', Object.keys(websites).length)
            let data = []
            for (const website of Object.keys(websites)) {
              let row = {}
              row[__('Domain')] = website
              data.push(row)
            }
            Candy.Cli.table(data)
            Candy.Cli.log(' ')
            return resolve()
          })
          break
        case 'auth':
          Candy.Client.auth(args[1])
      }
      this.check().then(isRunning => {
        if (!isRunning) this.#init()
      })
      return resolve()
    })
  }

  async uptime() {
    return new Promise(function (resolve) {
      if (!Candy.Config.config.server.started) return resolve(0)
      var uptime = Date.now() - Candy.Config.config.server.started
      let seconds = Math.floor(uptime / 1000)
      let minutes = Math.floor(seconds / 60)
      let hours = Math.floor(minutes / 60)
      let days = Math.floor(hours / 24)
      seconds %= 60
      minutes %= 60
      hours %= 24
      let uptimeString = ''
      if (days) uptimeString += days + 'd '
      if (hours) uptimeString += hours + 'h '
      if (minutes && !days) uptimeString += minutes + 'm '
      if (seconds && !hours) uptimeString += seconds + 's'
      return resolve(uptimeString)
    })
  }

  async services() {
    return new Promise(resolve => {
      let services = Candy.Config.config.server.services ?? []
      let running = 0
      for (const service of services) if (service.active && service.status == 'running') running++
      return resolve(running)
    })
  }

  async restart() {
    Candy.Cli.log(await __('Restarting CandyPack Server...'))
    this.stop()
    return new Promise(resolve => {
      setTimeout(async () => this.#init() && resolve(), 1000)
    })
  }

  start() {
    Candy.Config.config.server.pid = process.pid
    Candy.Config.config.server.started = Date.now()
    Candy.Service.init()
    Candy.DNS.init()
    Candy.Web.init()
    Candy.Mail.init()
    Candy.Api.init()
    setTimeout(function () {
      setInterval(function () {
        Candy.Service.check()
        Candy.SSL.check()
        Candy.Web.check()
        Candy.Mail.check()
      }, 1000)
    }, 1000)
  }

  stop() {
    if (!this.check()) return
    try {
      process.kill(Candy.Config.config.server.watchdog, 'SIGTERM')
      process.kill(Candy.Config.config.server.pid, 'SIGTERM')
    } catch (e) {
      console.error('Error stopping services:', e)
    }
    Candy.Config.config.server.pid = null
    Candy.Config.config.server.started = null
  }

  async watchdog() {
    console.log(await __('Starting CandyPack Server...'))
    let child = Candy.ext.childProcess.spawn('node', [__dirname + '/../../watchdog/index.js'], {
      detached: true
    })

    Candy.Config.config.server.watchdog = child.pid
    Candy.Config.config.server.started = Date.now()
    process.exit(0)
  }
}

module.exports = new Server()
