/**
 * Mock implementation of tls module for server tests
 */

const {createMockEventEmitter, createMockStream} = require('./testHelpers')

const createMockSecureContext = (options = {}) => {
  return {
    context: 'mock-secure-context',
    options: options,
    // Mock methods that might be called on the context
    setCert: jest.fn(),
    setKey: jest.fn(),
    addCACert: jest.fn(),
    addCRL: jest.fn(),
    addRootCerts: jest.fn()
  }
}

const createMockTLSSocket = (socket, options = {}) => {
  const tlsSocket = Object.assign(createMockStream(true, true), createMockEventEmitter())

  Object.assign(tlsSocket, {
    // TLS-specific properties
    authorized: true,
    authorizationError: null,
    encrypted: true,

    // Certificate information
    getPeerCertificate: jest.fn((detailed = false) => {
      return {
        subject: {
          CN: 'example.com',
          O: 'Test Organization',
          C: 'US'
        },
        issuer: {
          CN: 'Test CA',
          O: 'Test CA Organization',
          C: 'US'
        },
        valid_from: 'Jan 1 00:00:00 2023 GMT',
        valid_to: 'Jan 1 00:00:00 2024 GMT',
        fingerprint: 'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD',
        serialNumber: '01',
        raw: Buffer.from('mock-certificate-data')
      }
    }),

    getCipher: jest.fn(() => {
      return {
        name: 'ECDHE-RSA-AES128-GCM-SHA256',
        version: 'TLSv1.2'
      }
    }),

    getProtocol: jest.fn(() => 'TLSv1.2'),

    getSession: jest.fn(() => Buffer.from('mock-session-data')),

    getTLSTicket: jest.fn(() => Buffer.from('mock-tls-ticket')),

    renegotiate: jest.fn((options, callback) => {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }
      setTimeout(() => {
        if (callback) callback(null)
      }, 0)
      return true
    }),

    setMaxSendFragment: jest.fn(size => {
      return true
    }),

    // Underlying socket
    socket: socket || createMockStream(true, true)
  })

  return tlsSocket
}

const createMockServer = (options = {}, secureConnectionListener) => {
  if (typeof options === 'function') {
    secureConnectionListener = options
    options = {}
  }

  const server = Object.assign(createMockEventEmitter(), {
    listening: false,
    maxConnections: null,
    connections: 0,

    listen: jest.fn((port, hostname, backlog, callback) => {
      // Handle various argument combinations
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

      server.listening = true

      setTimeout(() => {
        server.emit('listening')
        if (callback) callback()
      }, 0)

      return server
    }),

    close: jest.fn(callback => {
      server.listening = false

      setTimeout(() => {
        server.emit('close')
        if (callback) callback()
      }, 0)

      return server
    }),

    address: jest.fn(() => {
      return {
        port: 443,
        family: 'IPv4',
        address: '0.0.0.0'
      }
    }),

    getConnections: jest.fn(callback => {
      setTimeout(() => {
        callback(null, server.connections)
      }, 0)
    }),

    // Test helper methods
    simulateConnection: socket => {
      const tlsSocket = createMockTLSSocket(socket)
      server.connections++

      if (secureConnectionListener) {
        secureConnectionListener(tlsSocket)
      }

      server.emit('secureConnection', tlsSocket)
      return tlsSocket
    },

    simulateError: error => {
      server.emit('error', error)
    }
  })

  return server
}

const tls = {
  // Create secure context
  createSecureContext: jest.fn((options = {}) => {
    return createMockSecureContext(options)
  }),

  // Create TLS server
  createServer: jest.fn((options, secureConnectionListener) => {
    return createMockServer(options, secureConnectionListener)
  }),

  // Create TLS connection
  connect: jest.fn((port, host, options, callback) => {
    // Handle various argument combinations
    if (typeof port === 'object') {
      options = port
      port = options.port
      host = options.host
    } else if (typeof host === 'object') {
      callback = options
      options = host
      host = 'localhost'
    } else if (typeof host === 'function') {
      callback = host
      host = 'localhost'
      options = {}
    } else if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const socket = createMockTLSSocket()

    setTimeout(() => {
      socket.emit('connect')
      socket.emit('secureConnect')
      if (callback) callback()
    }, 0)

    return socket
  }),

  // Get ciphers
  getCiphers: jest.fn(() => {
    return [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384',
      'AES128-GCM-SHA256',
      'AES256-GCM-SHA384'
    ]
  }),

  // Constants
  CLIENT_RENEG_LIMIT: 3,
  CLIENT_RENEG_WINDOW: 600,

  // Test helpers
  __createMockSecureContext: createMockSecureContext,
  __createMockTLSSocket: createMockTLSSocket,
  __createMockServer: createMockServer
}

module.exports = tls
