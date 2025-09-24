// Mock global Candy first
const {mockCandy} = require('./__mocks__/globalCandy')
global.Candy = mockCandy

// Mock axios
jest.mock('axios')
const axios = require('axios')

// Mock the Client module to intercept the log function
jest.mock('../../server/src/Client', () => {
  const mockLog = jest.fn()

  // Set up the mock to return our log function
  global.Candy.setMock('server', 'Log', {
    init: jest.fn().mockReturnValue({log: mockLog})
  })

  // Require the actual module after setting up the mock
  const actualClient = jest.requireActual('../../server/src/Client')

  // Store reference to mockLog for tests
  actualClient._mockLog = mockLog

  return actualClient
})

const Client = require('../../server/src/Client')

describe('Client', () => {
  let mockLog

  beforeEach(() => {
    jest.clearAllMocks()

    // Get reference to the mock log function
    mockLog = Client._mockLog

    // Reset config
    mockCandy.setMock('core', 'Config', {
      config: {}
    })
  })

  describe('authentication', () => {
    it('should authenticate successfully with valid code', async () => {
      // Arrange
      const mockCode = 'valid-auth-code'
      const mockResponse = {
        data: {
          result: {success: true},
          data: {
            token: 'test-token-123',
            secret: 'test-secret-456'
          }
        }
      }

      const mockConfig = {config: {}}
      mockCandy.setMock('core', 'Config', mockConfig)
      axios.post.mockResolvedValue(mockResponse)

      // Act
      Client.auth(mockCode)

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockLog).toHaveBeenCalledWith('CandyPack authenticating...')
      expect(axios.post).toHaveBeenCalledWith('https://api.candypack.dev/auth', {code: mockCode})
      expect(mockConfig.config.auth).toEqual({
        token: 'test-token-123',
        secret: 'test-secret-456'
      })
      expect(mockLog).toHaveBeenCalledWith('CandyPack authenticated!')
    })

    it('should handle authentication failure with error message', async () => {
      // Arrange
      const mockCode = 'invalid-code'
      const mockError = 'Invalid authentication code'

      axios.post.mockRejectedValue({
        response: {data: mockError}
      })

      // Act
      Client.auth(mockCode)

      // Wait for promise to reject
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockLog).toHaveBeenCalledWith('CandyPack authenticating...')
      expect(axios.post).toHaveBeenCalledWith('https://api.candypack.dev/auth', {code: mockCode})
      expect(mockLog).toHaveBeenCalledWith(mockError)
    })

    it('should handle authentication failure without error message', async () => {
      // Arrange
      const mockCode = 'invalid-code'

      axios.post.mockRejectedValue({
        response: {data: null}
      })

      // Act
      Client.auth(mockCode)

      // Wait for promise to reject
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockLog).toHaveBeenCalledWith('CandyPack authenticating...')
      expect(mockLog).toHaveBeenCalledWith('CandyPack authentication failed!')
    })

    it('should handle API response with success false', async () => {
      // Arrange
      const mockCode = 'valid-code'
      const mockResponse = {
        data: {
          result: {
            success: false,
            message: 'Authentication failed on server'
          }
        }
      }

      axios.post.mockResolvedValue(mockResponse)

      // Act
      Client.auth(mockCode)

      // Wait for promise to reject
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockLog).toHaveBeenCalledWith('CandyPack authenticating...')
      expect(mockLog).toHaveBeenCalledWith('Authentication failed on server')
    })

    it('should store authentication credentials in config', async () => {
      // Arrange
      const mockCode = 'test-code'
      const mockToken = 'stored-token'
      const mockSecret = 'stored-secret'
      const mockResponse = {
        data: {
          result: {success: true},
          data: {
            token: mockToken,
            secret: mockSecret
          }
        }
      }

      const mockConfig = {config: {existingProp: 'value'}}
      mockCandy.setMock('core', 'Config', mockConfig)
      axios.post.mockResolvedValue(mockResponse)

      // Act
      Client.auth(mockCode)

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0))

      // Assert
      expect(mockConfig.config.auth).toEqual({
        token: mockToken,
        secret: mockSecret
      })
      // Verify existing config is preserved
      expect(mockConfig.config.existingProp).toBe('value')
    })
  })

  describe('API communication', () => {
    it('should make successful API call and return data', async () => {
      // Arrange
      const mockAction = 'test-action'
      const mockData = {param1: 'value1', param2: 'value2'}
      const mockResponseData = {result: 'success', info: 'test data'}
      const mockResponse = {
        data: {
          result: {success: true},
          data: mockResponseData
        }
      }

      axios.post.mockResolvedValue(mockResponse)

      // Act
      const result = await Client.call(mockAction, mockData)

      // Assert
      expect(axios.post).toHaveBeenCalledWith('https://api.candypack.dev/test-action', mockData)
      expect(result).toEqual(mockResponseData)
    })

    it('should handle API call with different endpoints', async () => {
      // Arrange
      const testCases = [
        {action: 'users', data: {id: 1}},
        {action: 'domains', data: {domain: 'example.com'}},
        {action: 'ssl/renew', data: {cert: 'test.crt'}}
      ]

      const mockResponseData = {status: 'ok'}
      const mockResponse = {
        data: {
          result: {success: true},
          data: mockResponseData
        }
      }

      axios.post.mockResolvedValue(mockResponse)

      // Act & Assert
      for (const testCase of testCases) {
        const result = await Client.call(testCase.action, testCase.data)
        expect(axios.post).toHaveBeenCalledWith(`https://api.candypack.dev/${testCase.action}`, testCase.data)
        expect(result).toEqual(mockResponseData)
      }
    })

    it('should reject when API response indicates failure', async () => {
      // Arrange
      const mockAction = 'failing-action'
      const mockData = {test: 'data'}
      const mockErrorMessage = 'API operation failed'
      const mockResponse = {
        data: {
          result: {
            success: false,
            message: mockErrorMessage
          }
        }
      }

      axios.post.mockResolvedValue(mockResponse)

      // Act & Assert
      await expect(Client.call(mockAction, mockData)).rejects.toBe(mockErrorMessage)
      expect(axios.post).toHaveBeenCalledWith('https://api.candypack.dev/failing-action', mockData)
    })

    it('should handle network errors and log response data', async () => {
      // Arrange
      const mockAction = 'network-error'
      const mockData = {test: 'data'}
      const mockErrorData = {error: 'Network timeout', code: 500}
      const mockError = {
        response: {data: mockErrorData}
      }

      axios.post.mockRejectedValue(mockError)

      // Act & Assert
      await expect(Client.call(mockAction, mockData)).rejects.toBe(mockErrorData)
      expect(mockLog).toHaveBeenCalledWith(mockErrorData)
      expect(axios.post).toHaveBeenCalledWith('https://api.candypack.dev/network-error', mockData)
    })

    it('should handle axios errors without response data', async () => {
      // Arrange
      const mockAction = 'connection-error'
      const mockData = {test: 'data'}
      const mockError = {
        response: {
          data: 'Connection refused'
        }
      }

      axios.post.mockRejectedValue(mockError)

      // Act & Assert
      await expect(Client.call(mockAction, mockData)).rejects.toBe('Connection refused')
      expect(mockLog).toHaveBeenCalledWith('Connection refused')
    })

    it('should format API requests correctly', async () => {
      // Arrange
      const mockAction = 'format-test'
      const mockData = {
        string: 'test',
        number: 123,
        boolean: true,
        object: {nested: 'value'},
        array: [1, 2, 3]
      }
      const mockResponse = {
        data: {
          result: {success: true},
          data: {received: 'ok'}
        }
      }

      axios.post.mockResolvedValue(mockResponse)

      // Act
      await Client.call(mockAction, mockData)

      // Assert
      expect(axios.post).toHaveBeenCalledWith('https://api.candypack.dev/format-test', mockData)
      expect(axios.post).toHaveBeenCalledTimes(1)
    })

    it('should handle empty response data', async () => {
      // Arrange
      const mockAction = 'empty-response'
      const mockData = {test: 'data'}
      const mockResponse = {
        data: {
          result: {success: true},
          data: null
        }
      }

      axios.post.mockResolvedValue(mockResponse)

      // Act
      const result = await Client.call(mockAction, mockData)

      // Assert
      expect(result).toBeNull()
    })

    it('should handle API calls with no data parameter', async () => {
      // Arrange
      const mockAction = 'no-data'
      const mockResponse = {
        data: {
          result: {success: true},
          data: {message: 'success'}
        }
      }

      axios.post.mockResolvedValue(mockResponse)

      // Act
      const result = await Client.call(mockAction)

      // Assert
      expect(axios.post).toHaveBeenCalledWith('https://api.candypack.dev/no-data', undefined)
      expect(result).toEqual({message: 'success'})
    })
  })
})
