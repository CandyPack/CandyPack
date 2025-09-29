/**
 * Mock implementation of the child_process module for server tests
 * Provides comprehensive mocking of process spawning and management
 */

const {createMockEventEmitter} = require('./testHelpers')
const {createMockChildProcess} = require('./testFactories')

// Track active child processes
const activeProcesses = new Map()
let nextPid = 1000

const createMockChildProcessInstance = (command, args = [], options = {}) => {
  const pid = nextPid++
  const child = createMockEventEmitter()

  Object.assign(child, {
    // Process properties
    pid,
    killed: false,
    connected: options.stdio !== 'ignore',
    exitCode: null,
    signalCode: null,
    spawnfile: command,
    spawnargs: [command, ...args],

    // Stdio streams
    stdin: options.stdio === 'ignore' ? null : createMockWritableStream(),
    stdout: options.stdio === 'ignore' ? null : createMockReadableStream(),
    stderr: options.stdio === 'ignore' ? null : createMockReadableStream(),

    // Methods
    kill: jest.fn((signal = 'SIGTERM') => {
      if (child.killed) return false

      child.killed = true
      child.signalCode = signal

      // Simulate process termination
      setTimeout(() => {
        if (signal === 'SIGKILL') {
          child.exitCode = null
          child.signalCode = 'SIGKILL'
        } else {
          child.exitCode = signal === 'SIGTERM' ? 0 : 1
        }

        child.emit('exit', child.exitCode, child.signalCode)
        child.emit('close', child.exitCode, child.signalCode)

        activeProcesses.delete(pid)
      }, 0)

      return true
    }),

    send: jest.fn((message, sendHandle, options, callback) => {
      if (!child.connected) {
        const error = new Error('Channel closed')
        if (callback) callback(error)
        return false
      }

      if (typeof options === 'function') {
        callback = options
        options = {}
      }
      if (typeof sendHandle === 'function') {
        callback = sendHandle
        sendHandle = undefined
        options = {}
      }

      // Simulate message sending
      setTimeout(() => {
        if (callback) callback(null)
      }, 0)

      return true
    }),

    disconnect: jest.fn(() => {
      if (child.connected) {
        child.connected = false
        child.emit('disconnect')
      }
    }),

    ref: jest.fn(() => child),
    unref: jest.fn(() => child),

    // Test helpers
    __simulateExit: (code = 0, signal = null) => {
      child.exitCode = code
      child.signalCode = signal
      child.killed = !!signal

      setTimeout(() => {
        child.emit('exit', code, signal)
        child.emit('close', code, signal)
        activeProcesses.delete(pid)
      }, 0)
    },

    __simulateError: error => {
      setTimeout(() => {
        child.emit('error', error)
      }, 0)
    },

    __simulateStdout: data => {
      if (child.stdout) {
        child.stdout.__simulateData(data)
      }
    },

    __simulateStderr: data => {
      if (child.stderr) {
        child.stderr.__simulateData(data)
      }
    },

    __simulateMessage: message => {
      if (child.connected) {
        setTimeout(() => {
          child.emit('message', message)
        }, 0)
      }
    }
  })

  activeProcesses.set(pid, child)
  return child
}

const createMockReadableStream = () => {
  const stream = createMockEventEmitter()

  Object.assign(stream, {
    readable: true,
    destroyed: false,

    read: jest.fn(),
    setEncoding: jest.fn(encoding => {
      stream._encoding = encoding
      return stream
    }),
    pause: jest.fn(() => {
      stream._paused = true
      return stream
    }),
    resume: jest.fn(() => {
      stream._paused = false
      return stream
    }),
    pipe: jest.fn(destination => {
      return destination
    }),
    unpipe: jest.fn(destination => {
      return stream
    }),
    destroy: jest.fn(error => {
      stream.destroyed = true
      if (error) {
        stream.emit('error', error)
      }
      stream.emit('close')
      return stream
    }),

    // Test helpers
    __simulateData: data => {
      if (!stream.destroyed && stream.readable) {
        stream.emit('data', Buffer.isBuffer(data) ? data : Buffer.from(data))
      }
    },

    __simulateEnd: () => {
      if (!stream.destroyed) {
        stream.emit('end')
      }
    },

    __simulateError: error => {
      stream.emit('error', error)
    }
  })

  return stream
}

const createMockWritableStream = () => {
  const stream = createMockEventEmitter()

  Object.assign(stream, {
    writable: true,
    destroyed: false,

    write: jest.fn((chunk, encoding, callback) => {
      if (stream.destroyed || !stream.writable) {
        const error = new Error('Cannot write to destroyed stream')
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

    end: jest.fn((chunk, encoding, callback) => {
      if (chunk) {
        stream.write(chunk, encoding)
      }

      if (typeof encoding === 'function') {
        callback = encoding
      }
      if (typeof chunk === 'function') {
        callback = chunk
      }

      stream.writable = false

      setTimeout(() => {
        stream.emit('finish')
        if (callback) callback()
      }, 0)

      return stream
    }),

    destroy: jest.fn(error => {
      stream.destroyed = true
      stream.writable = false

      if (error) {
        stream.emit('error', error)
      }
      stream.emit('close')
      return stream
    }),

    // Test helpers
    __simulateError: error => {
      stream.emit('error', error)
    }
  })

  return stream
}

const child_process = {
  // Process spawning
  spawn: jest.fn((command, args = [], options = {}) => {
    const child = createMockChildProcessInstance(command, args, options)

    // Simulate spawn delay
    setTimeout(() => {
      if (options.detached) {
        child.unref()
      }

      child.emit('spawn')
    }, 0)

    return child
  }),

  exec: jest.fn((command, options, callback) => {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const child = createMockChildProcessInstance('/bin/sh', ['-c', command], options)

    // Simulate execution
    setTimeout(() => {
      const stdout = 'Mock stdout output'
      const stderr = ''
      const error = null

      if (callback) {
        callback(error, stdout, stderr)
      }

      child.__simulateExit(0)
    }, 0)

    return child
  }),

  execFile: jest.fn((file, args = [], options, callback) => {
    if (typeof args === 'function') {
      callback = args
      args = []
      options = {}
    } else if (typeof options === 'function') {
      callback = options
      options = {}
    }

    const child = createMockChildProcessInstance(file, args, options)

    // Simulate execution
    setTimeout(() => {
      const stdout = 'Mock execFile output'
      const stderr = ''
      const error = null

      if (callback) {
        callback(error, stdout, stderr)
      }

      child.__simulateExit(0)
    }, 0)

    return child
  }),

  fork: jest.fn((modulePath, args = [], options = {}) => {
    const child = createMockChildProcessInstance(process.execPath, [modulePath, ...args], {
      ...options,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    })

    child.connected = true

    // Simulate fork delay
    setTimeout(() => {
      child.emit('spawn')
    }, 0)

    return child
  }),

  execSync: jest.fn((command, options = {}) => {
    // Simulate synchronous execution
    if (options.encoding === 'buffer' || !options.encoding) {
      return Buffer.from('Mock execSync output')
    }
    return 'Mock execSync output'
  }),

  execFileSync: jest.fn((file, args = [], options = {}) => {
    // Simulate synchronous file execution
    if (options.encoding === 'buffer' || !options.encoding) {
      return Buffer.from('Mock execFileSync output')
    }
    return 'Mock execFileSync output'
  }),

  spawnSync: jest.fn((command, args = [], options = {}) => {
    return {
      pid: nextPid++,
      output: [null, Buffer.from('Mock stdout'), Buffer.from('Mock stderr')],
      stdout: Buffer.from('Mock stdout'),
      stderr: Buffer.from('Mock stderr'),
      status: 0,
      signal: null,
      error: null
    }
  }),

  // Classes
  ChildProcess: jest.fn(function () {
    return createMockChildProcessInstance('mock-process')
  }),

  // Test helpers
  __getActiveProcesses: () => new Map(activeProcesses),
  __clearAll: () => {
    activeProcesses.clear()
    nextPid = 1000
  },

  __setNextPid: pid => {
    nextPid = pid
  }
}

module.exports = child_process
