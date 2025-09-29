/**
 * Mock implementation of http-proxy module for server tests
 */

const {createMockEventEmitter} = require('./testHelpers')

const createMockProxyServer = (options = {}) => {
  const proxy = Object.assign(createMockEventEmitter(), {
    options: options,

    // Main proxy methods
    web: jest.fn((req, res, options, callback) => {
      // Simulate successful proxying
      setTimeout(() => {
        if (callback) callback()
      }, 0)
    }),

    ws: jest.fn((req, socket, head, options, callback) => {
      // Simulate WebSocket proxying
      setTimeout(() => {
        if (callback) callback()
      }, 0)
    }),

    listen: jest.fn((port, hostname, callback) => {
      if (typeof hostname === 'function') {
        callback = hostname
        hostname = undefined
      }

      setTimeout(() => {
        if (callback) callback()
      }, 0)

      return proxy
    }),

    close: jest.fn(callback => {
      setTimeout(() => {
        if (callback) callback()
      }, 0)
    }),

    // Test helper methods
    simulateProxyReq: (proxyReq, req, res, options) => {
      proxy.emit('proxyReq', proxyReq, req, res, options)
    },

    simulateProxyRes: (proxyRes, req, res) => {
      proxy.emit('proxyRes', proxyRes, req, res)
    },

    simulateError: (error, req, res, target) => {
      proxy.emit('error', error, req, res, target)
    },

    simulateOpen: proxySocket => {
      proxy.emit('open', proxySocket)
    },

    simulateClose: (res, socket, head) => {
      proxy.emit('close', res, socket, head)
    }
  })

  return proxy
}

const httpProxy = {
  createProxyServer: jest.fn((options = {}) => {
    return createMockProxyServer(options)
  }),

  createServer: jest.fn((options = {}, requestListener) => {
    if (typeof options === 'function') {
      requestListener = options
      options = {}
    }

    const proxy = createMockProxyServer(options)

    // Add server-like methods
    proxy.listen = jest.fn((port, hostname, callback) => {
      if (typeof hostname === 'function') {
        callback = hostname
        hostname = undefined
      }

      setTimeout(() => {
        proxy.emit('listening')
        if (callback) callback()
      }, 0)

      return proxy
    })

    return proxy
  }),

  // Test helpers
  __createMockProxyServer: createMockProxyServer
}

module.exports = httpProxy
