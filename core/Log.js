class Log {
  #cliMode = false

  constructor() {
    // Detect if we're running in CLI mode
    // CLI mode is when the main module is in cli/ or bin/ directory
    if (require.main && require.main.filename) {
      const mainFile = process.mainModule.filename
      this.#cliMode = mainFile.includes('/cli/') || mainFile.includes('/bin/')
    }
  }

  init(...arg) {
    this.module = '[' + arg.join('][') + '] '
    return {
      error: this.error.bind(this),
      log: this.log.bind(this)
    }
  }

  error(...arg) {
    // Always show errors, even in CLI mode
    console.error(this.module, ...arg)
  }

  log(...arg) {
    // Suppress logs in CLI mode to avoid breaking the interface
    if (this.#cliMode) return

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
