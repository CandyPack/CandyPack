const findProcess = require('find-process').default

class Process {
  stop(pid) {
    return new Promise(resolve => {
      findProcess('pid', pid)
        .then(list => {
          for (const proc of list) if (proc.name == 'node') process.kill(proc.pid, 'SIGTERM')
        })
        .catch(() => {})
        .finally(() => {
          resolve()
        })
    })
  }

  async stopAll() {
    if (Candy.core('Config').config.server?.watchdog) await this.stop(Candy.core('Config').config.server.watchdog)
    if (Candy.core('Config').config.server?.pid) await this.stop(Candy.core('Config').config.server.pid)
    for (const domain of Object.keys(Candy.core('Config').config?.websites ?? {}))
      if (Candy.core('Config').config.websites[domain].pid) await this.stop(Candy.core('Config').config.websites[domain].pid)
    for (const service of Candy.core('Config').config.services ?? []) if (service.pid) await this.stop(service.pid)
  }
}

module.exports = Process
