class CandyPack {
  constructor() {
    this._registry = new Map()
    this._singletons = new Map()
  }

  #instantiate(value) {
    if (typeof value === 'function') return new value()
    return value
  }

  #register(key, value, singleton = true) {
    this._registry.set(key, {value, singleton})
  }

  #resolve(key) {
    const entry = this._registry.get(key)
    if (!entry) throw new Error(`Candy: '${key}' not found`)
    if (entry.singleton) {
      if (!this._singletons.has(key)) this._singletons.set(key, this.#instantiate(entry.value))
      return this._singletons.get(key)
    }
    return this.#instantiate(entry.value)
  }

  core(name, singleton = true) {
    const key = `core:${name}`
    if (!this._registry.has(key)) {
      const modPath = `../core/${name}`
      const Mod = require(modPath)
      if (Mod.init) Mod.init()
      this.#register(key, Mod, singleton)
    }
    return this.#resolve(key, singleton)
  }

  cli(name, singleton = true) {
    const key = `cli:${name}`
    if (!this._registry.has(key)) {
      const modPath = `../cli/src/${name}`
      const Mod = require(modPath)
      if (Mod.init) Mod.init()
      this.#register(key, Mod, singleton)
    }
    return this.#resolve(key, singleton)
  }

  server(name, singleton = true) {
    const key = `server:${name}`
    if (!this._registry.has(key)) {
      const modPath = `../server/src/${name}`
      const Mod = require(modPath)
      if (Mod.init) Mod.init()
      this.#register(key, Mod, singleton)
    }
    return this.#resolve(key, singleton)
  }

  watchdog(name, singleton = true) {
    const key = `watchdog:${name}`
    if (!this._registry.has(key)) {
      const modPath = `../watchdog/src/${name}`
      const Mod = require(modPath)
      if (Mod.init) Mod.init()
      this.#register(key, Mod, singleton)
    }
    return this.#resolve(key, singleton)
  }
}

if (!global.Candy) {
  global.Candy = new CandyPack()
  global.__ = (...args) => Candy.core('Lang').get(...args)
  global.log = (...args) => console.log(...args)
}
