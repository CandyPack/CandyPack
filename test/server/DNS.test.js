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
  })
})
