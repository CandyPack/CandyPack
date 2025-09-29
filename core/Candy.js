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

  #resolve(key, requestedSingleton = null) {
    const entry = this._registry.get(key)
    if (!entry) throw new Error(`Candy: '${key}' not found`)

    // Use requested singleton preference if provided, otherwise use registered preference
    const useSingleton = requestedSingleton !== null ? requestedSingleton : entry.singleton

    if (useSingleton) {
      if (!this._singletons.has(key)) {
        const instance = this.#instantiate(entry.value)
        if (instance && typeof instance.init === 'function') {
          instance.init()
        }
        this._singletons.set(key, instance)
      }
      return this._singletons.get(key)
    }

    // For non-singleton, create new instance each time
    const instance = this.#instantiate(entry.value)
    if (instance && typeof instance.init === 'function') {
      instance.init()
    }
    return instance
  }

  core(name, singleton = true) {
    const key = `core:${name}`
    if (!this._registry.has(key)) {
      const modPath = `../core/${name}`
      let Mod = require(modPath)
      this.#register(key, Mod, singleton)
    }

    return this.#resolve(key, singleton)
  }

  cli(name, singleton = true) {
    const key = `cli:${name}`
    if (!this._registry.has(key)) {
      const modPath = `../cli/src/${name}`
      const Mod = require(modPath)
      this.#register(key, Mod, singleton)
    }
    return this.#resolve(key, singleton)
  }

  server(name, singleton = true) {
    const key = `server:${name}`
    if (!this._registry.has(key)) {
      const modPath = `../server/src/${name}`
      const Mod = require(modPath)
      this.#register(key, Mod, singleton)
    }
    return this.#resolve(key, singleton)
  }

  watchdog(name, singleton = true) {
    const key = `watchdog:${name}`
    if (!this._registry.has(key)) {
      const modPath = `../watchdog/src/${name}`
      const Mod = require(modPath)
      this.#register(key, Mod, singleton)
    }
    return this.#resolve(key, singleton)
  }
}

if (!global.Candy) {
  global.Candy = new CandyPack()
  global.__ = (...args) => Candy.core('Lang').get(...args)
}
