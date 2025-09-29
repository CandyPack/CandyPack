/**
 * Mock implementation of sqlite3 for server tests
 */

const {createMockEventEmitter} = require('./testHelpers')

class MockDatabase {
  constructor(filename, mode, callback) {
    Object.assign(this, createMockEventEmitter())

    if (typeof mode === 'function') {
      callback = mode
      mode = undefined
    }

    this.filename = filename
    this.mode = mode
    this.open = true
    this.statements = new Map()
    this.data = new Map() // Mock data storage

    // Simulate async database opening
    setTimeout(() => {
      if (callback) {
        callback(null) // No error
      }
      this.emit('open')
    }, 0)
  }

  serialize(callback) {
    if (callback) {
      callback()
    }
    return this
  }

  parallelize(callback) {
    if (callback) {
      callback()
    }
    return this
  }

  run(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params
      params = []
    }

    // Mock SQL execution
    const result = {
      lastID: Math.floor(Math.random() * 1000) + 1,
      changes: 1
    }

    // Store mock data for SELECT queries
    if (sql.includes('INSERT INTO')) {
      const tableName = this.extractTableName(sql)
      if (!this.data.has(tableName)) {
        this.data.set(tableName, [])
      }
      this.data.get(tableName).push({id: result.lastID, ...params})
    }

    setTimeout(() => {
      if (callback) {
        callback.call(result, null)
      }
      this.emit('run', sql, params)
    }, 0)

    return this
  }

  get(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params
      params = []
    }

    let row = null

    // Mock data retrieval
    if (sql.includes('SELECT')) {
      const tableName = this.extractTableName(sql)
      const tableData = this.data.get(tableName) || []

      if (tableData.length > 0) {
        row = tableData[0] // Return first row
      }
    }

    setTimeout(() => {
      if (callback) {
        callback(null, row)
      }
      this.emit('get', sql, params, row)
    }, 0)

    return this
  }

  all(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params
      params = []
    }

    let rows = []

    // Mock data retrieval
    if (sql.includes('SELECT')) {
      const tableName = this.extractTableName(sql)
      rows = this.data.get(tableName) || []
    }

    setTimeout(() => {
      if (callback) {
        callback(null, rows)
      }
      this.emit('all', sql, params, rows)
    }, 0)

    return this
  }

  each(sql, params, rowCallback, completeCallback) {
    if (typeof params === 'function') {
      completeCallback = rowCallback
      rowCallback = params
      params = []
    }

    let rows = []
    let count = 0

    // Mock data retrieval
    if (sql.includes('SELECT')) {
      const tableName = this.extractTableName(sql)
      rows = this.data.get(tableName) || []
      count = rows.length
    }

    setTimeout(() => {
      // Call row callback for each row
      rows.forEach(row => {
        if (rowCallback) {
          rowCallback(null, row)
        }
      })

      // Call complete callback
      if (completeCallback) {
        completeCallback(null, count)
      }

      this.emit('each', sql, params, count)
    }, 0)

    return this
  }

  prepare(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params
      params = []
    }

    const statement = new MockStatement(sql, params, this)
    const statementId = Math.random().toString(36)
    this.statements.set(statementId, statement)

    setTimeout(() => {
      if (callback) {
        callback(null, statement)
      }
      this.emit('prepare', sql, params)
    }, 0)

    return statement
  }

  exec(sql, callback) {
    setTimeout(() => {
      if (callback) {
        callback(null)
      }
      this.emit('exec', sql)
    }, 0)

    return this
  }

  close(callback) {
    this.open = false

    setTimeout(() => {
      if (callback) {
        callback(null)
      }
      this.emit('close')
    }, 0)

    return this
  }

  // Helper method to extract table name from SQL
  extractTableName(sql) {
    const match = sql.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i)
    return match ? match[1] : 'unknown'
  }

  // Test helper methods
  setMockData(tableName, data) {
    this.data.set(tableName, data)
  }

  getMockData(tableName) {
    return this.data.get(tableName) || []
  }

  clearMockData() {
    this.data.clear()
  }
}

class MockStatement {
  constructor(sql, params, database) {
    Object.assign(this, createMockEventEmitter())

    this.sql = sql
    this.params = params
    this.database = database
    this.finalized = false
  }

  bind(params, callback) {
    this.params = Array.isArray(params) ? params : [params]

    setTimeout(() => {
      if (callback) {
        callback(null)
      }
      this.emit('bind', params)
    }, 0)

    return this
  }

  reset(callback) {
    this.params = []

    setTimeout(() => {
      if (callback) {
        callback(null)
      }
      this.emit('reset')
    }, 0)

    return this
  }

  finalize(callback) {
    this.finalized = true

    setTimeout(() => {
      if (callback) {
        callback(null)
      }
      this.emit('finalize')
    }, 0)

    return this
  }

  run(params, callback) {
    if (typeof params === 'function') {
      callback = params
      params = this.params
    }

    const result = {
      lastID: Math.floor(Math.random() * 1000) + 1,
      changes: 1
    }

    setTimeout(() => {
      if (callback) {
        callback.call(result, null)
      }
      this.emit('run', params)
    }, 0)

    return this
  }

  get(params, callback) {
    if (typeof params === 'function') {
      callback = params
      params = this.params
    }

    const row = {id: 1, data: 'mock'}

    setTimeout(() => {
      if (callback) {
        callback(null, row)
      }
      this.emit('get', params, row)
    }, 0)

    return this
  }

  all(params, callback) {
    if (typeof params === 'function') {
      callback = params
      params = this.params
    }

    const rows = [{id: 1, data: 'mock'}]

    setTimeout(() => {
      if (callback) {
        callback(null, rows)
      }
      this.emit('all', params, rows)
    }, 0)

    return this
  }

  each(params, rowCallback, completeCallback) {
    if (typeof params === 'function') {
      completeCallback = rowCallback
      rowCallback = params
      params = this.params
    }

    const rows = [{id: 1, data: 'mock'}]

    setTimeout(() => {
      rows.forEach(row => {
        if (rowCallback) {
          rowCallback(null, row)
        }
      })

      if (completeCallback) {
        completeCallback(null, rows.length)
      }

      this.emit('each', params, rows.length)
    }, 0)

    return this
  }
}

// Mock constants
const OPEN_READONLY = 1
const OPEN_READWRITE = 2
const OPEN_CREATE = 4
const OPEN_FULLMUTEX = 16
const OPEN_SHAREDCACHE = 32
const OPEN_PRIVATECACHE = 64

const sqlite3 = {
  Database: MockDatabase,
  Statement: MockStatement,

  // Constants
  OPEN_READONLY,
  OPEN_READWRITE,
  OPEN_CREATE,
  OPEN_FULLMUTEX,
  OPEN_SHAREDCACHE,
  OPEN_PRIVATECACHE,

  // Verbose mode
  verbose: jest.fn(() => ({
    Database: MockDatabase,
    Statement: MockStatement,
    OPEN_READONLY,
    OPEN_READWRITE,
    OPEN_CREATE,
    OPEN_FULLMUTEX,
    OPEN_SHAREDCACHE,
    OPEN_PRIVATECACHE
  }))
}

module.exports = sqlite3
