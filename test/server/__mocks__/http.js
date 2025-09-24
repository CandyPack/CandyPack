/**
 * Mock implementation of the http module for server tests
 * Provides comprehensive mocking of HTTP server and client operations
 */

const {createMockEventEmitter} = require('./testHelpers')
const {createMockRequest, createMockResponse} = require('./testFactories')

// Track active servers
const activeServers = new Map()
let nextServerId = 1

const createMockIncomingMessage = (options = {}) => {
  const message = createMockEventEmitter()

  Object.assign(message, {
    // HTTP properties
    httpVersion: options.httpVersion || '1.1',
    httpVersionMajor: options.httpVersionMajor || 1,
    httpVersionMinor: options.httpVersionMinor || 1,
    complete: false,

    // Request properties
    url: options.url || '/',
    method: options.method || 'GET',
    statusCode: options.statusCode,
    statusMessage: options.statusMessage,

    // Headers
    headers: options.headers || {},
    rawHeaders: options.rawHeaders || [],
    trailers: {},
    rawTrailers: [],

    // Connection info
    connection: {
      remoteAddress: options.remoteAddress || '127.0.0.1',
      remotePort: options.remotePort || 12345,
      localAddress: options.localAddress || '127.0.0.1',
      localPort: options.localPort || 80
    },
    socket: options.socket || null,

    // Stream properties
    readable: true,
    readableEnded: false,

    // Methods
    setTimeout: jest.fn((msecs, callback) => {
      if (callback) {
        message.once('timeout', callback)
      }
      return message
    }),

    // Test helpers
    __simulateData: chunk => {
      if (message.readable) {
        message.emit('data', Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
    },

    __simulateEnd: () => {
      message.complete = true
      message.readableEnded = true
      message.emit('end')
    },

    __simulateError: error => {
      message.emit('error', error)
    }
  })

  return message
}

const createMockServerResponse = (options = {}) => {
  const response = createMockEventEmitter()

  Object.assign(response, {
    // Response properties
    statusCode: 200,
    statusMessage: 'OK',
    headersSent: false,
    finished: false,

    // Headers
    headers: {},

    // Connection
    connection: options.connection || null,
    socket: options.socket || null,

    // Stream properties
    writable: true,
    writableEnded: false,

    // Methods
    writeHead: jest.fn((statusCode, statusMessage, headers) => {
      if (typeof statusMessage === 'object') {
        headers = statusMessage
        statusMessage = undefined
      }

      response.statusCode = statusCode
      if (statusMessage) {
        response.statusMessage = statusMessage
      }

      if (headers) {
        Object.entries(headers).forEach(([name, value]) => {
          response.setHeader(name, value)
        })
      }

      response.headersSent = true
      return response
    }),

    setHeader: jest.fn((name, value) => {
      if (response.headersSent) {
        throw new Error('Cannot set headers after they are sent to the client')
      }
      response.headers[name.toLowerCase()] = value
      return response
    }),

    getHeader: jest.fn(name => {
      return response.headers[name.toLowerCase()]
    }),

    getHeaders: jest.fn(() => {
      return {...response.headers}
    }),

    getHeaderNames: jest.fn(() => {
      return Object.keys(response.headers)
    }),

    hasHeader: jest.fn(name => {
      return name.toLowerCase() in response.headers
    }),

    removeHeader: jest.fn(name => {
      delete response.headers[name.toLowerCase()]
      return response
    }),

    write: jest.fn((chunk, encoding, callback) => {
      if (!response.writable) {
        const error = new Error('Cannot write to finished response')
        if (callback) callback(error)
        return false
      }

      if (!response.headersSent) {
        response.writeHead(response.statusCode)
      }

      if (typeof encoding === 'function') {
        callback = encoding
        encoding = 'utf8'
      }

      if (callback) {
        setTimeout(callback, 0)
      }

      return true
    }),

    end: jest.fn((data, encoding, callback) => {
      if (data) {
        response.write(data, encoding)
      }

      if (typeof encoding === 'function') {
        callback = encoding
      }
      if (typeof data === 'function') {
        callback = data
      }

      response.finished = true
      response.writable = false
      response.writableEnded = true

      setTimeout(() => {
        response.emit('finish')
        if (callback) callback()
      }, 0)

      return response
    }),

    setTimeout: jest.fn((msecs, callback) => {
      if (callback) {
        response.once('timeout', callback)
      }
      return response
    }),

    // Test helpers
    __simulateError: error => {
      response.emit('error', error)
    }
  })

  return response
}

const createMockServer = (options = {}) => {
  const server = createMockEventEmitter()
  const serverId = nextServerId++

  Object.assign(server, {
    // Server properties
    listening: false,
    maxHeadersCount: null,
    timeout: 120000,
    keepAliveTimeout: 5000,
    headersTimeout: 60000,
    requestTimeout: 0,

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

      server._port = port || 80
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

    close: jest.fn(callback => {
      server.listening = false

      if (callback) {
        server.once('close', callback)
      }

      setTimeout(() => {
        server.emit('close')
      }, 0)

      activeServers.delete(serverId)
      return server
    }),

    address: jest.fn(() => {
      if (!server.listening) return null
      return {
        address: server._hostname || '0.0.0.0',
        family: 'IPv4',
        port: server._port || 80
      }
    }),

    setTimeout: jest.fn((msecs, callback) => {
      server.timeout = msecs
      if (callback) {
        server.on('timeout', callback)
      }
      return server
    }),

    // Test helpers
    __simulateRequest: (requestOptions = {}, responseOptions = {}) => {
      if (!server.listening) {
        throw new Error('Server is not listening')
      }

      const req = createMockIncomingMessage({
        url: '/',
        method: 'GET',
        headers: {host: 'localhost'},
        ...requestOptions
      })

      const res = createMockServerResponse(responseOptions)

      setTimeout(() => {
        server.emit('request', req, res)
      }, 0)

      return {req, res}
    },

    __simulateError: error => {
      server.emit('error', error)
    }
  })

  activeServers.set(serverId, server)
  return server
}

const createMockClientRequest = (options = {}) => {
  const request = createMockEventEmitter()

  Object.assign(request, {
    // Request properties
    method: options.method || 'GET',
    path: options.path || '/',
    host: options.host || 'localhost',
    port: options.port || 80,

    // State
    aborted: false,
    finished: false,

    // Stream properties
    writable: true,
    writableEnded: false,

    // Methods
    write: jest.fn((chunk, encoding, callback) => {
      if (!request.writable) {
        const error = new Error('Cannot write to finished request')
        if (callback) callback(error)
        return false
      }

      if (typeof encoding === 'function') {
        callback = encoding
      }

      if (callback) {
        setTimeout(callback, 0)
      }

      return true
    }),

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

      // Simulate response
      setTimeout(() => {
        const response = createMockIncomingMessage({
          statusCode: 200,
          statusMessage: 'OK',
          headers: {'content-type': 'text/plain'}
        })

        request.emit('response', response)

        // Simulate response data
        setTimeout(() => {
          response.__simulateData('Mock response data')
          response.__simulateEnd()
        }, 0)

        if (callback) callback()
      }, 0)

      return request
    }),

    abort: jest.fn(() => {
      request.aborted = true
      request.emit('abort')
      return request
    }),

    setTimeout: jest.fn((timeout, callback) => {
      if (callback) {
        request.once('timeout', callback)
      }
      return request
    }),

    setHeader: jest.fn((name, value) => {
      // Mock implementation
      return request
    }),

    getHeader: jest.fn(name => {
      // Mock implementation
      return undefined
    }),

    removeHeader: jest.fn(name => {
      // Mock implementation
      return request
    }),

    // Test helpers
    __simulateError: error => {
      request.emit('error', error)
    },

    __simulateResponse: (responseOptions = {}) => {
      const response = createMockIncomingMessage({
        statusCode: 200,
        statusMessage: 'OK',
        ...responseOptions
      })

      setTimeout(() => {
        request.emit('response', response)
      }, 0)

      return response
    }
  })

  return request
}

const http = {
  // Server creation
  createServer: jest.fn((options, requestListener) => {
    if (typeof options === 'function') {
      requestListener = options
      options = {}
    }

    const server = createMockServer(options)

    if (requestListener) {
      server.on('request', requestListener)
    }

    return server
  }),

  // Client requests
  request: jest.fn((options, callback) => {
    if (typeof options === 'string') {
      options = new URL(options)
    }

    const req = createMockClientRequest(options)

    if (callback) {
      req.once('response', callback)
    }

    return req
  }),

  get: jest.fn((options, callback) => {
    const req = http.request(options, callback)
    req.end()
    return req
  }),

  // Classes
  Server: jest.fn(function (options, requestListener) {
    return createMockServer(options, requestListener)
  }),

  IncomingMessage: jest.fn(function (socket) {
    return createMockIncomingMessage({socket})
  }),

  ServerResponse: jest.fn(function (req) {
    return createMockServerResponse({connection: req?.connection})
  }),

  ClientRequest: jest.fn(function (options) {
    return createMockClientRequest(options)
  }),

  // Constants
  METHODS: [
    'ACL',
    'BIND',
    'CHECKOUT',
    'CONNECT',
    'COPY',
    'DELETE',
    'GET',
    'HEAD',
    'LINK',
    'LOCK',
    'M-SEARCH',
    'MERGE',
    'MKACTIVITY',
    'MKCALENDAR',
    'MKCOL',
    'MOVE',
    'NOTIFY',
    'OPTIONS',
    'PATCH',
    'POST',
    'PROPFIND',
    'PROPPATCH',
    'PURGE',
    'PUT',
    'REBIND',
    'REPORT',
    'SEARCH',
    'SOURCE',
    'SUBSCRIBE',
    'TRACE',
    'UNBIND',
    'UNLINK',
    'UNLOCK',
    'UNSUBSCRIBE'
  ],

  STATUS_CODES: {
    100: 'Continue',
    101: 'Switching Protocols',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  },

  // Global agent
  globalAgent: {
    maxSockets: Infinity,
    maxFreeSockets: 256,
    timeout: 0,
    keepAlive: false,
    keepAliveMsecs: 1000
  },

  // Test helpers
  __getActiveServers: () => new Map(activeServers),
  __clearAll: () => {
    activeServers.clear()
    nextServerId = 1
  }
}

module.exports = http
