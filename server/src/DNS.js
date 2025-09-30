const {log, error} = Candy.server('Log', false).init('DNS')

const axios = require('axios')
const dns = require('native-dns')
const {execSync} = require('child_process')
const fs = require('fs')
const os = require('os')

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
    this.#udp.on('request', (request, response) => {
      try {
        this.#request(request, response)
      } catch (err) {
        error('DNS UDP request handler error:', err.message)
      }
    })
    this.#tcp.on('request', (request, response) => {
      try {
        this.#request(request, response)
      } catch (err) {
        error('DNS TCP request handler error:', err.message)
      }
    })
    this.#udp.on('error', err => error('DNS UDP Server Error:', err.stack))
    this.#tcp.on('error', err => error('DNS TCP Server Error:', err.stack))

    this.#startDNSServers()
  }

  #startDNSServers() {
    try {
      this.#udp.serve(53)
      this.#tcp.serve(53)
      log('DNS servers started on port 53')
    } catch (err) {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
        log('Port 53 is in use, attempting to resolve systemd-resolve conflict...')
        if (this.#handleSystemdResolveConflict()) {
          // Retry after handling systemd-resolve
          setTimeout(() => {
            try {
              this.#udp.serve(53)
              this.#tcp.serve(53)
              log('DNS servers started on port 53 after resolving systemd-resolve conflict')
            } catch (retryErr) {
              error('Failed to start DNS servers after systemd-resolve resolution:', retryErr.message)
            }
          }, 2000)
        } else {
          error('Failed to resolve port 53 conflict:', err.message)
        }
      } else {
        error('Failed to start DNS servers:', err.message)
      }
    }
  }

  #handleSystemdResolveConflict() {
    try {
      // Check if we're on Linux and systemd-resolve is running
      if (os.platform() !== 'linux') {
        return false
      }

      // Check if systemd-resolve is using port 53
      const netstatOutput = execSync('netstat -tulpn 2>/dev/null | grep :53 || ss -tulpn 2>/dev/null | grep :53 || true', {
        encoding: 'utf8',
        timeout: 5000
      })

      if (!netstatOutput.includes('systemd-resolve') && !netstatOutput.includes('resolved')) {
        return false
      }

      log('Detected systemd-resolve using port 53, configuring to use alternative port...')

      // Create systemd-resolved configuration to use alternative port
      const resolvedConfDir = '/etc/systemd/resolved.conf.d'
      const resolvedConfFile = `${resolvedConfDir}/candypack-dns.conf`

      // Check if we have write permissions or try with sudo
      try {
        if (!fs.existsSync(resolvedConfDir)) {
          execSync(`sudo mkdir -p ${resolvedConfDir}`, {timeout: 10000})
        }

        // Configure systemd-resolved to use port 5353 instead of 53
        const resolvedConfig = `[Resolve]
DNS=127.0.0.1#5353
DNSStubListener=no
`

        execSync(`echo '${resolvedConfig}' | sudo tee ${resolvedConfFile}`, {timeout: 10000})
        log('Created systemd-resolved configuration to use port 5353')

        // Restart systemd-resolved service
        execSync('sudo systemctl restart systemd-resolved', {timeout: 15000})
        log('Restarted systemd-resolved service')

        // Wait a moment for the service to restart
        setTimeout(() => {
          // Update /etc/resolv.conf to point to our DNS server
          try {
            const resolvConf = `nameserver 127.0.0.1
options edns0 trust-ad
search .
`
            execSync(`echo '${resolvConf}' | sudo tee /etc/resolv.conf`, {timeout: 5000})
            log('Updated /etc/resolv.conf to use CandyPack DNS')
          } catch (resolvErr) {
            log('Warning: Could not update /etc/resolv.conf:', resolvErr.message)
          }
        }, 1000)

        return true
      } catch (sudoErr) {
        log('Could not configure systemd-resolved (no sudo access):', sudoErr.message)
        return this.#tryAlternativeApproach()
      }
    } catch (err) {
      error('Error handling systemd-resolve conflict:', err.message)
      return false
    }
  }

  #tryAlternativeApproach() {
    try {
      log('Trying alternative approach: temporarily stopping systemd-resolved...')

      // Try to stop systemd-resolved temporarily
      execSync('sudo systemctl stop systemd-resolved', {timeout: 10000})
      log('Temporarily stopped systemd-resolved')
      return true
    } catch (err) {
      log('Alternative approach failed:', err.message)
      return false
    }
  }

  #request(request, response) {
    try {
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

      // Validate request structure
      if (!request || !response || !response.question || !response.question[0]) {
        log(`Invalid DNS request structure from ${clientIP}`)
        return response.send()
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
    } catch (err) {
      error('DNS request processing error:', err.message)
      // Log client info for debugging
      const clientIP = request?.address?.address || 'unknown'
      log(`Error processing DNS request from ${clientIP}`)

      // Try to send an empty response if possible
      try {
        if (response && typeof response.send === 'function') {
          response.send()
        }
      } catch (sendErr) {
        error('Failed to send DNS error response:', sendErr.message)
      }
    }
  }

  #processARecords(records, questionName, response) {
    try {
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
    } catch (err) {
      error('Error processing A records:', err.message)
    }
  }

  #processAAAARecords(records, questionName, response) {
    try {
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
    } catch (err) {
      error('Error processing AAAA records:', err.message)
    }
  }

  #processCNAMERecords(records, questionName, response) {
    try {
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
    } catch (err) {
      error('Error processing CNAME records:', err.message)
    }
  }

  #processMXRecords(records, questionName, response) {
    try {
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
    } catch (err) {
      error('Error processing MX records:', err.message)
    }
  }

  #processNSRecords(records, questionName, response, domain) {
    try {
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
    } catch (err) {
      error('Error processing NS records:', err.message)
    }
  }

  #processTXTRecords(records, questionName, response) {
    try {
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
    } catch (err) {
      error('Error processing TXT records:', err.message)
    }
  }

  #processSOARecords(records, questionName, response) {
    try {
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
    } catch (err) {
      error('Error processing SOA records:', err.message)
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
