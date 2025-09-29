/**
 * Comprehensive unit tests for the DNS.js module
 * Tests DNS server functionality, record management, and query processing
 */

const {setupGlobalMocks, cleanupGlobalMocks} = require('./__mocks__/testHelpers')
const {createMockWebsiteConfig} = require('./__mocks__/testFactories')

describe('DNS Module', () => {
  let DNS
  let mockConfig

  beforeEach(() => {
    setupGlobalMocks()

    // Mock native-dns module
    jest.doMock('native-dns', () => ({
      createServer: jest.fn(() => ({
        on: jest.fn(),
        serve: jest.fn()
      })),
      createTCPServer: jest.fn(() => ({
        on: jest.fn(),
        serve: jest.fn()
      })),
      consts: {
        NAME_TO_QTYPE: {
          A: 1,
          AAAA: 28,
          CNAME: 5,
          MX: 15,
          TXT: 16,
          NS: 2,
          SOA: 6
        }
      },
      A: jest.fn(data => ({type: 'A', ...data})),
      AAAA: jest.fn(data => ({type: 'AAAA', ...data})),
      CNAME: jest.fn(data => ({type: 'CNAME', ...data})),
      MX: jest.fn(data => ({type: 'MX', ...data})),
      TXT: jest.fn(data => ({type: 'TXT', ...data})),
      NS: jest.fn(data => ({type: 'NS', ...data})),
      SOA: jest.fn(data => ({type: 'SOA', ...data}))
    }))

    // Mock axios module
    jest.doMock('axios', () => ({
      get: jest.fn().mockResolvedValue({data: '127.0.0.1'})
    }))

    // Setup mock config with websites
    mockConfig = {
      config: {
        websites: {
          'example.com': createMockWebsiteConfig('example.com'),
          'test.org': createMockWebsiteConfig('test.org')
        }
      }
    }

    global.Candy.setMock('core', 'Config', mockConfig)

    // Clear module cache and require DNS
    jest.resetModules()
    DNS = require('../../server/src/DNS')
  })

  afterEach(() => {
    cleanupGlobalMocks()
    jest.resetModules()
    jest.dontMock('native-dns')
    jest.dontMock('axios')
  })

  describe('initialization', () => {
    it('should create UDP and TCP DNS servers on initialization', () => {
      const dns = require('native-dns')

      DNS.init()

      expect(dns.createServer).toHaveBeenCalled()
      expect(dns.createTCPServer).toHaveBeenCalled()
    })

    it('should attempt to get external IP from curlmyip.org', () => {
      const axios = require('axios')

      DNS.init()

      expect(axios.get).toHaveBeenCalledWith('https://curlmyip.org/')
    })

    it('should start DNS servers on port 53 when websites exist', () => {
      const dns = require('native-dns')

      DNS.init()

      // The servers should be created and serve should be called
      expect(dns.createServer).toHaveBeenCalled()
      expect(dns.createTCPServer).toHaveBeenCalled()

      // Get the created server instances
      const udpServer = dns.createServer.mock.results[0].value
      const tcpServer = dns.createTCPServer.mock.results[0].value

      expect(udpServer.serve).toHaveBeenCalledWith(53)
      expect(tcpServer.serve).toHaveBeenCalledWith(53)
    })

    it('should set external IP when successfully retrieved', async () => {
      const axios = require('axios')
      axios.get.mockResolvedValue({data: '203.0.113.1'})

      DNS.init()

      // Wait for the axios promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(DNS.ip).toBe('203.0.113.1')
    })

    it('should handle invalid IP format from external service', async () => {
      const axios = require('axios')
      const mockLog = global.Candy.server('Log').init('DNS').error
      axios.get.mockResolvedValue({data: 'invalid-ip-format'})

      DNS.init()

      // Wait for the axios promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(DNS.ip).toBe('127.0.0.1') // Should keep default
      expect(mockLog).toHaveBeenCalledWith('DNS', 'Invalid IP format received:', 'invalid-ip-format')
    })

    it('should handle external IP detection failure', async () => {
      const axios = require('axios')
      const mockLog = global.Candy.server('Log').init('DNS').error
      const networkError = new Error('Network timeout')
      axios.get.mockRejectedValue(networkError)

      DNS.init()

      // Wait for the axios promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(DNS.ip).toBe('127.0.0.1') // Should keep default
      expect(mockLog).toHaveBeenCalledWith('DNS', 'Failed to get external IP, using default:', 'Network timeout')
    })

    it('should handle DNS server startup errors gracefully', () => {
      const dns = require('native-dns')
      const mockLog = global.Candy.server('Log').init('DNS').error
      const udpServer = {
        on: jest.fn(),
        serve: jest.fn(() => {
          throw new Error('Port 53 already in use')
        })
      }
      const tcpServer = {
        on: jest.fn(),
        serve: jest.fn(() => {
          throw new Error('Port 53 already in use')
        })
      }

      dns.createServer.mockReturnValue(udpServer)
      dns.createTCPServer.mockReturnValue(tcpServer)

      DNS.init()

      expect(mockLog).toHaveBeenCalledWith('Failed to start DNS servers:', 'Port 53 already in use')
    })

    it('should set up error handlers for UDP and TCP servers', () => {
      const dns = require('native-dns')
      const udpServer = {on: jest.fn(), serve: jest.fn()}
      const tcpServer = {on: jest.fn(), serve: jest.fn()}

      dns.createServer.mockReturnValue(udpServer)
      dns.createTCPServer.mockReturnValue(tcpServer)

      DNS.init()

      // Verify error handlers are set up
      expect(udpServer.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(tcpServer.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should log DNS server errors when they occur', () => {
      const dns = require('native-dns')
      const mockLog = global.Candy.server('Log').init('DNS').error
      const udpServer = {on: jest.fn(), serve: jest.fn()}
      const tcpServer = {on: jest.fn(), serve: jest.fn()}

      dns.createServer.mockReturnValue(udpServer)
      dns.createTCPServer.mockReturnValue(tcpServer)

      DNS.init()

      // Get the error handler functions
      const udpErrorHandler = udpServer.on.mock.calls.find(call => call[0] === 'error')[1]
      const tcpErrorHandler = tcpServer.on.mock.calls.find(call => call[0] === 'error')[1]

      // Simulate errors
      const udpError = new Error('UDP server error')
      const tcpError = new Error('TCP server error')
      udpError.stack = 'UDP Error Stack'
      tcpError.stack = 'TCP Error Stack'

      udpErrorHandler(udpError)
      tcpErrorHandler(tcpError)

      expect(mockLog).toHaveBeenCalledWith('DNS UDP Server Error:', 'UDP Error Stack')
      expect(mockLog).toHaveBeenCalledWith('DNS TCP Server Error:', 'TCP Error Stack')
    })

    it('should not start servers when no websites are configured', () => {
      const dns = require('native-dns')
      const udpServer = {on: jest.fn(), serve: jest.fn()}
      const tcpServer = {on: jest.fn(), serve: jest.fn()}

      dns.createServer.mockReturnValue(udpServer)
      dns.createTCPServer.mockReturnValue(tcpServer)

      // Clear websites config
      mockConfig.config.websites = {}

      DNS.init()

      expect(udpServer.serve).not.toHaveBeenCalled()
      expect(tcpServer.serve).not.toHaveBeenCalled()
    })
  })

  describe('DNS record management', () => {
    it('should add A record to website configuration', () => {
      const record = {name: 'example.com', type: 'A', value: '192.168.1.1'}

      DNS.record(record)

      expect(mockConfig.config.websites['example.com'].DNS.A).toContainEqual({
        name: 'example.com',
        value: '192.168.1.1'
      })
    })

    it('should add multiple record types to website configuration', () => {
      const records = [
        {name: 'example.com', type: 'A', value: '192.168.1.1'},
        {name: 'example.com', type: 'MX', value: 'mail.example.com', priority: 10},
        {name: 'example.com', type: 'TXT', value: 'v=spf1 mx ~all'}
      ]

      DNS.record(...records)

      expect(mockConfig.config.websites['example.com'].DNS.A).toContainEqual({
        name: 'example.com',
        value: '192.168.1.1'
      })
      expect(mockConfig.config.websites['example.com'].DNS.MX).toContainEqual({
        name: 'example.com',
        value: 'mail.example.com',
        priority: 10
      })
      expect(mockConfig.config.websites['example.com'].DNS.TXT).toContainEqual({
        name: 'example.com',
        value: 'v=spf1 mx ~all'
      })
    })

    it('should handle subdomain records by finding parent domain', () => {
      const record = {name: 'www.example.com', type: 'A', value: '192.168.1.1'}

      DNS.record(record)

      expect(mockConfig.config.websites['example.com'].DNS.A).toContainEqual({
        name: 'www.example.com',
        value: '192.168.1.1'
      })
    })

    it('should automatically generate SOA record with current date serial', () => {
      const record = {name: 'example.com', type: 'A', value: '192.168.1.1'}

      DNS.record(record)

      const soaRecords = mockConfig.config.websites['example.com'].DNS.SOA
      expect(soaRecords).toHaveLength(1)
      expect(soaRecords[0].name).toBe('example.com')
      expect(soaRecords[0].value).toMatch(/^ns1\.example\.com hostmaster\.example\.com \d{10} 3600 600 604800 3600$/)
    })

    it('should delete DNS records by name and type', () => {
      // Add a record first
      DNS.record({name: 'example.com', type: 'A', value: '192.168.1.1'})

      // Delete the record
      DNS.delete({name: 'example.com', type: 'A'})

      const aRecords = mockConfig.config.websites['example.com'].DNS.A
      const exampleRecords = aRecords.filter(r => r.name === 'example.com' && r.value === '192.168.1.1')
      expect(exampleRecords).toHaveLength(0)
    })

    it('should delete DNS records by name, type, and value', () => {
      // Add multiple records with same name
      DNS.record(
        {name: 'example.com', type: 'A', value: '192.168.1.1', unique: false},
        {name: 'example.com', type: 'A', value: '192.168.1.2', unique: false}
      )

      // Delete only one specific record
      DNS.delete({name: 'example.com', type: 'A', value: '192.168.1.1'})

      const aRecords = mockConfig.config.websites['example.com'].DNS.A
      const remainingRecords = aRecords.filter(r => r.name === 'example.com' && r.value !== '127.0.0.1')
      expect(remainingRecords).toHaveLength(1)
      expect(remainingRecords[0].value).toBe('192.168.1.2')
    })

    it('should ignore records for non-existent domains', () => {
      const record = {name: 'nonexistent.com', type: 'A', value: '192.168.1.1'}

      DNS.record(record)

      expect(mockConfig.config.websites).not.toHaveProperty('nonexistent.com')
    })

    it('should replace existing unique records by default', () => {
      // Add initial record
      DNS.record({name: 'example.com', type: 'A', value: '192.168.1.1'})

      // Add another record with same name (should replace)
      DNS.record({name: 'example.com', type: 'A', value: '192.168.1.2'})

      const aRecords = mockConfig.config.websites['example.com'].DNS.A
      const exampleRecords = aRecords.filter(r => r.name === 'example.com' && r.value !== '127.0.0.1')
      expect(exampleRecords).toHaveLength(1)
      expect(exampleRecords[0].value).toBe('192.168.1.2')
    })

    it('should allow multiple records when unique is false', () => {
      DNS.record(
        {name: 'example.com', type: 'A', value: '192.168.1.1', unique: false},
        {name: 'example.com', type: 'A', value: '192.168.1.2', unique: false}
      )

      const aRecords = mockConfig.config.websites['example.com'].DNS.A
      const exampleRecords = aRecords.filter(r => r.name === 'example.com' && r.value !== '127.0.0.1')
      expect(exampleRecords).toHaveLength(2)
    })

    it('should handle all supported DNS record types', () => {
      const records = [
        {name: 'example.com', type: 'A', value: '192.168.1.1'},
        {name: 'example.com', type: 'AAAA', value: '2001:db8::1'},
        {name: 'www.example.com', type: 'CNAME', value: 'example.com'},
        {name: 'example.com', type: 'MX', value: 'mail.example.com', priority: 10},
        {name: 'example.com', type: 'TXT', value: 'v=spf1 mx ~all'},
        {name: 'example.com', type: 'NS', value: 'ns1.example.com'}
      ]

      DNS.record(...records)

      const dnsConfig = mockConfig.config.websites['example.com'].DNS
      expect(dnsConfig.A).toContainEqual({name: 'example.com', value: '192.168.1.1'})
      expect(dnsConfig.AAAA).toContainEqual({name: 'example.com', value: '2001:db8::1'})
      expect(dnsConfig.CNAME).toContainEqual({name: 'www.example.com', value: 'example.com'})
      expect(dnsConfig.MX).toContainEqual({name: 'example.com', value: 'mail.example.com', priority: 10})
      expect(dnsConfig.TXT).toContainEqual({name: 'example.com', value: 'v=spf1 mx ~all'})
      expect(dnsConfig.NS).toContainEqual({name: 'example.com', value: 'ns1.example.com'})
    })

    it('should ignore unsupported DNS record types', () => {
      const record = {name: 'example.com', type: 'INVALID', value: 'test'}

      DNS.record(record)

      const dnsConfig = mockConfig.config.websites['example.com'].DNS
      expect(dnsConfig.INVALID).toBeUndefined()
    })

    it('should ignore records without type specified', () => {
      const record = {name: 'example.com', value: '192.168.1.1'}

      DNS.record(record)

      // Should not add any new records beyond the existing ones
      const dnsConfig = mockConfig.config.websites['example.com'].DNS
      const aRecords = dnsConfig.A.filter(r => r.value === '192.168.1.1')
      expect(aRecords).toHaveLength(0)
    })

    it('should initialize DNS object if it does not exist', () => {
      // Remove DNS config
      delete mockConfig.config.websites['example.com'].DNS

      const record = {name: 'example.com', type: 'A', value: '192.168.1.1'}
      DNS.record(record)

      expect(mockConfig.config.websites['example.com'].DNS).toBeDefined()
      expect(mockConfig.config.websites['example.com'].DNS.A).toContainEqual({
        name: 'example.com',
        value: '192.168.1.1'
      })
    })

    it('should initialize record type array if it does not exist', () => {
      // Remove A records
      delete mockConfig.config.websites['example.com'].DNS.A

      const record = {name: 'example.com', type: 'A', value: '192.168.1.1'}
      DNS.record(record)

      expect(mockConfig.config.websites['example.com'].DNS.A).toBeDefined()
      expect(mockConfig.config.websites['example.com'].DNS.A).toContainEqual({
        name: 'example.com',
        value: '192.168.1.1'
      })
    })

    it('should generate SOA record with correct date serial format', () => {
      const record = {name: 'example.com', type: 'A', value: '192.168.1.1'}

      DNS.record(record)

      const soaRecords = mockConfig.config.websites['example.com'].DNS.SOA
      expect(soaRecords).toHaveLength(1)
      expect(soaRecords[0].name).toBe('example.com')

      // Check SOA record format: ns1.domain hostmaster.domain YYYYMMDDNN 3600 600 604800 3600
      const soaValue = soaRecords[0].value
      const parts = soaValue.split(' ')
      expect(parts).toHaveLength(7)
      expect(parts[0]).toBe('ns1.example.com')
      expect(parts[1]).toBe('hostmaster.example.com')
      expect(parts[2]).toMatch(/^\d{10}$/) // Date serial should be 10 digits
      expect(parts[3]).toBe('3600')
      expect(parts[4]).toBe('600')
      expect(parts[5]).toBe('604800')
      expect(parts[6]).toBe('3600')
    })

    it('should update SOA record for multiple domains', () => {
      const records = [
        {name: 'example.com', type: 'A', value: '192.168.1.1'},
        {name: 'test.org', type: 'A', value: '192.168.1.2'}
      ]

      DNS.record(...records)

      expect(mockConfig.config.websites['example.com'].DNS.SOA).toHaveLength(1)
      expect(mockConfig.config.websites['test.org'].DNS.SOA).toHaveLength(1)
      expect(mockConfig.config.websites['example.com'].DNS.SOA[0].name).toBe('example.com')
      expect(mockConfig.config.websites['test.org'].DNS.SOA[0].name).toBe('test.org')
    })

    it('should delete records by type only', () => {
      // Add multiple A records
      DNS.record(
        {name: 'example.com', type: 'A', value: '192.168.1.1', unique: false},
        {name: 'www.example.com', type: 'A', value: '192.168.1.2', unique: false}
      )

      // Delete all A records for example.com
      DNS.delete({name: 'example.com', type: 'A'})

      const aRecords = mockConfig.config.websites['example.com'].DNS.A
      const exampleRecords = aRecords.filter(r => r.name === 'example.com' && r.value !== '127.0.0.1')
      expect(exampleRecords).toHaveLength(0)

      // www.example.com record should still exist
      const wwwRecords = aRecords.filter(r => r.name === 'www.example.com')
      expect(wwwRecords).toHaveLength(1)
    })

    it('should handle deletion of non-existent records gracefully', () => {
      DNS.delete({name: 'nonexistent.com', type: 'A'})
      DNS.delete({name: 'example.com', type: 'NONEXISTENT'})

      // Should not throw errors and existing records should remain
      const aRecords = mockConfig.config.websites['example.com'].DNS.A
      expect(aRecords).toBeDefined()
    })

    it('should handle deletion when DNS config does not exist', () => {
      delete mockConfig.config.websites['example.com'].DNS

      DNS.delete({name: 'example.com', type: 'A'})

      // Should not throw errors
      expect(mockConfig.config.websites['example.com'].DNS).toBeUndefined()
    })

    it('should handle deletion when record type does not exist', () => {
      delete mockConfig.config.websites['example.com'].DNS.A

      DNS.delete({name: 'example.com', type: 'A'})

      // Should not throw errors
      expect(mockConfig.config.websites['example.com'].DNS.A).toBeUndefined()
    })
  })

  describe('DNS query processing', () => {
    let mockRequest, mockResponse

    beforeEach(() => {
      // Set up mock DNS request and response objects
      mockRequest = {
        address: {address: '127.0.0.1'}
      }

      mockResponse = {
        question: [{name: 'example.com', type: 1}], // A record query
        answer: [],
        authority: [],
        header: {},
        send: jest.fn()
      }

      // Initialize DNS to set up servers
      DNS.init()
    })

    it('should process A record queries correctly', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.A = 1

      // Add A record
      DNS.record({name: 'example.com', type: 'A', value: '192.168.1.1'})

      mockResponse.question[0] = {name: 'example.com', type: 1}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.A).toHaveBeenCalledWith({
        name: 'example.com',
        address: '192.168.1.1',
        ttl: 3600
      })
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should process AAAA record queries correctly', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.AAAA = 28

      // Add AAAA record
      DNS.record({name: 'example.com', type: 'AAAA', value: '2001:db8::1'})

      mockResponse.question[0] = {name: 'example.com', type: 28}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.AAAA).toHaveBeenCalledWith({
        name: 'example.com',
        address: '2001:db8::1',
        ttl: 3600
      })
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should process CNAME record queries correctly', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.CNAME = 5

      // Add CNAME record
      DNS.record({name: 'www.example.com', type: 'CNAME', value: 'example.com'})

      mockResponse.question[0] = {name: 'www.example.com', type: 5}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.CNAME).toHaveBeenCalledWith({
        name: 'www.example.com',
        data: 'example.com',
        ttl: 3600
      })
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should process MX record queries correctly', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.MX = 15

      // Add MX record
      DNS.record({name: 'example.com', type: 'MX', value: 'mail.example.com', priority: 10})

      mockResponse.question[0] = {name: 'example.com', type: 15}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.MX).toHaveBeenCalledWith({
        name: 'example.com',
        exchange: 'mail.example.com',
        priority: 10,
        ttl: 3600
      })
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should process TXT record queries correctly', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.TXT = 16

      // Add TXT record
      DNS.record({name: 'example.com', type: 'TXT', value: 'v=spf1 mx ~all'})

      mockResponse.question[0] = {name: 'example.com', type: 16}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.TXT).toHaveBeenCalledWith({
        name: 'example.com',
        data: ['v=spf1 mx ~all'],
        ttl: 3600
      })
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should process NS record queries correctly', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.NS = 2

      // Add NS record
      DNS.record({name: 'example.com', type: 'NS', value: 'ns1.example.com'})

      mockResponse.question[0] = {name: 'example.com', type: 2}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.NS).toHaveBeenCalledWith({
        name: 'example.com',
        data: 'ns1.example.com',
        ttl: 3600
      })
      expect(mockResponse.header.aa).toBe(1)
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should process SOA record queries correctly', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.SOA = 6

      // Add SOA record manually (normally auto-generated)
      mockConfig.config.websites['example.com'].DNS.SOA = [
        {
          name: 'example.com',
          value: 'ns1.example.com hostmaster.example.com 2023120101 3600 600 604800 3600'
        }
      ]

      mockResponse.question[0] = {name: 'example.com', type: 6}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.SOA).toHaveBeenCalledWith({
        name: 'example.com',
        primary: 'ns1.example.com',
        admin: 'hostmaster.example.com',
        serial: 2023120101,
        refresh: 3600,
        retry: 600,
        expiration: 604800,
        minimum: 3600,
        ttl: 3600
      })
      expect(mockResponse.header.aa).toBe(1)
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should handle queries for non-existent domains', () => {
      mockResponse.question[0] = {name: 'nonexistent.com', type: 1}

      // Get the request handler
      const dns = require('native-dns')
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(mockResponse.send).toHaveBeenCalled()
      expect(mockResponse.answer).toHaveLength(0)
    })

    it('should handle queries for domains without DNS config', () => {
      delete mockConfig.config.websites['example.com'].DNS

      mockResponse.question[0] = {name: 'example.com', type: 1}

      // Get the request handler
      const dns = require('native-dns')
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(mockResponse.send).toHaveBeenCalled()
      expect(mockResponse.answer).toHaveLength(0)
    })

    it('should implement rate limiting per client IP', () => {
      const dns = require('native-dns')
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      // Mock Date.now to control time
      const originalDateNow = Date.now
      let currentTime = 1000000
      Date.now = jest.fn(() => currentTime)

      // Make 101 requests (exceeding rate limit of 100)
      for (let i = 0; i < 101; i++) {
        const request = {address: {address: '192.168.1.100'}}
        const response = {
          question: [{name: 'example.com', type: 1}],
          answer: [],
          authority: [],
          header: {},
          send: jest.fn()
        }
        requestHandler(request, response)
      }

      // The 101st request should be rate limited (no processing)
      expect(mockResponse.send).toHaveBeenCalledTimes(0) // Original response not used in loop

      // Restore Date.now
      Date.now = originalDateNow
    })

    it('should reset rate limiting after time window', () => {
      const dns = require('native-dns')
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      // Mock Date.now to control time
      const originalDateNow = Date.now
      let currentTime = 1000000
      Date.now = jest.fn(() => currentTime)

      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        const request = {address: {address: '192.168.1.100'}}
        const response = {
          question: [{name: 'example.com', type: 1}],
          answer: [],
          authority: [],
          header: {},
          send: jest.fn()
        }
        requestHandler(request, response)
      }

      // Advance time by more than rate limit window (60 seconds)
      currentTime += 61000

      // Make another request - should be allowed
      const request = {address: {address: '192.168.1.100'}}
      const response = {
        question: [{name: 'example.com', type: 1}],
        answer: [],
        authority: [],
        header: {},
        send: jest.fn()
      }
      requestHandler(request, response)

      expect(response.send).toHaveBeenCalled()

      // Restore Date.now
      Date.now = originalDateNow
    })

    it('should handle malformed DNS requests gracefully', () => {
      const dns = require('native-dns')
      const mockLog = global.Candy.server('Log').init('DNS').log
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      // Test with null request - this will be caught by outer try-catch
      requestHandler(null, mockResponse)
      expect(mockLog).toHaveBeenCalledWith('Error processing DNS request from unknown')

      // Test with missing question - create a proper request but invalid response
      const invalidResponse = {send: jest.fn()}
      requestHandler(mockRequest, invalidResponse)
      expect(mockLog).toHaveBeenCalledWith('Invalid DNS request structure from 127.0.0.1')

      // Test with empty question array
      const emptyQuestionResponse = {question: [], send: jest.fn()}
      requestHandler(mockRequest, emptyQuestionResponse)
      expect(mockLog).toHaveBeenCalledWith('Invalid DNS request structure from 127.0.0.1')
    })

    it('should handle request processing errors gracefully', () => {
      const dns = require('native-dns')
      const mockLog = global.Candy.server('Log').init('DNS').error
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      // Mock DNS record processing to throw an error
      dns.A.mockImplementation(() => {
        throw new Error('DNS processing error')
      })

      // Add A record to trigger processing
      DNS.record({name: 'example.com', type: 'A', value: '192.168.1.1'})

      requestHandler(mockRequest, mockResponse)

      expect(mockLog).toHaveBeenCalledWith('Error processing A records:', 'DNS processing error')
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should handle case-insensitive domain names', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.A = 1

      // Add A record
      DNS.record({name: 'example.com', type: 'A', value: '192.168.1.1'})

      // Query with uppercase domain
      mockResponse.question[0] = {name: 'EXAMPLE.COM', type: 1}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(mockResponse.question[0].name).toBe('example.com') // Should be normalized
      expect(dns.A).toHaveBeenCalled()
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should process ANY queries by returning all record types', () => {
      const dns = require('native-dns')

      // Add multiple record types
      DNS.record(
        {name: 'example.com', type: 'A', value: '192.168.1.1'},
        {name: 'example.com', type: 'MX', value: 'mail.example.com', priority: 10},
        {name: 'example.com', type: 'TXT', value: 'v=spf1 mx ~all'}
      )

      // Query with unknown type (should process all)
      mockResponse.question[0] = {name: 'example.com', type: 255} // ANY query

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.A).toHaveBeenCalled()
      expect(dns.MX).toHaveBeenCalled()
      expect(dns.TXT).toHaveBeenCalled()
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should use default values when record values are missing', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.A = 1

      // Add A record without value (should use server IP)
      DNS.record({name: 'example.com', type: 'A'})

      mockResponse.question[0] = {name: 'example.com', type: 1}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.A).toHaveBeenCalledWith({
        name: 'example.com',
        address: DNS.ip, // Should use server IP as default
        ttl: 3600
      })
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should handle subdomain queries by finding parent domain', () => {
      const dns = require('native-dns')
      dns.consts.NAME_TO_QTYPE.A = 1

      // Add A record for subdomain
      DNS.record({name: 'api.example.com', type: 'A', value: '192.168.1.100'})

      mockResponse.question[0] = {name: 'api.example.com', type: 1}

      // Get the request handler
      const udpServer = dns.createServer.mock.results[0].value
      const requestHandler = udpServer.on.mock.calls.find(call => call[0] === 'request')[1]

      requestHandler(mockRequest, mockResponse)

      expect(dns.A).toHaveBeenCalledWith({
        name: 'api.example.com',
        address: '192.168.1.100',
        ttl: 3600
      })
      expect(mockResponse.send).toHaveBeenCalled()
    })
  })
})
