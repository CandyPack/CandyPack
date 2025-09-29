/**
 * Mock implementation of smtp-server for server tests
 */

const {createMockEventEmitter} = require('./testHelpers')

class MockSMTPServer {
  constructor(options = {}) {
    Object.assign(this, createMockEventEmitter())

    this.options = options
    this.listening = false
    this.port = null

    // Store callbacks for testing
    this.onAuth = options.onAuth
    this.onData = options.onData
    this.onAppend = options.onAppend
    this.onExpunge = options.onExpunge
    this.onCreate = options.onCreate
    this.onDelete = options.onDelete
    this.onRename = options.onRename
    this.onFetch = options.onFetch
    this.onList = options.onList
    this.onLsub = options.onLsub
    this.onMailFrom = options.onMailFrom
    this.onRcptTo = options.onRcptTo
    this.onSelect = options.onSelect
    this.onStore = options.onStore
    this.onError = options.onError
  }

  listen(port, hostname, callback) {
    if (typeof hostname === 'function') {
      callback = hostname
      hostname = undefined
    }

    this.port = port
    this.listening = true

    setTimeout(() => {
      this.emit('listening')
      if (callback) callback()
    }, 0)

    return this
  }

  close(callback) {
    this.listening = false
    this.port = null

    setTimeout(() => {
      this.emit('close')
      if (callback) callback()
    }, 0)

    return this
  }

  // Test helper methods
  simulateConnection(session = {}) {
    const mockSession = {
      remoteAddress: '127.0.0.1',
      remotePort: 12345,
      user: null,
      ...session
    }

    this.emit('connect', mockSession)
    return mockSession
  }

  simulateAuth(auth, session, callback) {
    if (this.onAuth) {
      this.onAuth(auth, session, callback)
    } else if (callback) {
      callback(null, {user: auth.username})
    }
  }

  simulateData(stream, session, callback) {
    if (this.onData) {
      this.onData(stream, session, callback)
    } else if (callback) {
      callback()
    }
  }

  simulateError(error) {
    if (this.onError) {
      this.onError(error)
    }
    this.emit('error', error)
  }
}

const SMTPServer = jest.fn().mockImplementation(options => {
  return new MockSMTPServer(options)
})

module.exports = {
  SMTPServer,
  MockSMTPServer
}
