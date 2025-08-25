class DNS {
  ip = '127.0.0.1'
  #loaded = false
  #tcp
  #types = ['A', 'CNAME', 'MX', 'TXT']
  #udp

  delete(...args) {
    for (let obj of args) {
      let domain = obj.name
      while (!Candy.Config.config.websites[domain] && domain.includes('.')) domain = domain.split('.').slice(1).join('.')
      if (!Candy.Config.config.websites[domain]) continue
      if (!obj.type) continue
      let type = obj.type.toUpperCase()
      if (!this.#types.includes(type)) continue
      if (!Candy.Config.config.websites[domain].DNS || !Candy.Config.config.websites[domain].DNS[type]) continue
      Candy.Config.config.websites[domain].DNS[type] = Candy.Config.config.websites[domain].DNS[type].filter(
        record => record.name != obj.name && (record.value != obj.value || !obj.value)
      )
    }
  }

  init() {
    if (!Candy.Config.config.DNS) Candy.Config.config.DNS = {}
    this.#udp = Candy.ext.dns.createServer()
    this.#tcp = Candy.ext.dns.createTCPServer()
    Candy.ext.axios
      .get('https://curlmyip.org/')
      .then(res => {
        console.log('Server IP:', res.data.replace('\n', ''))
        this.ip = res.data.replace('\n', '')
      })
      .catch(function (err) {
        console.error('DNS', err)
      })
    this.#publish()
  }

  #publish() {
    if (this.#loaded || !Object.keys(Candy.Config.config.websites ?? []).length) return
    this.#loaded = true
    this.#udp.on('request', (request, response) => this.#request(request, response))
    this.#tcp.on('request', (request, response) => this.#request(request, response))
    this.#udp.on('error', err => console.error('DNS', err.stack))
    this.#tcp.on('error', err => console.error('DNS', err.stack))
    this.#udp.serve(53)
    this.#tcp.serve(53)
  }

  #request(request, response) {
    response.question[0].name = response.question[0].name.toLowerCase()
    let domain = response.question[0].name
    while (!Candy.Config.config.websites[domain] && domain.includes('.')) domain = domain.split('.').slice(1).join('.')
    if (!Candy.Config.config.websites[domain]) return response.send()
    for (const record of Candy.Config.config.websites[domain].DNS.A ?? []) {
      if (record.name != response.question[0].name) continue
      response.answer.push(
        Candy.ext.dns.A({
          name: record.name,
          address: record.value ?? this.ip,
          ttl: record.ttl ?? 3600
        })
      )
    }
    for (const record of Candy.Config.config.websites[domain].DNS.CNAME ?? []) {
      if (record.name != response.question[0].name) continue
      response.answer.push(
        Candy.ext.dns.CNAME({
          name: record.name,
          data: record.value ?? domain,
          ttl: record.ttl ?? 3600
        })
      )
    }
    for (const record of Candy.Config.config.websites[domain].DNS.MX ?? []) {
      if (record.name != response.question[0].name) continue
      response.answer.push(
        Candy.ext.dns.MX({
          name: record.name,
          exchange: record.value ?? domain,
          priority: record.priority ?? 10,
          ttl: record.ttl ?? 3600
        })
      )
    }
    for (const record of Candy.Config.config.websites[domain].DNS.NS ?? []) {
      if (record.name != response.question[0].name) continue
      response.header.aa = 1
      response.authority.push(
        Candy.ext.dns.NS({
          name: record.name,
          data: record.value ?? domain,
          ttl: record.ttl ?? 3600
        })
      )
    }
    for (const record of Candy.Config.config.websites[domain].DNS.TXT ?? []) {
      if (!record || record.name != response.question[0].name) continue
      response.answer.push(
        Candy.ext.dns.TXT({
          name: record.name,
          data: [record.value],
          ttl: record.ttl ?? 3600
        })
      )
    }
    for (const record of Candy.Config.config.websites[domain].DNS.SOA ?? []) {
      response.header.aa = 1
      response.authority.push(
        Candy.ext.dns.SOA({
          name: record.name,
          primary: record.value.split(' ')[0],
          admin: record.value.split(' ')[1],
          serial: record.value.split(' ')[2],
          refresh: record.value.split(' ')[3],
          retry: record.value.split(' ')[4],
          expiration: record.value.split(' ')[5],
          minimum: record.value.split(' ')[6],
          ttl: record.ttl ?? 3600
        })
      )
    }
    response.send()
  }

  record(...args) {
    let domains = []
    for (let obj of args) {
      let domain = obj.name
      while (!Candy.Config.config.websites[domain] && domain.includes('.')) domain = domain.split('.').slice(1).join('.')
      if (!Candy.Config.config.websites[domain]) continue
      if (!obj.type) continue
      let type = obj.type.toUpperCase()
      delete obj.type
      if (!this.#types.includes(type)) continue
      if (!Candy.Config.config.websites[domain].DNS) Candy.Config.config.websites[domain].DNS = {}
      if (!Candy.Config.config.websites[domain].DNS[type]) Candy.Config.config.websites[domain].DNS[type] = []
      if (obj.unique && obj.unique === false) Candy.Config.config.websites[domain].DNS[type].filter(record => record.name != obj.name)
      Candy.Config.config.websites[domain].DNS[type].push(obj)
      domains.push(domain)
    }
    let date = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 10)
    for (let domain of domains)
      Candy.Config.config.websites[domain].DNS.SOA = [
        {
          name: domain,
          value: 'ns1.' + domain + ' hostmaster.' + domain + ' ' + date + ' 3600 600 604800 3600'
        }
      ]
  }
}

module.exports = new DNS()
