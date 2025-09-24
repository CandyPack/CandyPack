/**
 * Mock implementation of bcrypt for server tests
 */

const bcrypt = {
  hash: jest.fn((password, rounds, callback) => {
    const mockHash = `$2b$${rounds}$mocksalt${password.substring(0, 10).padEnd(10, '0')}`

    if (callback) {
      setTimeout(() => callback(null, mockHash), 0)
    } else {
      return Promise.resolve(mockHash)
    }
  }),

  hashSync: jest.fn((password, rounds) => {
    return `$2b$${rounds}$mocksalt${password.substring(0, 10).padEnd(10, '0')}`
  }),

  compare: jest.fn((password, hash, callback) => {
    // Simple mock comparison - check if password is in the hash
    const isValid = hash.includes(password.substring(0, 10).padEnd(10, '0'))

    if (callback) {
      setTimeout(() => callback(null, isValid), 0)
    } else {
      return Promise.resolve(isValid)
    }
  }),

  compareSync: jest.fn((password, hash) => {
    return hash.includes(password.substring(0, 10).padEnd(10, '0'))
  }),

  genSalt: jest.fn((rounds, callback) => {
    const mockSalt = `$2b$${rounds}$mocksalt1234567890123456`

    if (callback) {
      setTimeout(() => callback(null, mockSalt), 0)
    } else {
      return Promise.resolve(mockSalt)
    }
  }),

  genSaltSync: jest.fn(rounds => {
    return `$2b$${rounds}$mocksalt1234567890123456`
  })
}

module.exports = bcrypt
