const nodeCrypto = require('crypto')
const fs = require('fs')

class View {
  #cache = {}
  #functions = {
    '{!!': {
      function: '${',
      close: '!!}',
      end: '}'
    },
    '{{--': {
      function: '`; /*',
      close: '--}}',
      end: '*/ html += `'
    },
    '{{': {
      function: '${Candy.Var(',
      close: '}}',
      end: ').html().replace(/\\n/g, "<br>")}'
    },
    break: {
      function: 'if($break) break;',
      arguments: {
        break: true
      }
    },
    component: {
      // TODO: Implement component
      //   <candy-component name="navbar" title="Dashboard"/>
    },
    continue: {
      function: 'if($continue) continue;',
      arguments: {
        continue: true
      }
    },
    mysql: {
      // TODO: Implement mysql
    },
    else: {
      function: '} else {'
    },
    elseif: {
      function: '} else if($elseif){',
      arguments: {
        elseif: true
      }
    },
    fetch: {
      // TODO: Implement fetch
      //  <candy-fetch fetch="/get/products" as="data" method="GET" headers="{}" body="null" refresh="false">
    },
    for: {
      function: 'for(let $key in $in){ let $value = $constructor[$key];',
      arguments: {
        in: null,
        key: 'key',
        value: 'value'
      }
    },
    if: {
      function: 'if($if){',
      arguments: {
        if: true
      }
    },
    '<candy-js>': {
      end: ' html += `',
      function: '`; ',
      close: '</candy-js>'
    },
    lazy: {
      // TODO: Implement lazy
      //  <candy-lazy>
      //    <component name="profile-card" data="user"/>
      //  </candy-lazy>
    },
    list: {
      arguments: {
        list: 'list',
        key: 'key',
        value: 'value'
      },
      end: '}',
      function: 'for(let $key in $list){ let $value = $list[$key];',
      replace: 'ul'
    },
    while: {
      function: 'while($while){',
      arguments: {
        while: true
      }
    }
  }
  #part = {}
  #candy = null

  constructor(candy) {
    this.#candy = candy
  }

  all(name) {
    this.#part.all = name
    return this
  }

  // - PRINT VIEW
  print() {
    if (this.#candy.Request.res.finished) return
    let result = ''
    if (this.#part.skeleton && fs.existsSync(`./skeleton/${this.#part.skeleton}.html`)) {
      result = fs.readFileSync(`./skeleton/${this.#part.skeleton}.html`, 'utf8')
      for (let key in this.#part) {
        if (['all', 'skeleton'].includes(key)) continue
        if (!this.#part[key]) continue
        if (this.#part[key].includes('.')) this.#part[key] = this.#part[key].replace(/\./g, '/')
        if (fs.existsSync(`./view/${key}/${this.#part[key]}.html`)) {
          result = result.replace(`{{ ${key.toUpperCase()} }}`, this.#render(`./view/${key}/${this.#part[key]}.html`))
        }
      }
      if (this.#part.all) {
        let parts = result.match(/{{.*?}}/g).map(part => part.replace(/{{|}}/g, '').trim())
        if (parts)
          for (let part of parts) {
            part = part.trim()
            let file = this.#part.all.split('.')
            file.splice(-1, 0, part.toLowerCase())
            file = file.join('/')
            if (fs.existsSync(`./view/${file}.html`)) {
              result = result.replace(`{{ ${part.toUpperCase()} }}`, this.#render(`./view/${file}.html`))
            }
          }
      }
    }
    this.#candy.Request.header('Content-Type', 'text/html')
    this.#candy.Request.end(result)
  }

  #render(file) {
    let mtime = fs.statSync(file).mtimeMs
    if (this.#cache[file]?.mtime !== mtime) {
      let content = fs.readFileSync(file, 'utf8')
      let result = 'html += `\n' + content + '\n`'
      content = content.split('\n')
      for (let key in this.#functions) {
        let att = ''
        let func = this.#functions[key]
        let matches = func.close
          ? result.match(new RegExp(`${key}[\\s\\S]*?${func.close}`, 'g'))
          : result.match(new RegExp(`<candy-${key}.*?>`, 'g'))
        if (!matches) continue
        for (let match of matches) {
          let args = match.match(/(?:\w+)=["].*?["]/g)
          if (!func.close) match = match.replace(/<candy-|>/g, '')
          let vars = {}
          if (func.arguments)
            for (let arg of args) {
              let [key, value] = arg.split('=')
              key = key.trim()
              value = value.replace(/"/g, '').trim()
              if (func.arguments[key] === undefined) {
                att += `${key}="${value}"`
                continue
              }
              vars[key] = value
            }
          if (!func.function) continue
          let fun = func.function
          for (let key in func.arguments) {
            if (vars[key] === undefined) {
              if (func.arguments[key] === null) console.error(`"${key}" is required for "${match}"\n  in "${file}"`)
              vars[key] = func.arguments[key]
            }
            fun = fun.replace(new RegExp(`\\$${key}`, 'g'), vars[key])
          }
          if (func.close) {
            result = result.replace(match, fun + match.substring(key.length, match.length - func.close.length) + func.end)
          } else {
            result = result.replace(
              `<candy-${match}>`,
              (func.replace ? `<${[func.replace, att].join(' ')}>` : '') + '`; ' + fun + ' html += `'
            )
            result = result.replace(
              `</candy-${key}>`,
              '`; ' + (func.end ?? '}') + ' html += `' + (func.replace ? `</${func.replace}>` : '')
            )
          }
        }
      }
      let cache = `${nodeCrypto.createHash('md5').update(file).digest('hex')}`
      if (!fs.existsSync('./storage/cache')) fs.mkdirSync('./storage/cache', {recursive: true})
      fs.writeFileSync(
        './storage/cache/' + cache,
        `module.exports = (Candy, get, __) => {\nlet html = '';\n${result}\nreturn html.trim()\n}`
      )
      delete require.cache[require.resolve(__dir + '/storage/cache/' + cache)]
      if (!Candy.View) Candy.View = {}
      if (!Candy.View.cache) Candy.View.cache = {}
      Candy.View.cache[file] = {
        mtime: mtime,
        cache: cache
      }
    }
    try {
      return require(__dir + '/storage/cache/' + Candy.View.cache[file].cache)(
        this.#candy,
        key => this.#candy.Request.get(key),
        (...args) => this.#candy.Lang.get(...args)
      )
    } catch (e) {
      let stackLine = e.stack.split('\n')[1].match(/:(\d+):\d+/)
      let line = stackLine ? parseInt(stackLine[1]) - 3 : e.lineNumber ? e.lineNumber - 3 : 'unknown'
      console.error(e.toString().split('\n')[0] + `\n  in line ${line}\n  of "${file}"`)
    }
    return ''
  }

  // - SET PARTS
  set(...args) {
    if (args.length === 1 && typeof args[0] === 'object') for (let key in args[0]) this.#part[key] = args[0][key]
    else if (args.length === 2) this.#part[args[0]] = args[1]
    return this
  }

  skeleton(name) {
    this.#part.skeleton = name
    return this
  }
}

module.exports = View
