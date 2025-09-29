/**
 * Mock implementation of the net module for server tests
 * Provides comprehensive mocking of TCP server and socket operations
 */

const {createMockEventEmitter} = require('./testHelpers')

// Track active servers and connections
const activeServers = new Map()
const activeConnections = new Map()
let nextConnectionId = 1

const createMockSocket = (options = {}) => {
  const socket = createMockEventEmitter()
  const connectionId = nextConnectionId++

  Object.assign(socket, {
    // Connection properties
    remoteAddress: options.remoteAddress || '127.0.0.1',
    remotePort: options.remotePort || Math.floor(Math.random() * 50000) + 10000,
    localAddress: options.localAddress || '127.0.0.1',
    localPort: options.localPort || 1453,
    remoteFamily: options.remoteFamily || 'IPv4',
    localFamily: options.localFamily || 'IPv4',

    // State properties
    readable: true,
    writable: true,
    destroyed: false,
    connecting: false,
    readyState: 'open',

    // Buffer properties
    bytesRead: 0,
    bytesWritten: 0,

    // Methods
    write: jest.fn((data, encoding, callback) => {
      if (socket.destroyed || !socket.writable) {
        const error = new Error('Cannot write to destroyed socket')
        if (callback) callback(error)
        return false
      }

      socket.bytesWritten += Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, encoding)

      if (callback) {
        setTimeout(callback, 0)
      }

      return true
    }),

    end: jest.fn((data, encoding, callback) => {
      if (data) {
        socket.write(data, encoding)
      }

      if (typeof encoding === 'function') {
        callback = encoding
      }
      if (typeof data === 'function') {
        callback = data
      }

      socket.writable = false

      setTimeout(() => {
        socket.emit('end')
        if (callback) callback()
      }, 0)

      return socket
    }),

    destroy: jest.fn(error => {
      if (socket.destroyed) return socket

      socket.destroyed = true
      socket.readable = false
      socket.writable = false
      socket.readyState = 'closed'

      activeConnections.delete(connectionId)

      setTimeout(() => {
        if (error) {
          socket.emit('error', error)
        }
        socket.emit('close', !!error)
      }, 0)

      return socket
    }),

    pause: jest.fn(() => {
      socket.readable = false
      return socket
    }),

    resume: jest.fn(() => {
      socket.readable = true
      return socket
    }),

    setTimeout: jest.fn((timeout, callback) => {
      if (callback) {
        socket.once('timeout', callback)
      }

      const timeoutId = setTimeout(() => {
        socket.emit('timeout')
      }, timeout)

      socket._timeout = timeoutId
      return socket
    }),

    setNoDelay: jest.fn((noDelay = true) => {
      socket._noDelay = noDelay
      return socket
    }),

    setKeepAlive: jest.fn((enable = false, initialDelay = 0) => {
      socket._keepAlive = enable
      socket._keepAliveInitialDelay = initialDelay
      return socket
    }),

    address: jest.fn(() => ({
      address: socket.localAddress,
      family: socket.localFamily,
      port: socket.localPort
    })),

    // Test helpers
    __simulateData: data => {
      if (!socket.destroyed && socket.readable) {
        socket.bytesRead += Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data)
        socket.emit('data', Buffer.isBuffer(data) ? data : Buffer.from(data))
      }
    },

    __simulateError: error => {
      socket.emit('error', error)
    },

    __simulateClose: (hadError = false) => {
      socket.destroy()
    }
  })

  activeConnections.set(connectionId, socket)
  return socket
}

const createMockServer = (options = {}) => {
  const server = createMockEventEmitter()
  const serverId = Math.floor(Math.random() * 1000)

  Object.assign(server, {
    // State properties
    listening: false,
    maxConnections: options.maxConnections || 0,
    connections: 0,

    // Server address info
    address: jest.fn(() => {
      if (!server.listening) return null
      return {
        address: server._address || '127.0.0.1',
        family: server._family || 'IPv4',
        port: server._port || 1453
      }
    }),

    // Methods
    listen: jest.fn((port, hostname, backlog, callback) => {
      // Handle different argument patterns
      if (typeof port === 'function') {
        callback = port
        port = 0
      } else if (typeof hostname === 'function') {
        callback = hostname
        hostname = undefined
      } else if (typeof backlog === 'function') {
        callback = backlog
        backlog = undefined
      }

      server._port = port || Math.floor(Math.random() * 50000) + 10000
      server._address = hostname || '127.0.0.1'
      server._family = 'IPv4'
      server.listening = true

      if (callback) {
        server.once('listening', callback)
      }

      setTimeout(() => {
        server.emit('listening')
      }, 0)

      return server
    }),

    close: jest.fn(callback => {
      if (!server.listening) {
        const error = new Error('Server is not running')
        if (callback) {
          setTimeout(() => callback(error), 0)
        }
        return server
      }

      server.listening = false

      // Close all connections
      activeConnections.forEach(socket => {
        if (socket.localPort === server._port) {
          socket.destroy()
        }
      })

      if (callback) {
        server.once('close', callback)
      }

      setTimeout(() => {
        server.emit('close')
      }, 0)

      activeServers.delete(serverId)
      return server
    }),

    getConnections: jest.fn(callback => {
      const count = Array.from(activeConnections.values()).filter(socket => socket.localPort === server._port && !socket.destroyed).length

      if (callback) {
        setTimeout(() => callback(null, count), 0)
      }

      return count
    }),

    ref: jest.fn(() => server),
    unref: jest.fn(() => server),

    // Test helpers
    __simulateConnection: (socketOptions = {}) => {
      if (!server.listening) {
        throw new Error('Server is not listening')
      }

      const socket = createMockSocket({
        localPort: server._port,
        localAddress: server._address,
        ...socketOptions
      })

      server.connections++

      setTimeout(() => {
        server.emit('connection', socket)
      }, 0)

      return socket
    },

    __simulateError: error => {
      server.emit('error', error)
    }
  })

  activeServers.set(serverId, server)
  return server
}

const net = {
  // Server creation
  createServer: jest.fn((options, connectionListener) => {
    if (typeof options === 'function') {
      connectionListener = options
      options = {}
    }

    const server = createMockServer(options)

    if (connectionListener) {
      server.on('connection', connectionListener)
    }

    return server
  }),

  // Socket creation
  createConnection: jest.fn((options, connectListener) => {
    const socket = createMockSocket()

    if (typeof options === 'number') {
      options = {port: options}
    }

    socket.connecting = true
    socket.readyState = 'opening'

    if (connectListener) {
      socket.once('connect', connectListener)
    }

    // Simulate connection
    setTimeout(() => {
      socket.connecting = false
      socket.readyState = 'open'
      socket.emit('connect')
    }, 0)

    return socket
  }),

  connect: jest.fn((...args) => net.createConnection(...args)),

  // Utility functions
  isIP: jest.fn(input => {
    if (typeof input !== 'string') return 0

    // Simple IPv4 check
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (ipv4Regex.test(input)) {
      const parts = input.split('.')
      if (parts.every(part => parseInt(part) >= 0 && parseInt(part) <= 255)) {
        return 4
      }
    }

    // Simple IPv6 check
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    if (ipv6Regex.test(input)) {
      return 6
    }

    return 0
  }),

  isIPv4: jest.fn(input => net.isIP(input) === 4),
  isIPv6: jest.fn(input => net.isIP(input) === 6),

  // Socket class
  Socket: jest.fn(function (options = {}) {
    return createMockSocket(options)
  }),

  // Server class
  Server: jest.fn(function (options = {}, connectionListener) {
    return createMockServer(options, connectionListener)
  }),

  // Test helpers
  __getActiveServers: () => new Map(activeServers),
  __getActiveConnections: () => new Map(activeConnections),
  __clearAll: () => {
    activeServers.clear()
    activeConnections.clear()
    nextConnectionId = 1
  }
}

module.exports = net
