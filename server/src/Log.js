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
    console.log('\n--- CANDYPACK ---')
  }

  log(...arg) {
    if (!arg.length) return this
    console.log(this.module, ...arg)
    console.log('\n--- CANDYPACK ---')
  }
}

module.exports = new Log()
