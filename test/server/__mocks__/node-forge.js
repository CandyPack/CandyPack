/**
 * Mock implementation of node-forge for server tests
 */

// Mock RSA key pair
const createMockKeyPair = (keySize = 2048) => {
  return {
    privateKey: {
      n: 'mock-private-key-modulus',
      e: 'mock-private-key-exponent',
      d: 'mock-private-key-private-exponent',
      p: 'mock-private-key-prime1',
      q: 'mock-private-key-prime2',
      dP: 'mock-private-key-exponent1',
      dQ: 'mock-private-key-exponent2',
      qInv: 'mock-private-key-coefficient'
    },
    publicKey: {
      n: 'mock-public-key-modulus',
      e: 'mock-public-key-exponent'
    }
  }
}

// Mock certificate
const createMockCertificate = () => {
  return {
    version: 2,
    serialNumber: '01',
    validity: {
      notBefore: new Date(),
      notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    },
    subject: {
      attributes: [
        {name: 'commonName', value: 'example.com'},
        {name: 'organizationName', value: 'Test Organization'}
      ]
    },
    issuer: {
      attributes: [
        {name: 'commonName', value: 'Test CA'},
        {name: 'organizationName', value: 'Test CA Organization'}
      ]
    },
    extensions: [],
    publicKey: createMockKeyPair().publicKey,
    sign: jest.fn(),
    verify: jest.fn(() => true)
  }
}

const forge = {
  // PKI (Public Key Infrastructure)
  pki: {
    // RSA key generation
    rsa: {
      generateKeyPair: jest.fn((keySize, options, callback) => {
        if (typeof options === 'function') {
          callback = options
          options = {}
        }

        const keyPair = createMockKeyPair(keySize)

        if (callback) {
          setTimeout(() => callback(null, keyPair), 0)
        } else {
          return keyPair
        }
      }),

      setPublicKey: jest.fn((n, e) => {
        return {
          n: n,
          e: e,
          encrypt: jest.fn(data => 'encrypted-' + data),
          verify: jest.fn(() => true)
        }
      }),

      setPrivateKey: jest.fn((n, e, d, p, q, dP, dQ, qInv) => {
        return {
          n,
          e,
          d,
          p,
          q,
          dP,
          dQ,
          qInv,
          decrypt: jest.fn(data => data.replace('encrypted-', '')),
          sign: jest.fn(data => 'signature-' + data)
        }
      })
    },

    // Key conversion functions
    privateKeyToPem: jest.fn(privateKey => {
      return (
        '-----BEGIN PRIVATE KEY-----\n' +
        'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\n' +
        'UO4Op/DYDyBcjGh5aAFur4wEGoDf3iLnjN8V9RYubK+wJK8E4Hauv7o+8gMn\n' +
        '-----END PRIVATE KEY-----'
      )
    }),

    publicKeyToPem: jest.fn(publicKey => {
      return (
        '-----BEGIN PUBLIC KEY-----\n' +
        'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1L7VLPHCgVDuDqfw\n' +
        '2A8gXIxoeWgBbq+MBBqA394i54zfFfUWLmyvsCStBOB2rr+6PvIDJ\n' +
        '-----END PUBLIC KEY-----'
      )
    }),

    privateKeyFromPem: jest.fn(pem => {
      return createMockKeyPair().privateKey
    }),

    publicKeyFromPem: jest.fn(pem => {
      return createMockKeyPair().publicKey
    }),

    // Certificate functions
    createCertificate: jest.fn(() => {
      return createMockCertificate()
    }),

    certificateToPem: jest.fn(cert => {
      return (
        '-----BEGIN CERTIFICATE-----\n' +
        'MIIDXTCCAkWgAwIBAgIJAJC1HiIAZAiIMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV\n' +
        'BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX\n' +
        '-----END CERTIFICATE-----'
      )
    }),

    certificateFromPem: jest.fn(pem => {
      return createMockCertificate()
    }),

    // Certificate signing request
    createCertificationRequest: jest.fn(() => {
      return {
        version: 0,
        subject: {
          attributes: []
        },
        publicKey: null,
        attributes: [],
        sign: jest.fn(),
        verify: jest.fn(() => true)
      }
    }),

    certificationRequestToPem: jest.fn(csr => {
      return (
        '-----BEGIN CERTIFICATE REQUEST-----\n' +
        'MIICijCCAXICAQAwRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUx\n' +
        'ITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDCCASIwDQYJKoZIhvcN\n' +
        '-----END CERTIFICATE REQUEST-----'
      )
    }),

    certificationRequestFromPem: jest.fn(pem => {
      return {
        version: 0,
        subject: {attributes: []},
        publicKey: createMockKeyPair().publicKey,
        attributes: [],
        verify: jest.fn(() => true)
      }
    })
  },

  // Message digests
  md: {
    sha1: {
      create: jest.fn(() => ({
        update: jest.fn(),
        digest: jest.fn(() => ({
          toHex: jest.fn(() => 'mock-sha1-hash'),
          bytes: jest.fn(() => 'mock-sha1-bytes')
        }))
      }))
    },

    sha256: {
      create: jest.fn(() => ({
        update: jest.fn(),
        digest: jest.fn(() => ({
          toHex: jest.fn(() => 'mock-sha256-hash'),
          bytes: jest.fn(() => 'mock-sha256-bytes')
        }))
      }))
    },

    sha512: {
      create: jest.fn(() => ({
        update: jest.fn(),
        digest: jest.fn(() => ({
          toHex: jest.fn(() => 'mock-sha512-hash'),
          bytes: jest.fn(() => 'mock-sha512-bytes')
        }))
      }))
    },

    md5: {
      create: jest.fn(() => ({
        update: jest.fn(),
        digest: jest.fn(() => ({
          toHex: jest.fn(() => 'mock-md5-hash'),
          bytes: jest.fn(() => 'mock-md5-bytes')
        }))
      }))
    }
  },

  // HMAC
  hmac: {
    create: jest.fn(() => ({
      start: jest.fn(),
      update: jest.fn(),
      digest: jest.fn(() => ({
        toHex: jest.fn(() => 'mock-hmac-hash'),
        bytes: jest.fn(() => 'mock-hmac-bytes')
      }))
    }))
  },

  // Random number generation
  random: {
    getBytesSync: jest.fn(count => {
      return Array(count)
        .fill(0)
        .map(() => String.fromCharCode(Math.floor(Math.random() * 256)))
        .join('')
    }),

    getBytes: jest.fn((count, callback) => {
      const bytes = Array(count)
        .fill(0)
        .map(() => String.fromCharCode(Math.floor(Math.random() * 256)))
        .join('')
      setTimeout(() => callback(null, bytes), 0)
    })
  },

  // Utilities
  util: {
    encode64: jest.fn(data => {
      return Buffer.from(data).toString('base64')
    }),

    decode64: jest.fn(data => {
      return Buffer.from(data, 'base64').toString()
    }),

    bytesToHex: jest.fn(bytes => {
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    }),

    hexToBytes: jest.fn(hex => {
      const bytes = []
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16))
      }
      return bytes
    }),

    createBuffer: jest.fn(data => {
      return {
        data: data || '',
        length: function () {
          return this.data.length
        },
        at: function (i) {
          return this.data.charCodeAt(i)
        },
        put: function (data) {
          this.data += data
        },
        putByte: function (byte) {
          this.data += String.fromCharCode(byte)
        },
        putBytes: function (bytes) {
          this.data += bytes
        },
        bytes: function () {
          return this.data
        },
        toHex: function () {
          return forge.util.bytesToHex(this.data)
        }
      }
    })
  },

  // ASN.1 utilities
  asn1: {
    create: jest.fn((tagClass, type, constructed, value) => {
      return {
        tagClass: tagClass,
        type: type,
        constructed: constructed,
        value: value || []
      }
    }),

    toDer: jest.fn(obj => {
      return forge.util.createBuffer('mock-der-data')
    }),

    fromDer: jest.fn(der => {
      return {
        tagClass: 0,
        type: 16,
        constructed: true,
        value: []
      }
    })
  }
}

module.exports = forge
