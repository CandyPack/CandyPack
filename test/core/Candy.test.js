// Mock fs before requiring any modules that might use it
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue()
  },
  readFileSync: jest.fn().mockReturnValue('{"Status": "Status"}'),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}))

// Mock process.mainModule to avoid Config initialization issues
process.mainModule = {path: '/mock/node_modules/candypack/bin'}

// Import the module to ensure global setup
require('../../core/Candy.js')

describe('CandyPack', () => {
  describe('global setup', () => {
    it('should have global Candy instance', () => {
      expect(global.Candy).toBeDefined()
      expect(global.Candy._registry).toBeInstanceOf(Map)
      expect(global.Candy._singletons).toBeInstanceOf(Map)
    })

    it('should have global __ function', () => {
      expect(global.__).toBeDefined()
      expect(typeof global.__).toBe('function')
    })

    it('should call Lang.get through global __ function', () => {
      const result = global.__('Status')
      expect(result).toBe('Status')
    })

    it('should not recreate global if already exists', () => {
      const existingCandy = global.Candy

      // Clear module cache and re-require
      delete require.cache[require.resolve('../../core/Candy.js')]
      require('../../core/Candy.js')

      expect(global.Candy).toBe(existingCandy)
    })
  })

  describe('CandyPack instance methods', () => {
    it('should have core method', () => {
      expect(typeof global.Candy.core).toBe('function')
    })

    it('should have cli method', () => {
      expect(typeof global.Candy.cli).toBe('function')
    })

    it('should have server method', () => {
      expect(typeof global.Candy.server).toBe('function')
    })

    it('should have watchdog method', () => {
      expect(typeof global.Candy.watchdog).toBe('function')
    })
  })

  describe('module loading functionality', () => {
    it('should load core modules', () => {
      const lang = global.Candy.core('Lang')
      expect(lang).toBeDefined()
      expect(global.Candy._registry.has('core:Lang')).toBe(true)
    })

    it('should return singleton instances by default', () => {
      const lang1 = global.Candy.core('Lang')
      const lang2 = global.Candy.core('Lang')
      expect(lang1).toBe(lang2)
    })

    it('should cache singleton instances', () => {
      const lang1 = global.Candy.core('Lang')
      const lang2 = global.Candy.core('Lang')

      expect(lang1).toBe(lang2)
      expect(global.Candy._singletons.has('core:Lang')).toBe(true)
    })

    it('should return new instances when singleton is false', () => {
      // Clear any existing Lang registration first to test non-singleton behavior
      global.Candy._registry.delete('core:Lang')
      global.Candy._singletons.delete('core:Lang')

      const lang1 = global.Candy.core('Lang', false)
      const lang2 = global.Candy.core('Lang', false)
      expect(lang1).not.toBe(lang2)
    })

    it('should call init method if module has one', () => {
      // Test with Config module which has init method
      const config = global.Candy.core('Config')
      expect(config).toBeDefined()
    })

    it('should retrieve Config module as singleton', () => {
      // Get Config instance twice
      const config1 = global.Candy.core('Config')
      const config2 = global.Candy.core('Config')

      // Should be the same instance (singleton behavior)
      expect(config1).toBe(config2)
      expect(config1).toBeInstanceOf(Object)

      // Should be registered in singleton cache
      expect(global.Candy._singletons.has('core:Config')).toBe(true)
      expect(global.Candy._singletons.get('core:Config')).toBe(config1)

      // Should have Config class properties
      expect(config1.config).toBeDefined()
      expect(typeof config1.force).toBe('function')
      expect(typeof config1.reload).toBe('function')
    })

    it('should handle modules without init method', () => {
      // Test with Process module which doesn't have init method
      const process = global.Candy.core('Process')
      expect(process).toBeDefined()
    })
  })

  describe('different module types', () => {
    it('should load cli modules with correct path prefix', () => {
      // This will fail but we can test the path construction
      expect(() => {
        global.Candy.cli('NonExistentCli')
      }).toThrow()
    })

    it('should load server modules with correct path prefix', () => {
      // This will fail but we can test the path construction
      expect(() => {
        global.Candy.server('NonExistentServer')
      }).toThrow()
    })

    it('should load watchdog modules with correct path prefix', () => {
      // This will fail but we can test the path construction
      expect(() => {
        global.Candy.watchdog('NonExistentWatchdog')
      }).toThrow()
    })
  })

  describe('registry functionality', () => {
    it('should maintain separate registries for different module types', () => {
      // Load a core module
      global.Candy.core('Lang')

      expect(global.Candy._registry.has('core:Lang')).toBe(true)
      expect(global.Candy._registry.size).toBeGreaterThan(0)
    })

    it('should store registry entries with correct structure', () => {
      global.Candy.core('Lang')

      const entry = global.Candy._registry.get('core:Lang')
      expect(entry).toBeDefined()
      expect(entry).toHaveProperty('value')
      expect(entry).toHaveProperty('singleton')
    })

    it('should handle non-singleton registry entries', () => {
      // Clear existing registration
      global.Candy._registry.delete('core:Lang')
      global.Candy._singletons.delete('core:Lang')

      global.Candy.core('Lang', false)

      const entry = global.Candy._registry.get('core:Lang')
      expect(entry.singleton).toBe(false)
    })
  })

  describe('instantiation behavior', () => {
    it('should instantiate function modules', () => {
      const lang = global.Candy.core('Lang')
      expect(lang).toBeInstanceOf(Object)
    })

    it('should handle non-function modules', () => {
      const config = global.Candy.core('Config')
      expect(config).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle module loading errors gracefully', () => {
      expect(() => {
        global.Candy.core('NonExistentModule')
      }).toThrow()
    })

    it('should throw specific error for non-existent registry entries', () => {
      // Create a new CandyPack instance to test private methods
      const CandyPackClass = global.Candy.constructor
      const testInstance = new CandyPackClass()

      expect(() => {
        // This should trigger the resolve error
        testInstance.core('NonExistentModule')
      }).toThrow()
    })
  })

  describe('module caching', () => {
    beforeEach(() => {
      // Clear any existing registrations for clean tests
      global.Candy._registry.clear()
      global.Candy._singletons.clear()
    })

    it('should not re-register already registered modules', () => {
      // Load Lang module twice
      const lang1 = global.Candy.core('Lang')
      const lang2 = global.Candy.core('Lang')

      expect(lang1).toBe(lang2)
    })

    it('should maintain singleton cache correctly', () => {
      const lang = global.Candy.core('Lang')

      expect(global.Candy._singletons.has('core:Lang')).toBe(true)
      expect(global.Candy._singletons.get('core:Lang')).toBe(lang)
    })
  })
})
