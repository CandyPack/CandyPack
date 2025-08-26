require('../../core/Candy.js')

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const readline = require('readline')

class Cli {
  #backgrounds = {red: 41, green: 42, yellow: 43, blue: 44, magenta: 45, white: 47, gray: 100}
  #colors = {red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, white: 37, gray: 90}

  current = ''
  #modules = ['api', 'candy', 'cli', 'client', 'config', 'dns', 'lang', 'mail', 'server', 'service', 'ssl', 'storage', 'subdomain', 'web']
  rl
  selected = 0
  websites = {}
  services = []
  domains = []
  logs = {content: [], mtime: null, selected: null, watched: []}
  printing = false
  logging = false
  width
  height
  #watch = []

  async #boot() {
    console.log(await __('Starting CandyPack Server...'))
    const child = childProcess.spawn('node', [__dirname + '/../../watchdog/index.js'], {
      detached: true,
      stdio: 'ignore'
    })
    child.unref()
  }

  close() {
    if (this.rl) this.rl.close()
  }

  #color(text, color, ...args) {
    let output = text
    if (this.#colors[color]) output = '\x1b[' + this.#colors[color] + 'm' + output + '\x1b[0m'
    for (const arg of args) {
      if (this.#backgrounds[arg]) output = '\x1b[' + this.#backgrounds[arg] + 'm' + output + '\x1b[0m'
      if (arg == 'bold') output = '\x1b[1m' + output + '\x1b[0m'
    }
    return output
  }

  async debug() {
    process.stdout.write(process.platform === 'win32' ? `title CandyPack Debug\n` : `\x1b]2;CandyPack Debug\x1b\x5c`)
    await this.#debug()
    setInterval(() => this.#debug(), 250)
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    this.rl.input.on('keypress', (key, data) => {
      if (data.ctrl && data.name == 'c') {
        process.stdout.write('\x1Bc')
        process.exit(0)
      }
      if (data.name == 'up') if (this.selected > 0) this.selected--
      if (data.name == 'down') if (this.selected + 1 < this.#modules.length) this.selected++
      if (data.name == 'return') {
        let index = this.#watch.indexOf(this.selected)
        if (index > -1) this.#watch.splice(index, 1)
        else this.#watch.push(this.selected)
      }
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
      this.#debug()
    })
    this.rl.on('close', () => {
      process.stdout.write('\x1Bc')
      process.exit(0)
    })
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
  }

  #debug() {
    if (this.printing) return
    this.printing = true
    this.width = process.stdout.columns - 5
    this.height = process.stdout.rows - 2
    this.#loadModuleLogs()
    let c1 = (this.width / 12) * 3
    if (c1 % 1 != 0) c1 = Math.floor(c1)
    if (c1 > 50) c1 = 50
    let result = ''
    result = this.#color('\n' + this.#spacing('CANDYPACK', this.width, 'center') + '\n\n', 'magenta', 'bold')
    result += this.#color(' ┌', 'gray')
    result += this.#color('─'.repeat(5), 'gray')
    let title = this.#color(await __('Modules'), null)
    result += ' ' + this.#color(title) + ' '
    result += this.#color('─'.repeat(c1 - title.length - 7), 'gray')
    result += this.#color('┬', 'gray')
    result += this.#color('─'.repeat(5), 'gray')
    title = this.#color(await __('Logs'), null)
    result += ' ' + this.#color(title) + ' '
    result += this.#color('─'.repeat(this.width - c1 - title.length - 7), 'gray')
    result += this.#color('┐ \n', 'gray')
    for (let i = 0; i < this.height - 7; i++) {
      if (this.#modules[i]) {
        result += this.#color(' │', 'gray')
        result += this.#color(
          '[' + (this.#watch.includes(i) ? 'X' : ' ') + '] ',
          i == this.selected ? 'blue' : 'white',
          i == this.selected ? 'white' : null,
          i == this.selected ? 'bold' : null
        )
        result += this.#color(
          this.#spacing(this.#modules[i] ? this.#modules[i] : '', c1 - 4),
          i == this.selected ? 'blue' : 'white',
          i == this.selected ? 'white' : null,
          i == this.selected ? 'bold' : null
        )
        result += this.#color('│', 'gray')
      } else {
        result += this.#color(' │', 'gray')
        result += ' '.repeat(c1)
        result += this.#color('│', 'gray')
      }
      result += this.#spacing(this.logs.content[i] ? this.logs.content[i] : ' ', this.width - c1)
      result += this.#color('│\n', 'gray')
    }
    result += this.#color(' └', 'gray')
    result += this.#color('─'.repeat(c1), 'gray')
    result += this.#color('┴', 'gray')
    result += this.#color('─'.repeat(this.width - c1), 'gray')
    result += this.#color('┘ \n', 'gray')
    let shortcuts = '↑/↓ Navigate | ↵ Select | Ctrl+C Exit'
    result += this.#color('\n' + this.#spacing(shortcuts, this.width, 'center') + '\n', 'gray')
    if (result !== this.current) {
      this.current = result
      process.stdout.clearLine(0)
      process.stdout.write('\x1Bc')
      process.stdout.write(result)
    }
    this.printing = false
  }

  #format(text, raw) {
    if (typeof text !== 'string') return text
    let output = text.toString()
    if (output.toString().length > 1) {
      let begin = ''
      let end = ''
      while (output.substr(output.length - 1) == ' ') {
        end += ' '
        output = output.substr(0, output.length - 1)
      }
      while (output.substr(0, 1) == ' ') {
        begin += ' '
        output = output.substr(1)
      }
      if (output.substr(output.length - 1) == ':') {
        end = ':'
        output = output.substr(0, output.length - 1)
      }
      output = begin + output + end
    }
    if (!raw) {
      if (text == 'CandyPack') output = this.#color(output, 'magenta')
      if (text == (await __('Running'))) output = this.#color(output, 'green')
      if (text == '\u2713') output = this.#color(output, 'green')
      if (text == '\u2717') output = this.#color(output, 'red')
    }
    return output
  }

  async #detail(command, obj) {
    let result = ''
    let space = 0
    if (obj.title) result += '\n\x1b[90m' + (await obj.title) + '\x1b\n'
    if (obj.description) {
      let args = obj.args ? ' <' + obj.args.join('> <') + '>' : ''
      let line = '\x1b[91mcandy ' + command + '\x1b[0m\x1b[90m' + args + '\x1b[0m : ' + (await __(obj.description))
      result += line
      line = line.split(':')[0]
      if (line.length > space) space = line.length
    }
    if (obj.sub) {
      let lines = []
      for (const sub in obj.sub) {
        let detail = await this.#detail(command + ' ' + sub, obj.sub[sub])
        lines.push(detail.result)
        if (detail.space > space) space = detail.space
      }
      result += lines.join('\n')
    }

    return {result: result, space: space}
  }

  async help(commands) {
    let result = []
    let space = 0
    if (typeof commands == 'string') {
      let obj = Candy.core('Commands')
      let command = commands.shift()
      if (!obj[command]) return log(await __(`'%s' is not a valid command.`, this.#color(`candy ${commands.join(' ')}`, 'yellow')))
      obj = obj[command]
      while (commands.length > 0 && commands.length && obj.sub[commands[0]]) {
        command = commands.shift()
        if (!obj.sub[command]) return log(await __(`'%s' is not a valid command.`, this.#color(`candy ${commands.join(' ')}`, 'yellow')))
        obj = obj.sub[command]
      }
      let detail = await this.#detail(command, obj)
      if (detail.space > space) space = detail.space
      let lines = detail.result.split('\n')
      for (let line of lines) result.push(line)
    } else {
      for (const command in Candy.core('Commands')) {
        if (commands && commands !== true && commands[0] !== command) continue
        let obj = Candy.core('Commands')[command]
        if (commands === true && !obj.action) continue
        let detail = await this.#detail(command, obj)
        if (detail.space > space) space = detail.space
        let lines = detail.result.split('\n')
        for (let line of lines) result.push(line)
      }
      result = result.map(line => {
        if (line.includes(':')) {
          let parts = line.split(':')
          parts[0] = parts[0] + ' '.repeat(space - parts[0].length)
          line = parts.join(':')
        }
        return line
      })
    }
    result.push('')
    for (let line of result) log(line)
  }

  #icon(status, selected) {
    if (status == 'running') return this.#color(' \u25B6 ', 'green', selected ? 'white' : null)
    if (status == 'stopped') return this.#color(' \u23F8 ', 'yellow', selected ? 'white' : null)
    if (status == 'errored') return this.#color(' ! ', 'red', selected ? 'white' : null)
    return '   '
  }

  async init() {
    log('\n', 'CandyPack')
    if (!(await Candy.cli('Connector').check())) this.#boot()
    let args = process.argv.slice(2)
    let cmds = process.argv.slice(2)
    if (args.length == 0) return this.#status()
    let command = args.shift()
    if (!Candy.core('Commands')[command]) return log(await __(`'%s' is not a valid command.`, this.#color(`candy ${cmds.join(' ')}`, 'yellow')))
    let action = Candy.core('Commands')[command]
    while (args.length > 0 && !action.args) {
      command = args.shift()
      if (!action.sub || !action.sub[command]) return this.help(cmds)
      action = action.sub[command]
    }
    if (action.action) return action.action(args)
    else return this.help(cmds)
  }

  #length(text) {
    return (
      this.#value(text, true)
        .toString()
        // eslint-disable-next-line no-control-regex
        .replace(/\x1b\[[0-9;]*m/g, '').length
    )
  }

  #formatDate(date) {
    const YYYY = date.getFullYear()
    const MM = String(date.getMonth() + 1).padStart(2, '0')
    const DD = String(date.getDate()).padStart(2, '0')
    const HH = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`
  }

  async #load() {
    if (this.logging) return
    this.logging = true
    this.logs.selected = this.selected
    let file = null
    if (this.selected < this.domains.length) {
      file = os.homedir() + '/.candypack/logs/' + this.domains[this.selected] + '.log'
    } else if (this.selected - this.domains.length < this.services.length) {
      file = os.homedir() + '/.candypack/logs/' + this.services[this.selected - this.domains.length].name + '.log'
    } else {
      this.logging = false
      return
    }
    let log = ''
    let mtime = null
    if (fs.existsSync(file)) {
      mtime = fs.statSync(file).mtime
      if (this.selected == this.logs.selected && mtime == this.logs.mtime) return
      log = fs.readFileSync(file, 'utf8')
    }
    this.logs.content = log
      .trim()
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => {
        if ('[LOG]' == line.substr(0, 5)) {
          line = line.substr(5)
          let date = parseInt(line.substr(1, 13))
          line = this.#color('[' + this.#formatDate(new Date(date)) + ']', 'green', 'bold') + line.substr(15)
        } else if ('[ERR]' == line.substr(0, 5)) {
          line = line.substr(5)
          let date = parseInt(line.substr(1, 13))
          line = this.#color('[' + this.#formatDate(new Date(date)) + ']', 'red', 'bold') + line.substr(15)
        }
        return line
      })
      .slice(-this.height + 4)
    this.logs.mtime = mtime
    this.logging = false
  }

  async #loadModuleLogs() {
    if (this.logging) return
    this.logging = true

    if (this.#watch.length === 0) {
      this.logs.content = []
      this.logging = false
      return
    }

    const file = os.homedir() + '/.candypack/logs/.candypack.log'
    let log = ''
    let mtime = null

    if (fs.existsSync(file)) {
      mtime = fs.statSync(file).mtime
      if (JSON.stringify(this.#watch) === JSON.stringify(this.logs.watched) && mtime == this.logs.mtime) {
        this.logging = false
        return
      }
      log = fs.readFileSync(file, 'utf8')
    }

    const selectedModules = this.#watch.map(index => this.#modules[index])
    this.logs.content = log
      .trim()
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => {
        const lowerCaseLine = line.toLowerCase()
        const moduleName = selectedModules.find(name => lowerCaseLine.includes(name.toLowerCase()))
        return {line, moduleName}
      })
      .filter(item => item.moduleName)
      .map(item => {
        let {line, moduleName} = item
        if ('[LOG]' == line.substr(0, 5) || '[ERR]' == line.substr(0, 5)) {
          const isError = '[ERR]' == line.substr(0, 5)
          const date = parseInt(line.substr(6, 13))
          const originalMessage = line.substr(21)
          const cleanedMessage = originalMessage.replace(new RegExp(moduleName, 'i'), '').trim()
          const dateColor = isError ? 'red' : 'green'

          line =
            this.#color('[' + this.#formatDate(new Date(date)) + ']', dateColor, 'bold') +
            this.#color(`[${moduleName}]`, 'white', 'bold') +
            ' ' +
            cleanedMessage
        }
        return line
      })
      .slice(-this.height + 4)

    this.logs.mtime = mtime
    this.logs.watched = [...this.#watch]
    this.logging = false
  }

  async log(...args) {
    let output = []
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] != 'string') output.push(args[i])
      else output.push(this.#format(args[i]))
    }
    console.log(...output)
  }

  async monitor() {
    process.stdout.write(process.platform === 'win32' ? `title CandyPack Monitor\n` : `\x1b]2;CandyPack Monitor\x1b\x5c`)
    await this.#monitor()
    setInterval(() => this.#monitor(), 250)
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    this.rl.input.on('keypress', (key, data) => {
      if (data.ctrl && data.name == 'c') {
        process.stdout.write('\x1Bc')
        process.exit(0)
      }
      if (data.name == 'up') if (this.selected > 0) this.selected--
      if (data.name == 'down') if (this.selected + 1 < this.domains.length + this.services.length) this.selected++
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)
      this.#monitor()
    })
    this.rl.on('close', () => {
      process.stdout.write('\x1Bc')
      process.exit(0)
    })
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
  }

  #monitor() {
    if (this.printing) return
    this.printing = true
    this.websites = Candy.core('Config').config.websites ?? []
    this.services = Candy.core('Config').config.services ?? []
    this.domains = Object.keys(this.websites)
    this.width = process.stdout.columns - 5
    this.height = process.stdout.rows - 2
    this.#load()
    let c1 = (this.width / 12) * 3
    if (c1 % 1 != 0) c1 = Math.floor(c1)
    if (c1 > 50) c1 = 50
    let result = ''
    result = this.#color('\n' + this.#spacing('CANDYPACK', this.width, 'center') + '\n\n', 'magenta', 'bold')
    result += this.#color(' ┌', 'gray')
    let service = -1
    if (this.domains.length) {
      result += this.#color('─'.repeat(5), 'gray')
      let title = this.#color(await __('Websites'), null)
      result += ' ' + this.#color(title) + ' '
      result += this.#color('─'.repeat(c1 - title.length - 7), 'gray')
    } else if (this.services.length) {
      result += this.#color('─'.repeat(5), 'gray')
      let title = this.#color(await __('Services'), null)
      result += ' ' + this.#color(title) + ' '
      result += this.#color('─'.repeat(c1 - title.length - 7), 'gray')
      service++
    } else {
      result += this.#color('─'.repeat(c1), 'gray')
    }
    result += this.#color('┬', 'gray')
    result += this.#color('─'.repeat(this.width - c1), 'gray')
    result += this.#color('┐ \n', 'gray')
    for (let i = 0; i < this.height - 5; i++) {
      if (this.domains[i]) {
        result += this.#color(' │', 'gray')
        result += this.#icon(this.websites[this.domains[i]].status ?? null, i == this.selected)
        result += this.#color(
          this.#spacing(this.domains[i] ? this.domains[i] : '', c1 - 3),
          i == this.selected ? 'blue' : 'white',
          i == this.selected ? 'white' : null,
          i == this.selected ? 'bold' : null
        )
        result += this.#color('│', 'gray')
      } else if (this.services.length && service == -1) {
        result += this.#color(' ├', 'gray')
        result += this.#color('─'.repeat(5), 'gray')
        let title = this.#color(await __('Services'), null)
        result += ' ' + this.#color(title) + ' '
        result += this.#color('─'.repeat(c1 - title.length - 7), 'gray')
        result += this.#color('┤', 'gray')
        service++
      } else if (service >= 0 && service < this.services.length) {
        result += this.#color(' │', 'gray')
        result += this.#icon(this.services[service].status ?? null, i - 1 == this.selected)
        result += this.#color(
          this.#spacing(this.services[service].name, c1 - 3),
          i - 1 == this.selected ? 'blue' : 'white',
          i - 1 == this.selected ? 'white' : null,
          i - 1 == this.selected ? 'bold' : null
        )
        result += this.#color('│', 'gray')
        service++
      } else {
        result += this.#color(' │', 'gray')
        result += ' '.repeat(c1)
        result += this.#color('│', 'gray')
      }
      if (this.logs.selected == this.selected) {
        result += this.#spacing(this.logs.content[i] ? this.logs.content[i] : ' ', this.width - c1)
      } else {
        result += ' '.repeat(this.width - c1)
      }
      result += this.#color('│\n', 'gray')
    }
    result += this.#color(' └', 'gray')
    result += this.#color('─'.repeat(c1), 'gray')
    result += this.#color('┴', 'gray')
    result += this.#color('─'.repeat(this.width - c1), 'gray')
    result += this.#color('┘ \n', 'gray')
    let shortcuts = '↑/↓ Navigate | Ctrl+C Exit'
    result += this.#color('\n' + this.#spacing(shortcuts, this.width, 'center') + '\n', 'gray')
    if (result !== this.current) {
      this.current = result
      process.stdout.clearLine(0)
      process.stdout.write('\x1Bc')
      process.stdout.write(result)
    }
    this.printing = false
  }

  #spacing(text, len, direction) {
    if (direction == 'right') return ' '.repeat(len - this.#length(text)) + text
    if (direction == 'center')
      return ' '.repeat(Math.floor((len - this.#length(text)) / 2)) + text + ' '.repeat(Math.ceil((len - this.#length(text)) / 2))
    if (this.#length(text) > len) return text.substr(0, len)
    return text + ' '.repeat(len - this.#length(text))
  }

  async #status() {
    let status = {
      online: false,
      services: 0,
      auth: false,
      uptime: 0
    }
    status.online = await Candy.cli('Connector').check()
    var uptime = Date.now() - Candy.core('Config').config.server.started
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
    status.uptime = uptimeString
    status.services = Candy.core('Config').config.services ? Object.keys(Candy.core('Config').config.services).length : 0
    status.websites = Candy.core('Config').config.websites ? Object.keys(Candy.core('Config').config.websites).length : 0
    var args = process.argv.slice(2)
    if (args.length == 0) {
      let length = 0
      for (let i = 0; i < 2; i++) {
        for (let iterator of ['Status', 'Uptime', 'Websites', 'Services', 'Auth']) {
          let title = await __(iterator)
          if (title.length > length) length = title.length
          if (i) {
            let space = ''
            for (let j = 0; j < length - title.length; j++) space += ' '
            switch (iterator) {
              case 'Status':
                log(
                  title +
                    space +
                    ' : ' +
                    (status.online ? '\x1b[32m ' + (await __('Online')) : '\x1b[33m ' + (await __('Offline'))) +
                    '\x1b[0m'
                )
                break
              case 'Uptime':
                if (status.online) log(title + space + ' : ' + '\x1b[32m ' + status.uptime + '\x1b[0m')
                break
              case 'Websites':
                if (status.online) log(title + space + ' : ' + '\x1b[32m ' + status.websites + '\x1b[0m')
                break
              case 'Services':
                if (status.online) log(title + space + ' : ' + '\x1b[32m ' + status.services + '\x1b[0m')
                break
              case 'Auth':
                log(
                  title +
                    space +
                    ' : ' +
                    (status.auth ? '\x1b[32m ' + (await __('Logged in')) : '\x1b[33m ' + (await __('Not logged in'))) +
                    '\x1b[0m'
                )
                break
            }
          }
        }
      }
      if (!status.auth) log(await __('Login on %s to manage all your server operations.', '\x1b[95mhttps://candypack.dev\x1b[0m'))
      log()
      log(await __('Commands:'))
      length = 0
      this.help(true)
      log('')
    }
  }

  table(input) {
    let result = ''
    let width = []
    for (const row of input) {
      for (const key of Object.keys(row)) {
        if (input.indexOf(row) == 0) width[key] = this.#length(key)
        if (this.#length(row[key]) > width[key]) width[key] = this.#length(row[key])
      }
    }
    for (const row of input) {
      let insert = ''
      if (input.indexOf(row) == 0) {
        result += '┌─'
        for (const key of Object.keys(row)) result += '─'.repeat(width[key]) + '─┬─'
        result = this.#color(result.substr(0, result.length - 3) + '─┐\n', 'gray')
        result += this.#color('│ ', 'gray')
        for (const key of Object.keys(row)) {
          result += this.#color(this.#value(key), 'blue') + ' '.repeat(width[key] - this.#length(key)) + this.#color(' │ ', 'gray')
        }
        result += '\n'
      }
      insert += '├─'
      for (const key of Object.keys(row)) insert += '─'.repeat(width[key]) + '─┼─'
      insert = insert.substr(0, insert.length - 3) + '─┤\n'
      insert += '│ '
      result += this.#color(insert, 'gray')
      for (const key of Object.keys(row)) {
        result += this.#value(row[key]) + ' '.repeat(width[key] - this.#length(row[key])) + this.#color(' │ ', 'gray')
      }
      result += '\n'
    }
    let insert = '└─'
    for (const key of Object.keys(input[0])) insert += '─'.repeat(width[key]) + '─┴─'
    insert = insert.substr(0, insert.length - 3) + '─┘'
    result += this.#color(insert, 'gray')
    console.log(result)
  }

  #value(text, raw) {
    if (!text) return ''
    let result = ''
    if (typeof text == 'object') result = this.#format(text.content)
    else result = this.#format(text, raw)
    return result
  }

  question(question) {
    return new Promise(resolve => {
      if (!this.rl) {
        this.rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })
      }
      this.rl.question(question, answer => {
        return resolve(answer.trim())
      })
    })
  }
}

module.exports = new Cli()
