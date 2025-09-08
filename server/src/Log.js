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
    if (typeof arg[0] === 'string' && arg[0].includes('%s')) {
      let message = arg.shift()
      while (message.includes('%s') && arg.length > 0) {
        message = message.replace('%s', arg.shift())
      }
      message = message.replace(/%s/g, '')
      arg.unshift(message)
    }
    console.log(this.module, ...arg)
  }
}

module.exports = Log
