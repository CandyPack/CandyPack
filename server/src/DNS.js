const {log, error} = Candy.server('Log', false).init('DNS')

const axios = require('axios')
const dns = require('native-dns')

class DNS {
  ip = '127.0.0.1'
  #loaded = false
  #tcp
  #types = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA']
  #udp
  #requestCount = new Map() // Rate limiting
  #rateLimit = 100 // requests per minute per IP
  #rateLimitWindow = 60000 // 1 minute

  delete(...args) {
    for (let obj of args) {
      let domain = obj.name
      while (!Candy.core('Config').config.websites[domain] && domain.includes('.')) domain = domain.split('.').slice(1).join('.')
      if (!Candy.core('Config').config.websites[domain]) continue
      if (!obj.type) continue
      let type = obj.type.toUpperCase()
      if (!this.#types.includes(type)) continue
      if (!Candy.core('Config').config.websites[domain].DNS || !Candy.core('Config').config.websites[domain].DNS[type]) continue
      Candy.core('Config').config.websites[domain].DNS[type] = Candy.core('Config').config.websites[domain].DNS[type].filter(
        record => !(record.name === obj.name && (!obj.value || record.value === obj.value))
      )
    }
  }

  init() {
    this.#udp = dns.createServer()
    this.#tcp = dns.createTCPServer()
    axios
      .get('https://curlmyip.org/')
      .then(res => {
        const ip = res.data.trim()
        if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
          log('Server IP:', ip)
          this.ip = ip
        } else {
          error('DNS', 'Invalid IP format received:', ip)
        }
      })
      .catch(err => {
        error('DNS', 'Failed to get external IP, using default:', err.message)
      })
    this.#publish()
  }

  #publish() {
    if (this.#loaded || !Object.keys(Candy.core('Config').config.websites ?? {}).length) return
    this.#loaded = true
    this.#udp.on('request', (request, response) => this.#request(request, response))
    this.#tcp.on('request', (request, response) => this.#request(request, response))
    this.#udp.on('error', err => error('DNS', err.stack))
    this.#tcp.on('error', err => error('DNS', err.stack))
    this.#udp.serve(53)
    this.#tcp.serve(53)
  }

  #request(request, response) {
    // Basic rate limiting
    const clientIP = request.address?.address || 'unknown'
    const now = Date.now()

    if (!this.#requestCount.has(clientIP)) {
      this.#requestCount.set(clientIP, {count: 1, firstRequest: now})
    } else {
      const clientData = this.#requestCount.get(clientIP)
      if (now - clientData.firstRequest > this.#rateLimitWindow) {
        // Reset window
        this.#requestCount.set(clientIP, {count: 1, firstRequest: now})
      } else {
        clientData.count++
        if (clientData.count > this.#rateLimit) {
          log(`Rate limit exceeded for ${clientIP}`)
          return response.send()
        }
      }
    }

    const questionName = response.question[0].name.toLowerCase()
    const questionType = response.question[0].type
    response.question[0].name = questionName

    let domain = questionName
    while (!Candy.core('Config').config.websites[domain] && domain.includes('.')) {
      domain = domain.split('.').slice(1).join('.')
    }

    if (!Candy.core('Config').config.websites[domain] || !Candy.core('Config').config.websites[domain].DNS) {
      return response.send()
    }

    const dnsRecords = Candy.core('Config').config.websites[domain].DNS

    // Only process records relevant to the question type for better performance
    switch (questionType) {
      case dns.consts.NAME_TO_QTYPE.A:
        this.#processARecords(dnsRecords.A, questionName, response)
        break
      case dns.consts.NAME_TO_QTYPE.AAAA:
        this.#processAAAARecords(dnsRecords.AAAA, questionName, response)
        break
      case dns.consts.NAME_TO_QTYPE.CNAME:
        this.#processCNAMERecords(dnsRecords.CNAME, questionName, response)
        break
      case dns.consts.NAME_TO_QTYPE.MX:
        this.#processMXRecords(dnsRecords.MX, questionName, response)
        break
      case dns.consts.NAME_TO_QTYPE.TXT:
        this.#processTXTRecords(dnsRecords.TXT, questionName, response)
        break
      case dns.consts.NAME_TO_QTYPE.NS:
        this.#processNSRecords(dnsRecords.NS, questionName, response, domain)
        break
      case dns.consts.NAME_TO_QTYPE.SOA:
        this.#processSOARecords(dnsRecords.SOA, questionName, response)
        break
      default:
        // For ANY queries or unknown types, process all relevant records
        this.#processARecords(dnsRecords.A, questionName, response)
        this.#processAAAARecords(dnsRecords.AAAA, questionName, response)
        this.#processCNAMERecords(dnsRecords.CNAME, questionName, response)
        this.#processMXRecords(dnsRecords.MX, questionName, response)
        this.#processTXTRecords(dnsRecords.TXT, questionName, response)
        this.#processNSRecords(dnsRecords.NS, questionName, response, domain)
        this.#processSOARecords(dnsRecords.SOA, questionName, response)
    }

    response.send()
  }

  #processARecords(records, questionName, response) {
    for (const record of records ?? []) {
      if (record.name !== questionName) continue
      response.answer.push(
        dns.A({
          name: record.name,
          address: record.value ?? this.ip,
          ttl: record.ttl ?? 3600
        })
      )
    }
  }

  #processAAAARecords(records, questionName, response) {
    for (const record of records ?? []) {
      if (record.name !== questionName) continue
      response.answer.push(
        dns.AAAA({
          name: record.name,
          address: record.value,
          ttl: record.ttl ?? 3600
        })
      )
    }
  }

  #processCNAMERecords(records, questionName, response) {
    for (const record of records ?? []) {
      if (record.name !== questionName) continue
      response.answer.push(
        dns.CNAME({
          name: record.name,
          data: record.value ?? questionName,
          ttl: record.ttl ?? 3600
        })
      )
    }
  }

  #processMXRecords(records, questionName, response) {
    for (const record of records ?? []) {
      if (record.name !== questionName) continue
      response.answer.push(
        dns.MX({
          name: record.name,
          exchange: record.value ?? questionName,
          priority: record.priority ?? 10,
          ttl: record.ttl ?? 3600
        })
      )
    }
  }

  #processNSRecords(records, questionName, response, domain) {
    for (const record of records ?? []) {
      if (record.name !== questionName) continue
      response.header.aa = 1
      response.authority.push(
        dns.NS({
          name: record.name,
          data: record.value ?? domain,
          ttl: record.ttl ?? 3600
        })
      )
    }
  }

  #processTXTRecords(records, questionName, response) {
    for (const record of records ?? []) {
      if (!record || record.name !== questionName) continue
      response.answer.push(
        dns.TXT({
          name: record.name,
          data: [record.value],
          ttl: record.ttl ?? 3600
        })
      )
    }
  }

  #processSOARecords(records, questionName, response) {
    for (const record of records ?? []) {
      if (!record || !record.value) continue
      const soaParts = record.value.split(' ')
      if (soaParts.length < 7) continue
      response.header.aa = 1
      response.authority.push(
        dns.SOA({
          name: record.name,
          primary: soaParts[0],
          admin: soaParts[1],
          serial: parseInt(soaParts[2]) || 1,
          refresh: parseInt(soaParts[3]) || 3600,
          retry: parseInt(soaParts[4]) || 600,
          expiration: parseInt(soaParts[5]) || 604800,
          minimum: parseInt(soaParts[6]) || 3600,
          ttl: record.ttl ?? 3600
        })
      )
    }
  }

  record(...args) {
    let domains = []
    for (let obj of args) {
      let domain = obj.name
      while (!Candy.core('Config').config.websites[domain] && domain.includes('.')) domain = domain.split('.').slice(1).join('.')
      if (!Candy.core('Config').config.websites[domain]) continue
      if (!obj.type) continue
      let type = obj.type.toUpperCase()
      delete obj.type
      if (!this.#types.includes(type)) continue
      if (!Candy.core('Config').config.websites[domain].DNS) Candy.core('Config').config.websites[domain].DNS = {}
      if (!Candy.core('Config').config.websites[domain].DNS[type]) Candy.core('Config').config.websites[domain].DNS[type] = []
      if (obj.unique !== false) {
        Candy.core('Config').config.websites[domain].DNS[type] = Candy.core('Config').config.websites[domain].DNS[type].filter(
          record => record.name !== obj.name
        )
      }
      Candy.core('Config').config.websites[domain].DNS[type].push(obj)
      domains.push(domain)
    }
    let date = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 10)
    for (let domain of domains)
      Candy.core('Config').config.websites[domain].DNS.SOA = [
        {
          name: domain,
          value: 'ns1.' + domain + ' hostmaster.' + domain + ' ' + date + ' 3600 600 604800 3600'
        }
      ]
  }
}

module.exports = new DNS()
