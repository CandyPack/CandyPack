class Server {
  async init() {
    Candy.core('Config').config.server.pid = process.pid
    Candy.core('Config').config.server.started = Date.now()
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

  stop() {
    console.log('Stopping CandyPack Server...')
    setTimeout(function () {
      Candy.server('Service').stopAll()
      Candy.server('Web').stopAll()
      process.exit(0)
    }, 100)
    return Candy.server('Api').result(true, __('Server stopping...'))
  }
}

module.exports = new Server()
