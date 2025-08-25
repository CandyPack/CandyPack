const fs = require('fs')
const os = require('os')

class Config {
  #dir
  #file
  #loaded = false
  #saving = false
  #changed = false

  async get(key) {
    if (this.#loaded) return this.config[key]
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.#loaded) {
          clearInterval(interval)
          resolve(this.config[key])
        }
      }, 100)
    })
  }

  async init() {
    this.#dir = os.homedir() + '/.candypack'
    this.#file = this.#dir + '/config.json'
    this.config = {}
    if (!fs.existsSync(this.#dir)) fs.mkdirSync(this.#dir)
    if (!fs.existsSync(this.#file)) this.#save()
    else await this.#load()
    if (global.trigger === 'cli') setInterval(() => this.#save(), 500)
    this.config = this.#proxy(this.config)
  }

  async #load() {
    return new Promise(resolve => {
      if (this.#saving && this.#loaded) return resolve()
      if (!fs.existsSync(this.#file)) {
        this.#loaded = true
        return resolve()
      }
      fs.readFile(this.#file, 'utf8', (err, data) => {
        if (err) {
          console.log(err)
          this.#loaded = true
          this.#save()
          return resolve()
        }
        try {
          if (data.length > 2) {
            data = JSON.parse(data)
            this.#loaded = true
          }
        } catch {
          console.log('Error parsing config file:', this.#file)
        }
        if (!this.#loaded) {
          if (data.length > 2) {
            var backup = this.#dir + '/config-corrupted.json'
            if (fs.existsSync(this.#file)) fs.copyFileSync(this.#file, backup)
          }
          if (fs.existsSync(this.#file + '.bak')) {
            fs.readFile(this.#file + '.bak', 'utf8', async (err, data) => {
              if (err) {
                console.log(err)
                this.#save(true)
                return resolve()
              }
              try {
                data = JSON.parse(data)
                await fs.promises.writeFile(this.#file, JSON.stringify(data, null, 4), 'utf8')
              } catch (e) {
                console.log(e)
                this.#save(true)
              }
              this.config = data
              return resolve()
            })
          } else {
            this.config = {}
            this.#save(true)
            return resolve()
          }
        } else {
          this.config = data
          return resolve()
        }
      })
    })
  }

  #proxy(target) {
    if (typeof target !== 'object' || target === null) return target
    const handler = {
      get: (obj, prop) => {
        const value = obj[prop]
        if (typeof value === 'object' && value !== null) return this.#proxy(value)
        return value
      },
      set: (obj, prop, value) => {
        obj[prop] = typeof value === 'object' && value !== null ? this.#proxy(value) : value
        this.#changed = true
        obj[prop] = value
        return true
      },
      deleteProperty: (obj, prop) => {
        this.#changed = true
        delete obj[prop]
        return true
      }
    }
    return new Proxy(target, handler)
  }

  #save() {
    if (this.#saving || !this.#changed) return
    this.#changed = false
    this.#saving = true
    let json = JSON.stringify(this.config, null, 4)
    if (json.length < 3) json = '{}'
    fs.writeFileSync(this.#file, json, 'utf8')
    setTimeout(() => {
      fs.writeFileSync(this.#file + '.bak', json, 'utf8')
    }, 5000)
    this.#saving = false
  }
}

module.exports = new Config()
