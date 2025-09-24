/**
 * Mock implementation of the path module for server tests
 * Provides comprehensive mocking of path manipulation utilities
 */

const path = {
  // Path separator
  sep: '/',
  delimiter: ':',

  // POSIX and Windows path objects
  posix: null, // Will be set to this object
  win32: null, // Will be set to a Windows version

  // Path manipulation functions
  basename: jest.fn((path, ext) => {
    if (typeof path !== 'string') {
      throw new TypeError('Path must be a string')
    }

    const lastSlash = path.lastIndexOf('/')
    let base = lastSlash === -1 ? path : path.slice(lastSlash + 1)

    if (ext && base.endsWith(ext)) {
      base = base.slice(0, -ext.length)
    }

    return base
  }),

  dirname: jest.fn(path => {
    if (typeof path !== 'string') {
      throw new TypeError('Path must be a string')
    }

    if (path === '/') return '/'
    if (path === '') return '.'

    const lastSlash = path.lastIndexOf('/')
    if (lastSlash === -1) return '.'
    if (lastSlash === 0) return '/'

    return path.slice(0, lastSlash)
  }),

  extname: jest.fn(path => {
    if (typeof path !== 'string') {
      throw new TypeError('Path must be a string')
    }

    const lastDot = path.lastIndexOf('.')
    const lastSlash = path.lastIndexOf('/')

    if (lastDot === -1 || lastDot < lastSlash) {
      return ''
    }

    return path.slice(lastDot)
  }),

  format: jest.fn(pathObject => {
    if (typeof pathObject !== 'object' || pathObject === null) {
      throw new TypeError('Path object must be an object')
    }

    const {dir, root, base, name, ext} = pathObject

    if (base) {
      return dir ? `${dir}/${base}` : base
    }

    const filename = name + (ext || '')

    if (dir) {
      return `${dir}/${filename}`
    } else if (root) {
      return `${root}${filename}`
    }

    return filename
  }),

  isAbsolute: jest.fn(path => {
    if (typeof path !== 'string') {
      throw new TypeError('Path must be a string')
    }

    return path.startsWith('/')
  }),

  join: jest.fn((...paths) => {
    if (paths.length === 0) return '.'

    const filteredPaths = paths.filter(p => typeof p === 'string' && p !== '')
    if (filteredPaths.length === 0) return '.'

    let joined = filteredPaths.join('/')

    // Normalize the path
    return path.normalize(joined)
  }),

  normalize: jest.fn(path => {
    if (typeof path !== 'string') {
      throw new TypeError('Path must be a string')
    }

    if (path === '') return '.'

    const isAbsolute = path.startsWith('/')
    const trailingSlash = path.endsWith('/')

    // Split path into segments and process
    const segments = path.split('/').filter(segment => segment !== '' && segment !== '.')
    const normalizedSegments = []

    for (const segment of segments) {
      if (segment === '..') {
        if (normalizedSegments.length > 0 && normalizedSegments[normalizedSegments.length - 1] !== '..') {
          normalizedSegments.pop()
        } else if (!isAbsolute) {
          normalizedSegments.push('..')
        }
      } else {
        normalizedSegments.push(segment)
      }
    }

    let result = normalizedSegments.join('/')

    if (isAbsolute) {
      result = '/' + result
    } else if (result === '') {
      result = '.'
    }

    if (trailingSlash && result !== '/' && result !== '.') {
      result += '/'
    }

    return result
  }),

  parse: jest.fn(path => {
    if (typeof path !== 'string') {
      throw new TypeError('Path must be a string')
    }

    const isAbsolute = path.startsWith('/')
    const lastSlash = path.lastIndexOf('/')
    const lastDot = path.lastIndexOf('.')

    let dir = ''
    let base = ''
    let ext = ''
    let name = ''
    let root = ''

    if (isAbsolute) {
      root = '/'
    }

    if (lastSlash === -1) {
      base = path
      dir = isAbsolute ? '/' : ''
    } else {
      dir = path.slice(0, lastSlash) || (isAbsolute ? '/' : '')
      base = path.slice(lastSlash + 1)
    }

    if (lastDot > lastSlash && lastDot > 0) {
      ext = path.slice(lastDot)
      name = base.slice(0, base.length - ext.length)
    } else {
      name = base
    }

    return {root, dir, base, ext, name}
  }),

  relative: jest.fn((from, to) => {
    if (typeof from !== 'string' || typeof to !== 'string') {
      throw new TypeError('From and to must be strings')
    }

    if (from === to) return ''

    const fromParts = path
      .resolve(from)
      .split('/')
      .filter(p => p !== '')
    const toParts = path
      .resolve(to)
      .split('/')
      .filter(p => p !== '')

    // Find common prefix
    let commonLength = 0
    const minLength = Math.min(fromParts.length, toParts.length)

    for (let i = 0; i < minLength; i++) {
      if (fromParts[i] === toParts[i]) {
        commonLength++
      } else {
        break
      }
    }

    // Build relative path
    const upCount = fromParts.length - commonLength
    const relativeParts = Array(upCount).fill('..').concat(toParts.slice(commonLength))

    return relativeParts.join('/') || '.'
  }),

  resolve: jest.fn((...paths) => {
    let resolvedPath = ''
    let resolvedAbsolute = false

    for (let i = paths.length - 1; i >= 0 && !resolvedAbsolute; i--) {
      const path = paths[i]

      if (typeof path !== 'string') {
        throw new TypeError('Path must be a string')
      }

      if (path === '') continue

      resolvedPath = path + '/' + resolvedPath
      resolvedAbsolute = path.startsWith('/')
    }

    if (!resolvedAbsolute) {
      resolvedPath = '/mock/cwd/' + resolvedPath
    }

    // Normalize and remove trailing slash
    resolvedPath = path.normalize(resolvedPath)
    if (resolvedPath.endsWith('/') && resolvedPath !== '/') {
      resolvedPath = resolvedPath.slice(0, -1)
    }

    return resolvedPath
  }),

  // Test helpers
  __setPosix: () => {
    // Current implementation is already POSIX-like
    return path
  },

  __setWin32: () => {
    // Create a Windows version of path methods
    const win32Path = {...path}

    win32Path.sep = '\\'
    win32Path.delimiter = ';'

    win32Path.isAbsolute = jest.fn(path => {
      if (typeof path !== 'string') {
        throw new TypeError('Path must be a string')
      }

      return /^[a-zA-Z]:\\/.test(path) || path.startsWith('\\\\')
    })

    win32Path.normalize = jest.fn(path => {
      if (typeof path !== 'string') {
        throw new TypeError('Path must be a string')
      }

      return path.replace(/\//g, '\\')
    })

    return win32Path
  },

  __resetMocks: () => {
    Object.values(path).forEach(fn => {
      if (jest.isMockFunction(fn)) {
        fn.mockClear()
      }
    })
  }
}

// Set up posix and win32 references
path.posix = path
path.win32 = path.__setWin32()

module.exports = path
