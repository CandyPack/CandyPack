class Log {
  init(...arg) {
    this.module = '[' + arg.join('][') + '] '
    return {
      error: this.error.bind(this),
      log: this.log.bind(this)
    }
  }

  error(...arg) {
    console.error(this.module, ...arg)
  }

  log(...arg) {
    if (!arg.length) return this
    if (arg[0].includes('%s')) {
      let split = arg[0].split('%s')
      for (let i = 0; i < split.length - 1; i++) {
        split[i] += arg[1] || ''
        arg.splice(1, 1)
      }
    }
    console.log(this.module, ...arg)
  }
}

module.exports = Log
