const fs = require('fs').promises
const path = require('path')

class Lang {
  #locale
  #file
  #strings = {}
  #savePromise = Promise.resolve()
  #loaded

  constructor() {
    this.#locale = Intl.DateTimeFormat().resolvedOptions().locale
    this.#file = path.join(__dirname, '..', 'locale', `${this.#locale}.json`)
    this.#loaded = this.#load()
  }

  #save() {
    this.#savePromise = this.#savePromise.then(async () => {
      try {
        await fs.writeFile(this.#file, JSON.stringify(this.#strings, null, 4), 'utf8')
      } catch (err) {
        console.error('Error saving language file:', err)
      }
    })
    return this.#savePromise
  }

  async #load() {
    try {
      const data = await fs.readFile(this.#file, 'utf8')
      this.#strings = JSON.parse(data)
    } catch (err) {
      this.#strings = {}
      await this.#save()
    }
  }

  async get(key, ...args) {
    await this.#loaded

    if (key === 'CandyPack') return 'CandyPack'

    let text = this.#strings[key]

    if (text === undefined) {
      text = key
      this.#strings[key] = text
      this.#save()
    }

    if (args.length > 0) {
      for (const arg of args) {
        text = text.replace('%s', arg)
      }
    }
    return text
  }
}

module.exports = Lang
