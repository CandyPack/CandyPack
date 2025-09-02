const findProcess = require('find-process').default

class Process {
  stop(pid) {
    return new Promise(resolve => {
      findProcess(pid)
        .then(list => {
          for (const proc of list) if (proc.name == 'node') proc.kill()
        })
        .catch(() => {})
        .finally(() => {
          resolve()
        })
    })
  }

  async stopAll() {
    await this.stop(Candy.core('Config').config.server.watchdog)
    await this.stop(Candy.core('Config').config.server.pid)
    for (const domain of Object.keys(Candy.core('Config').config.websites))
      await this.stop(Candy.core('Config').config.websites[domain].pid)
    for (const service of Candy.core('Config').config.services) await this.stop(service.pid)
  }
}

module.exports = Process
