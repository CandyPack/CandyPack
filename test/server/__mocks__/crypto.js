/**
 * Mock implementation of the crypto module for server tests
 * Provides comprehensive mocking of cryptographic operations
 */

const {createMockEventEmitter} = require('./testHelpers')

// Mock random data generation
const generateMockRandomBytes = size => {
  const bytes = Buffer.alloc(size)
  for (let i = 0; i < size; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytes
}

// Mock hash generation
const generateMockHash = (algorithm, data) => {
  // Simple mock hash based on algorithm and data
  const hashMap = {
    md5: '5d41402abc4b2a76b9719d911017c592',
    sha1: 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d',
    sha256: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    sha512:
      'f7fbba6e0636f890e56fbbf3283e524c6fa3204ae298382d624741d0dc6638326e282c41be5e4254d8820772c5518a2c5a8c0c7f7eda19594a7eb539453e1ed7'
  }

  const baseHash = hashMap[algorithm] || hashMap['sha256']

  // Modify hash based on data to make it somewhat unique
  if (data) {
    const dataStr = Buffer.isBuffer(data) ? data.toString() : String(data)
    const modifier = dataStr.length % 16
    return baseHash.substring(modifier) + baseHash.substring(0, modifier)
  }

  return baseHash
}

const createMockHash = algorithm => {
  const hash = createMockEventEmitter()
  let data = ''

  Object.assign(hash, {
    update: jest.fn((chunk, encoding = 'utf8') => {
      data += Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk)
      return hash
    }),

    digest: jest.fn(encoding => {
      const hashValue = generateMockHash(algorithm, data)

      if (encoding === 'hex') {
        return hashValue
      } else if (encoding === 'base64') {
        return Buffer.from(hashValue, 'hex').toString('base64')
      } else if (encoding) {
        return Buffer.from(hashValue, 'hex').toString(encoding)
      } else {
        return Buffer.from(hashValue, 'hex')
      }
    })
  })

  return hash
}

const createMockHmac = (algorithm, key) => {
  const hmac = createMockEventEmitter()
  let data = ''

  Object.assign(hmac, {
    update: jest.fn((chunk, encoding = 'utf8') => {
      data += Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk)
      return hmac
    }),

    digest: jest.fn(encoding => {
      // Create a mock HMAC by combining key and data
      const keyStr = Buffer.isBuffer(key) ? key.toString() : String(key)
      const combinedData = keyStr + data
      const hashValue = generateMockHash(algorithm, combinedData)

      if (encoding === 'hex') {
        return hashValue
      } else if (encoding === 'base64') {
        return Buffer.from(hashValue, 'hex').toString('base64')
      } else if (encoding) {
        return Buffer.from(hashValue, 'hex').toString(encoding)
      } else {
        return Buffer.from(hashValue, 'hex')
      }
    })
  })

  return hmac
}

const createMockCipher = (algorithm, password) => {
  const cipher = createMockEventEmitter()
  let data = Buffer.alloc(0)

  Object.assign(cipher, {
    update: jest.fn((chunk, inputEncoding, outputEncoding) => {
      const input = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, inputEncoding || 'utf8')
      data = Buffer.concat([data, input])

      // Mock encryption by XORing with a simple key
      const encrypted = Buffer.alloc(input.length)
      const key = Buffer.from(password || 'mockkey')
      for (let i = 0; i < input.length; i++) {
        encrypted[i] = input[i] ^ key[i % key.length]
      }

      return outputEncoding ? encrypted.toString(outputEncoding) : encrypted
    }),

    final: jest.fn(outputEncoding => {
      const final = Buffer.from('mockfinal')
      return outputEncoding ? final.toString(outputEncoding) : final
    }),

    setAutoPadding: jest.fn((autoPadding = true) => {
      cipher._autoPadding = autoPadding
      return cipher
    })
  })

  return cipher
}

const createMockDecipher = (algorithm, password) => {
  const decipher = createMockEventEmitter()
  let data = Buffer.alloc(0)

  Object.assign(decipher, {
    update: jest.fn((chunk, inputEncoding, outputEncoding) => {
      const input = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, inputEncoding || 'hex')
      data = Buffer.concat([data, input])

      // Mock decryption by XORing with the same key (reverse of encryption)
      const decrypted = Buffer.alloc(input.length)
      const key = Buffer.from(password || 'mockkey')
      for (let i = 0; i < input.length; i++) {
        decrypted[i] = input[i] ^ key[i % key.length]
      }

      return outputEncoding ? decrypted.toString(outputEncoding) : decrypted
    }),

    final: jest.fn(outputEncoding => {
      const final = Buffer.from('mockfinal')
      return outputEncoding ? final.toString(outputEncoding) : final
    }),

    setAutoPadding: jest.fn((autoPadding = true) => {
      decipher._autoPadding = autoPadding
      return decipher
    })
  })

  return decipher
}

const crypto = {
  // Hash functions
  createHash: jest.fn(algorithm => {
    return createMockHash(algorithm)
  }),

  createHmac: jest.fn((algorithm, key) => {
    return createMockHmac(algorithm, key)
  }),

  // Cipher functions
  createCipher: jest.fn((algorithm, password) => {
    return createMockCipher(algorithm, password)
  }),

  createDecipher: jest.fn((algorithm, password) => {
    return createMockDecipher(algorithm, password)
  }),

  createCipheriv: jest.fn((algorithm, key, iv) => {
    return createMockCipher(algorithm, key)
  }),

  createDecipheriv: jest.fn((algorithm, key, iv) => {
    return createMockDecipher(algorithm, key)
  }),

  // Random functions
  randomBytes: jest.fn((size, callback) => {
    const bytes = generateMockRandomBytes(size)

    if (callback) {
      setTimeout(() => callback(null, bytes), 0)
      return
    }

    return bytes
  }),

  randomFillSync: jest.fn((buffer, offset, size) => {
    if (!Buffer.isBuffer(buffer)) {
      throw new TypeError('buffer must be a Buffer')
    }

    offset = offset || 0
    size = size || buffer.length - offset

    const randomData = generateMockRandomBytes(size)
    randomData.copy(buffer, offset)

    return buffer
  }),

  randomFill: jest.fn((buffer, offset, size, callback) => {
    if (typeof offset === 'function') {
      callback = offset
      offset = 0
      size = buffer.length
    } else if (typeof size === 'function') {
      callback = size
      size = buffer.length - offset
    }

    setTimeout(() => {
      try {
        crypto.randomFillSync(buffer, offset, size)
        callback(null, buffer)
      } catch (error) {
        callback(error)
      }
    }, 0)
  }),

  randomInt: jest.fn((min, max, callback) => {
    if (typeof min === 'function') {
      callback = min
      min = 0
      max = 2147483647
    } else if (typeof max === 'function') {
      callback = max
      max = min
      min = 0
    }

    const randomValue = Math.floor(Math.random() * (max - min)) + min

    if (callback) {
      setTimeout(() => callback(null, randomValue), 0)
      return
    }

    return randomValue
  }),

  randomUUID: jest.fn(() => {
    // Generate a mock UUID v4
    const hex = '0123456789abcdef'
    let uuid = ''

    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-'
      } else if (i === 14) {
        uuid += '4' // Version 4
      } else if (i === 19) {
        uuid += hex[Math.floor(Math.random() * 4) + 8] // Variant bits
      } else {
        uuid += hex[Math.floor(Math.random() * 16)]
      }
    }

    return uuid
  }),

  // Key generation
  generateKeyPairSync: jest.fn((type, options = {}) => {
    const mockPrivateKey = {
      asymmetricKeyType: type,
      asymmetricKeySize: options.modulusLength || 2048,
      export: jest.fn((options = {}) => {
        if (options.format === 'pem') {
          return '-----BEGIN PRIVATE KEY-----\nMockPrivateKeyData\n-----END PRIVATE KEY-----'
        }
        return Buffer.from('mockprivatekeydata')
      })
    }

    const mockPublicKey = {
      asymmetricKeyType: type,
      asymmetricKeySize: options.modulusLength || 2048,
      export: jest.fn((options = {}) => {
        if (options.format === 'pem') {
          return '-----BEGIN PUBLIC KEY-----\nMockPublicKeyData\n-----END PUBLIC KEY-----'
        }
        return Buffer.from('mockpublickeydata')
      })
    }

    return {
      privateKey: mockPrivateKey,
      publicKey: mockPublicKey
    }
  }),

  generateKeyPair: jest.fn((type, options, callback) => {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }

    setTimeout(() => {
      try {
        const keyPair = crypto.generateKeyPairSync(type, options)
        callback(null, keyPair.publicKey, keyPair.privateKey)
      } catch (error) {
        callback(error)
      }
    }, 0)
  }),

  // Signing and verification
  createSign: jest.fn(algorithm => {
    const sign = createMockEventEmitter()
    let data = ''

    Object.assign(sign, {
      update: jest.fn((chunk, encoding = 'utf8') => {
        data += Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk)
        return sign
      }),

      sign: jest.fn((privateKey, outputEncoding) => {
        const signature = generateMockHash('sha256', data + 'signature')

        if (outputEncoding === 'hex') {
          return signature
        } else if (outputEncoding === 'base64') {
          return Buffer.from(signature, 'hex').toString('base64')
        } else if (outputEncoding) {
          return Buffer.from(signature, 'hex').toString(outputEncoding)
        } else {
          return Buffer.from(signature, 'hex')
        }
      })
    })

    return sign
  }),

  createVerify: jest.fn(algorithm => {
    const verify = createMockEventEmitter()
    let data = ''

    Object.assign(verify, {
      update: jest.fn((chunk, encoding = 'utf8') => {
        data += Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk)
        return verify
      }),

      verify: jest.fn((publicKey, signature, signatureEncoding) => {
        // Mock verification - always return true for testing
        return true
      })
    })

    return verify
  }),

  // Constants
  constants: {
    // OpenSSL constants
    OPENSSL_VERSION_NUMBER: 0x1010100f,
    SSL_OP_ALL: 0x80000bff,
    SSL_OP_NO_SSLv2: 0x01000000,
    SSL_OP_NO_SSLv3: 0x02000000,
    SSL_OP_NO_TLSv1: 0x04000000,
    SSL_OP_NO_TLSv1_1: 0x10000000,
    SSL_OP_NO_TLSv1_2: 0x08000000,

    // RSA padding
    RSA_PKCS1_PADDING: 1,
    RSA_SSLV23_PADDING: 2,
    RSA_NO_PADDING: 3,
    RSA_PKCS1_OAEP_PADDING: 4,
    RSA_X931_PADDING: 5,
    RSA_PKCS1_PSS_PADDING: 6
  },

  // Utility functions
  timingSafeEqual: jest.fn((a, b) => {
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
      throw new TypeError('Arguments must be Buffers')
    }

    if (a.length !== b.length) {
      return false
    }

    return a.equals(b)
  }),

  // Test helpers
  __setMockRandomBytes: mockFn => {
    crypto.randomBytes.mockImplementation(mockFn)
  },

  __setMockHash: (algorithm, mockHash) => {
    const originalCreateHash = crypto.createHash
    crypto.createHash.mockImplementation(alg => {
      if (alg === algorithm) {
        const hash = originalCreateHash(alg)
        hash.digest.mockReturnValue(mockHash)
        return hash
      }
      return originalCreateHash(alg)
    })
  },

  __resetMocks: () => {
    Object.values(crypto).forEach(fn => {
      if (jest.isMockFunction(fn)) {
        fn.mockClear()
      }
    })
  }
}

module.exports = crypto
