/**
 * Mock implementation of the https module for server tests
 * Extends the http mock with SSL/TLS specific functionality
 */

const http = require('./http')
const {createMockEventEmitter} = require('./testHelpers')

// Track active HTTPS servers
const activeHttpsServers = new Map()
let nextHttpsServerId = 1

const createMockHttpsServer = (options = {}) => {
  const server = createMockEventEmitter()
  const serverId = nextHttpsServerId++

  // Inherit from HTTP server mock
  const httpServer = http.createServer()
  Object.setPrototypeOf(server, httpServer)
  Object.assign(server, httpServer)

  // Override and add HTTPS-specific properties
  Object.assign(server, {
    // SSL/TLS properties
    cert: options.cert || null,
    key: options.key || null,
    ca: options.ca || null,
    ciphers: options.ciphers || null,
    secureProtocol: options.secureProtocol || 'TLSv1_2_method',

    // SNI callback
    SNICallback: options.SNICallback || null,

    // Override listen to handle HTTPS port default
    listen: jest.fn((port, hostname, backlog, callback) => {
      // Handle different argument patterns
      if (typeof port === 'function') {
        callback = port
        port = 443
      } else if (typeof hostname === 'function') {
        callback = hostname
        hostname = undefined
      } else if (typeof backlog === 'function') {
        callback = backlog
        backlog = undefined
      }

      server._port = port || 443
      server._hostname = hostname || '0.0.0.0'
      server.listening = true

      if (callback) {
        server.once('listening', callback)
      }

      setTimeout(() => {
        server.emit('listening')
      }, 0)

      return server
    }),

    // SSL/TLS specific methods
    addContext: jest.fn((hostname, context) => {
      if (!server._contexts) {
        server._contexts = new Map()
      }
      server._contexts.set(hostname, context)
      return server
    }),

    // Test helpers
    __simulateSecureConnection: (socket, options = {}) => {
      const secureSocket = Object.assign(socket, {
        encrypted: true,
        authorized: options.authorized !== false,
        authorizationError: options.authorizationError || null,
        getPeerCertificate: jest.fn(() => ({
          subject: {CN: options.commonName || 'localhost'},
          issuer: {CN: 'Test CA'},
          valid_from: new Date().toISOString(),
          valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          fingerprint: 'AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD'
        })),
        getCipher: jest.fn(() => ({
          name: 'ECDHE-RSA-AES128-GCM-SHA256',
          version: 'TLSv1.2'
        })),
        getProtocol: jest.fn(() => 'TLSv1.2'),
        getSession: jest.fn(() => Buffer.alloc(0))
      })

      setTimeout(() => {
        server.emit('secureConnection', secureSocket)
      }, 0)

      return secureSocket
    },

    __simulateClientError: (error, socket) => {
      server.emit('clientError', error, socket)
    },

    __getContexts: () => server._contexts || new Map()
  })

  activeHttpsServers.set(serverId, server)
  return server
}

const createMockHttpsClientRequest = (options = {}) => {
  const request = createMockEventEmitter()

  // Inherit from HTTP client request mock
  const httpRequest = http.request(options)
  Object.setPrototypeOf(request, httpRequest)
  Object.assign(request, httpRequest)

  // Add HTTPS-specific properties
  Object.assign(request, {
    // SSL/TLS properties
    rejectUnauthorized: options.rejectUnauthorized !== false,
    servername: options.servername || options.hostname,

    // Override end to simulate SSL handshake
    end: jest.fn((data, encoding, callback) => {
      if (data) {
        request.write(data, encoding)
      }

      if (typeof encoding === 'function') {
        callback = encoding
      }
      if (typeof data === 'function') {
        callback = data
      }

      request.finished = true
      request.writable = false
      request.writableEnded = true

      // Simulate SSL handshake and response
      setTimeout(() => {
        // Emit secureConnect event
        request.emit('secureConnect')

        const response = http.IncomingMessage()
        Object.assign(response, {
          statusCode: 200,
          statusMessage: 'OK',
          headers: {'content-type': 'text/plain'},
          connection: {
            encrypted: true,
            authorized: true,
            getPeerCertificate: jest.fn(() => ({
              subject: {CN: options.servername || 'localhost'},
              issuer: {CN: 'Test CA'},
              valid_from: new Date().toISOString(),
              valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }))
          }
        })

        request.emit('response', response)

        // Simulate response data
        setTimeout(() => {
          response.__simulateData('Mock HTTPS response data')
          response.__simulateEnd()
        }, 0)

        if (callback) callback()
      }, 0)

      return request
    })
  })

  return request
}

const https = {
  // Server creation
  createServer: jest.fn((options, requestListener) => {
    if (typeof options === 'function') {
      requestListener = options
      options = {}
    }

    const server = createMockHttpsServer(options)

    if (requestListener) {
      server.on('request', requestListener)
    }

    return server
  }),

  // Client requests
  request: jest.fn((options, callback) => {
    if (typeof options === 'string') {
      const url = new URL(options)
      options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'GET'
      }
    }

    const req = createMockHttpsClientRequest(options)

    if (callback) {
      req.once('response', callback)
    }

    return req
  }),

  get: jest.fn((options, callback) => {
    const req = https.request(options, callback)
    req.end()
    return req
  }),

  // Classes
  Server: jest.fn(function (options, requestListener) {
    return createMockHttpsServer(options, requestListener)
  }),

  Agent: jest.fn(function (options = {}) {
    return {
      maxSockets: options.maxSockets || Infinity,
      maxFreeSockets: options.maxFreeSockets || 256,
      timeout: options.timeout || 0,
      keepAlive: options.keepAlive || false,
      keepAliveMsecs: options.keepAliveMsecs || 1000,
      maxCachedSessions: options.maxCachedSessions || 100,
      servername: options.servername,

      // Methods
      createConnection: jest.fn(),
      keepSocketAlive: jest.fn(),
      reuseSocket: jest.fn(),
      destroy: jest.fn()
    }
  }),

  // Global agent
  globalAgent: {
    maxSockets: Infinity,
    maxFreeSockets: 256,
    timeout: 0,
    keepAlive: false,
    keepAliveMsecs: 1000,
    maxCachedSessions: 100
  },

  // Inherit HTTP constants and methods
  METHODS: http.METHODS,
  STATUS_CODES: http.STATUS_CODES,

  // Test helpers
  __getActiveServers: () => new Map(activeHttpsServers),
  __clearAll: () => {
    activeHttpsServers.clear()
    nextHttpsServerId = 1
    http.__clearAll()
  }
}

module.exports = https
