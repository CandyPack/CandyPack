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
    setInterval(() => this.#save(), 500).unref()
    this.config = this.#proxy(this.config)
  }

  #load() {
    if (this.#saving && this.#loaded) return
    if (!fs.existsSync(this.#file)) {
      this.#loaded = true
      return
    }
    let data = fs.readFileSync(this.#file, 'utf8')
    if (!data) {
      console.log('Error reading config file:', this.#file)
      this.#loaded = true
      this.#save()
      return
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
        data = fs.readFileSync(this.#file + '.bak', 'utf8')
        if (!data) {
          console.error('Error reading backup file:', this.#file + '.bak')
          this.#save(true)
          return
        }
        try {
          data = JSON.parse(data)
          fs.promises.writeFile(this.#file, JSON.stringify(data, null, 4), 'utf8')
        } catch (e) {
          console.log(e)
          this.#save(true)
        }
        this.config = data
        return
      } else {
        this.config = {}
        this.#save(true)
        return
      }
    } else {
      this.config = data
      return
    }
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
