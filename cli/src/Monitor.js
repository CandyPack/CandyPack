require('../../core/Candy.js')

const fs = require('fs')
const os = require('os')
const readline = require('readline')

class Monitor {
  #current = ''
  #domains = []
  #height
  #logs = {content: [], mtime: null, selected: null, watched: []}
  #logging = false
  #modules = ['api', 'candy', 'cli', 'client', 'config', 'dns', 'lang', 'mail', 'server', 'service', 'ssl', 'storage', 'subdomain', 'web']
  #printing = false
  #selected = 0
  #services = []
  #watch = []
  #websites = {}
  #width

  constructor() {
    process.stdout.write(process.platform === 'win32' ? `title CandyPack Debug\n` : `\x1b]2;CandyPack Debug\x1b\x5c`)
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    this.rl.on('close', () => {
      process.stdout.write('\x1Bc')
      process.exit(0)
    })
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
  }

  async debug() {
    await this.#debug()
    setInterval(() => this.#debug(), 250)
    this.rl.input.on('keypress', (key, data) => {
      if (data.ctrl && data.name == 'c') {
        process.stdout.write('\x1Bc')
        process.exit(0)
      }
      if (data.name == 'up') if (this.#selected > 0) this.#selected--
      if (data.name == 'down') if (this.#selected + 1 < this.#modules.length) this.#selected++
      if (data.name == 'return') {
        let index = this.#watch.indexOf(this.#selected)
        if (index > -1) this.#watch.splice(index, 1)
        else this.#watch.push(this.#selected)
      }
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
      this.#debug()
    })
  }

  #debug() {
    if (this.#printing) return
    this.#printing = true
    this.#width = process.stdout.columns - 3
    this.#height = process.stdout.rows
    this.#loadModuleLogs()
    let c1 = (this.#width / 12) * 3
    if (c1 % 1 != 0) c1 = Math.floor(c1)
    if (c1 > 50) c1 = 50
    let result = ''
    result += Candy.cli('Cli').color('┌', 'gray')
    result += Candy.cli('Cli').color('─'.repeat(5), 'gray')
    let title = Candy.cli('Cli').color(__('Modules'), null)
    result += ' ' + Candy.cli('Cli').color(title) + ' '
    result += Candy.cli('Cli').color('─'.repeat(c1 - title.length - 7), 'gray')
    result += Candy.cli('Cli').color('┬', 'gray')
    result += Candy.cli('Cli').color('─'.repeat(5), 'gray')
    title = Candy.cli('Cli').color(__('Logs'), null)
    result += ' ' + Candy.cli('Cli').color(title) + ' '
    result += Candy.cli('Cli').color('─'.repeat(this.#width - c1 - title.length - 7), 'gray')
    result += Candy.cli('Cli').color('┐\n', 'gray')
    for (let i = 0; i < this.#height - 5; i++) {
      if (this.#modules[i]) {
        result += Candy.cli('Cli').color('│', 'gray')
        result += Candy.cli('Cli').color(
          '[' + (this.#watch.includes(i) ? 'X' : ' ') + '] ',
          i == this.#selected ? 'blue' : 'white',
          i == this.#selected ? 'white' : null,
          i == this.#selected ? 'bold' : null
        )
        result += Candy.cli('Cli').color(
          Candy.cli('Cli').spacing(this.#modules[i] ? this.#modules[i] : '', c1 - 4),
          i == this.#selected ? 'blue' : 'white',
          i == this.#selected ? 'white' : null,
          i == this.#selected ? 'bold' : null
        )
        result += Candy.cli('Cli').color('│', 'gray')
      } else {
        result += Candy.cli('Cli').color('│', 'gray')
        result += ' '.repeat(c1)
        result += Candy.cli('Cli').color('│', 'gray')
      }
      result += Candy.cli('Cli').spacing(this.#logs.content[i] ? this.#logs.content[i] : ' ', this.#width - c1)
      result += Candy.cli('Cli').color('│\n', 'gray')
    }
    result += Candy.cli('Cli').color('└', 'gray')
    result += Candy.cli('Cli').color('─'.repeat(c1), 'gray')
    result += Candy.cli('Cli').color('┴', 'gray')
    result += Candy.cli('Cli').color('─'.repeat(this.#width - c1), 'gray')
    result += Candy.cli('Cli').color('┘\n', 'gray')
    let shortcuts = '↑/↓ ' + __('Navigate') + ' | ↵ ' + __('Select') + ' | Ctrl+C ' + __('Exit')
    result += Candy.cli('Cli').color(' CANDYPACK', 'magenta', 'bold')
    result += Candy.cli('Cli').color(Candy.cli('Cli').spacing(shortcuts, this.#width + 1 - 'CANDYPACK'.length, 'right') + '\n', 'gray')
    if (result !== this.#current) {
      this.#current = result
      process.stdout.clearLine(0)
      process.stdout.write('\x1Bc')
      process.stdout.write(result)
    }
    this.#printing = false
  }

  async #load() {
    if (this.#logging) return
    this.#logging = true
    this.#logs.selected = this.#selected
    let file = null
    if (this.#selected < this.#domains.length) {
      file = os.homedir() + '/.candypack/logs/' + this.#domains[this.#selected] + '.log'
    } else if (this.#selected - this.#domains.length < this.#services.length) {
      file = os.homedir() + '/.candypack/logs/' + this.#services[this.#selected - this.#domains.length].name + '.log'
    } else {
      this.#logging = false
      return
    }
    let log = ''
    let mtime = null
    if (fs.existsSync(file)) {
      mtime = fs.statSync(file).mtime
      if (this.#selected == this.#logs.selected && mtime == this.#logs.mtime) return
      log = fs.readFileSync(file, 'utf8')
    }
    this.#logs.content = log
      .trim()
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => {
        if ('[LOG]' == line.substr(0, 5)) {
          line = line.substr(5)
          let date = parseInt(line.substr(1, 13))
          line = Candy.cli('Cli').color('[' + Candy.cli('Cli').formatDate(new Date(date)) + ']', 'green', 'bold') + line.substr(15)
        } else if ('[ERR]' == line.substr(0, 5)) {
          line = line.substr(5)
          let date = parseInt(line.substr(1, 13))
          line = Candy.cli('Cli').color('[' + Candy.cli('Cli').formatDate(new Date(date)) + ']', 'red', 'bold') + line.substr(15)
        }
        return line
      })
      .slice(-this.#height + 4)
    this.#logs.mtime = mtime
    this.#logging = false
  }

  async #loadModuleLogs() {
    if (this.#logging) return
    this.#logging = true

    if (this.#watch.length === 0) {
      this.#logs.content = []
      this.#logging = false
      return
    }

    const file = os.homedir() + '/.candypack/logs/.candypack.log'
    let log = ''
    let mtime = null

    if (fs.existsSync(file)) {
      mtime = fs.statSync(file).mtime
      if (JSON.stringify(this.#watch) === JSON.stringify(this.#logs.watched) && mtime == this.#logs.mtime) {
        this.#logging = false
        return
      }
      log = fs.readFileSync(file, 'utf8')
    }

    const selectedModules = this.#watch.map(index => this.#modules[index])
    this.#logs.content = log
      .trim()
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => {
        const lowerCaseLine = line.toLowerCase()
        const moduleName = selectedModules.find(name => lowerCaseLine.includes(`[${name}]`.toLowerCase()))
        return {line, moduleName}
      })
      .filter(item => item.moduleName)
      .map(item => {
        let {line, moduleName} = item
        if ('[LOG]' == line.substr(0, 5) || '[ERR]' == line.substr(0, 5)) {
          const isError = '[ERR]' == line.substr(0, 5)
          const date = line.substr(6, 24)
          const originalMessage = line.substr(34 + moduleName.length)
          const cleanedMessage = originalMessage.trim()
          const dateColor = isError ? 'red' : 'green'

          line =
            Candy.cli('Cli').color('[' + Candy.cli('Cli').formatDate(new Date(date)) + ']', dateColor, 'bold') +
            Candy.cli('Cli').color(`[${moduleName}]`, 'white', 'bold') +
            ' ' +
            cleanedMessage
        }
        return line
      })
      .slice(-this.#height + 4)

    this.#logs.mtime = mtime
    this.#logs.watched = [...this.#watch]
    this.#logging = false
  }

  monit() {
    this.#monitor()
    setInterval(() => this.#monitor(), 250)
    this.rl.input.on('keypress', (key, data) => {
      if (data.ctrl && data.name == 'c') {
        process.stdout.write('\x1Bc')
        process.exit(0)
      }
      if (data.name == 'up') if (this.#selected > 0) this.#selected--
      if (data.name == 'down') if (this.#selected + 1 < this.#domains.length + this.#services.length) this.#selected++
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
      this.#monitor()
    })
  }

  #monitor() {
    if (this.#printing) return
    this.#printing = true
    this.#websites = Candy.core('Config').config.websites ?? []
    this.#services = Candy.core('Config').config.services ?? []
    this.#domains = Object.keys(this.#websites)
    this.#width = process.stdout.columns - 5
    this.#height = process.stdout.rows - 2
    this.#load()
    let c1 = (this.#width / 12) * 3
    if (c1 % 1 != 0) c1 = Math.floor(c1)
    if (c1 > 50) c1 = 50
    let result = ''
    result = Candy.cli('Cli').color('\n' + Candy.cli('Cli').spacing('CANDYPACK', this.#width, 'center') + '\n\n', 'magenta', 'bold')
    result += Candy.cli('Cli').color(' ┌', 'gray')
    let service = -1
    if (this.#domains.length) {
      result += Candy.cli('Cli').color('─'.repeat(5), 'gray')
      let title = Candy.cli('Cli').color(__('Websites'), null)
      result += ' ' + Candy.cli('Cli').color(title) + ' '
      result += Candy.cli('Cli').color('─'.repeat(c1 - title.length - 7), 'gray')
    } else if (this.#services.length) {
      result += Candy.cli('Cli').color('─'.repeat(5), 'gray')
      let title = Candy.cli('Cli').color(__('Services'), null)
      result += ' ' + Candy.cli('Cli').color(title) + ' '
      result += Candy.cli('Cli').color('─'.repeat(c1 - title.length - 7), 'gray')
      service++
    } else {
      result += Candy.cli('Cli').color('─'.repeat(c1), 'gray')
    }
    result += Candy.cli('Cli').color('┬', 'gray')
    result += Candy.cli('Cli').color('─'.repeat(this.#width - c1), 'gray')
    result += Candy.cli('Cli').color('┐ \n', 'gray')
    for (let i = 0; i < this.#height - 5; i++) {
      if (this.#domains[i]) {
        result += Candy.cli('Cli').color(' │', 'gray')
        result += Candy.cli('Cli').icon(this.#websites[this.#domains[i]].status ?? null, i == this.#selected)
        result += Candy.cli('Cli').color(
          Candy.cli('Cli').spacing(this.#domains[i] ? this.#domains[i] : '', c1 - 3),
          i == this.#selected ? 'blue' : 'white',
          i == this.#selected ? 'white' : null,
          i == this.#selected ? 'bold' : null
        )
        result += Candy.cli('Cli').color('│', 'gray')
      } else if (this.#services.length && service == -1) {
        result += Candy.cli('Cli').color(' ├', 'gray')
        result += Candy.cli('Cli').color('─'.repeat(5), 'gray')
        let title = Candy.cli('Cli').color(__('Services'), null)
        result += ' ' + Candy.cli('Cli').color(title) + ' '
        result += Candy.cli('Cli').color('─'.repeat(c1 - title.length - 7), 'gray')
        result += Candy.cli('Cli').color('┤', 'gray')
        service++
      } else if (service >= 0 && service < this.#services.length) {
        result += Candy.cli('Cli').color(' │', 'gray')
        result += Candy.cli('Cli').icon(this.#services[service].status ?? null, i - 1 == this.#selected)
        result += Candy.cli('Cli').color(
          Candy.cli('Cli').spacing(this.#services[service].name, c1 - 3),
          i - 1 == this.#selected ? 'blue' : 'white',
          i - 1 == this.#selected ? 'white' : null,
          i - 1 == this.#selected ? 'bold' : null
        )
        result += Candy.cli('Cli').color('│', 'gray')
        service++
      } else {
        result += Candy.cli('Cli').color(' │', 'gray')
        result += ' '.repeat(c1)
        result += Candy.cli('Cli').color('│', 'gray')
      }
      if (this.#logs.selected == this.#selected) {
        result += Candy.cli('Cli').spacing(this.#logs.content[i] ? this.#logs.content[i] : ' ', this.#width - c1)
      } else {
        result += ' '.repeat(this.#width - c1)
      }
      result += Candy.cli('Cli').color('│\n', 'gray')
    }
    result += Candy.cli('Cli').color(' └', 'gray')
    result += Candy.cli('Cli').color('─'.repeat(c1), 'gray')
    result += Candy.cli('Cli').color('┴', 'gray')
    result += Candy.cli('Cli').color('─'.repeat(this.#width - c1), 'gray')
    result += Candy.cli('Cli').color('┘ \n', 'gray')
    let shortcuts = '↑/↓ Navigate | Ctrl+C Exit'
    result += Candy.cli('Cli').color('\n' + Candy.cli('Cli').spacing(shortcuts, this.#width, 'center') + '\n', 'gray')
    if (result !== this.#current) {
      this.#current = result
      process.stdout.clearLine(0)
      process.stdout.write('\x1Bc')
      process.stdout.write(result)
    }
    this.#printing = false
  }
}

module.exports = Monitor
