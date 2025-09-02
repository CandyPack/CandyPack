const childProcess = require('child_process')
const fs = require('fs')
const http = require('http')
const https = require('https')
const httpProxy = require('http-proxy')
const net = require('net')
const os = require('os')
const tls = require('tls')

class Web {
  #active = {}
  #error_counts = {}
  #loaded = false
  #logs = {log: {}, err: {}}
  #ports = {}
  #server_http
  #server_https
  #started = {}
  #watcher = {}

  async check() {
    if (!this.#loaded) return
    for (const domain of Object.keys(Candy.core('Config').config.websites ?? {})) {
      if (!Candy.core('Config').config.websites[domain].pid) {
        this.start(domain)
      } else if (!this.#watcher[Candy.core('Config').config.websites[domain].pid]) {
        Candy.core('Process').stop(Candy.core('Config').config.websites[domain].pid)
        Candy.core('Config').config.websites[domain].pid = null
        this.start(domain)
      }
      if (this.#logs.log[domain]) {
        fs.writeFile(os.homedir() + '/.candypack/logs/' + domain + '.log', this.#logs.log[domain], function (err) {
          if (err) log(err)
        })
      }
      if (this.#logs.err[domain]) {
        fs.writeFile(Candy.core('Config').config.websites[domain].path + '/error.log', this.#logs.err[domain], function (err) {
          if (err) log(err)
        })
      }
    }
    this.server()
  }

  checkPort(port) {
    return new Promise(resolve => {
      const server = net.createServer()
      server.once('error', () => resolve(false))
      server.once('listening', () => {
        server.close()
        resolve(true)
      })
      server.listen(port, '127.0.0.1')
    })
  }

  async create(domain, path) {
    let web = {}
    for (const iterator of ['http://', 'https://', 'ftp://', 'www.']) {
      if (domain.startsWith(iterator)) domain = domain.replace(iterator, '')
    }
    if (domain.length < 3 || (!domain.includes('.') && domain != 'localhost'))
      return Candy.server('Api').result(false, __('Invalid domain.'))
    if (Candy.core('Config').config.websites[domain]) return Candy.server('Api').result(false, __('Website %s already exists.', domain))
    web.domain = domain
    if (path && path.length > 0) {
      web.path = path.resolve(path).replace(/\\/g, '/') + '/'
    } else {
      web.path = path.resolve().replace(/\\/g, '/') + '/' + domain + '/'
    }
    if (path.length > 0) web.path = path
    if (!fs.existsSync(web.path)) fs.mkdirSync(web.path, {recursive: true})
    web.subdomain = ['www']
    if (web.domain.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) || web.domain == 'localhost') web.cert = false
    Candy.core('Config').config.websites[web.domain] = web
    if (web.domain !== 'localhost') {
      Candy.server('DNS').record(
        {name: web.domain, type: 'A', value: Candy.server('DNS').ip},
        {name: 'www.' + web.domain, type: 'CNAME', value: web.domain},
        {name: web.domain, type: 'MX', value: web.domain},
        {name: web.domain, type: 'TXT', value: 'v=spf1 a mx ip4:' + Candy.server('DNS').ip + ' ~all'},
        {
          name: '_dmarc.' + web.domain,
          type: 'TXT',
          value: 'v=DMARC1; p=reject; rua=mailto:postmaster@' + web.domain
        }
      )
    }
    childProcess.execSync('npm link candypack', {cwd: web.path})
    if (fs.existsSync(web.path + 'node_modules/.bin')) fs.rmSync(web.path + 'node_modules/.bin', {recursive: true})
    if (!fs.existsSync(web.path + '/node_modules')) fs.mkdirSync(web.path + '/node_modules')
    fs.cpSync(__dirname + '/../../web/', web.path, {recursive: true})
    return Candy.server('Api').result(true, __('Website %s created.', domain))
  }

  index(req, res) {
    res.write('CandyPack Server')
    res.end()
  }

  async init() {
    this.#loaded = true
    this.server()
  }

  async list() {
    let domains = Object.keys(Candy.core('Config').config.websites ?? {})
    if (domains.length == 0) return Candy.server('Api').result(false, __('No websites found.'))
    return Candy.server('Api').result(true, __('Websites:') + '\n  ' + domains.join('\n  '))
  }

  request(req, res, secure) {
    let host = req.headers.host
    if (!host) return this.index(req, res)
    while (!Candy.core('Config').config.websites[host] && host.includes('.')) host = host.split('.').slice(1).join('.')
    const website = Candy.core('Config').config.websites[host]
    if (!website) return this.index(req, res)
    if (!website.pid || !this.#watcher[website.pid]) return this.index(req, res)
    try {
      if (!secure) {
        res.writeHead(301, {Location: 'https://' + host + req.url})
        return res.end()
      }
      const proxy = httpProxy.createProxyServer({})
      proxy.web(req, res, {target: 'http://127.0.0.1:' + website.port})
      proxy.on('proxyReq', (proxyReq, req) => {
        proxyReq.setHeader('X-Candy-Connection-RemoteAddress', req.socket.remoteAddress ?? '')
        proxyReq.setHeader('X-Candy-Connection-SSL', secure ? 'true' : 'false')
      })
      proxy.on('error', (err, req, res) => {
        res.end()
      })
    } catch (e) {
      log(e)
      return this.index(req, res)
    }
  }

  server() {
    if (!this.#loaded) return setTimeout(this.server, 1000)
    if (Object.keys(Candy.core('Config').config.websites ?? {}).length == 0) return
    if (!this.#server_http) this.#server_http = http.createServer((req, res) => this.request(req, res, false)).listen(80)
    let ssl = Candy.core('Config').config.ssl ?? {}
    if (!this.#server_https && ssl && ssl.key && ssl.cert && fs.existsSync(ssl.key) && fs.existsSync(ssl.cert)) {
      this.#server_https = https
        .createServer(
          {
            SNICallback: (hostname, callback) => {
              let sslOptions
              while (!Candy.core('Config').config.websites[hostname] && hostname.includes('.'))
                hostname = hostname.split('.').slice(1).join('.')
              let website = Candy.core('Config').config.websites[hostname]
              if (
                website &&
                website.cert &&
                website.cert.ssl &&
                website.cert.ssl.key &&
                website.cert.ssl.cert &&
                fs.existsSync(website.cert.ssl.key) &&
                fs.existsSync(website.cert.ssl.cert)
              ) {
                sslOptions = {
                  key: fs.readFileSync(website.cert.ssl.key),
                  cert: fs.readFileSync(website.cert.ssl.cert)
                }
              } else {
                sslOptions = {
                  key: fs.readFileSync(ssl.key),
                  cert: fs.readFileSync(ssl.cert)
                }
              }
              const ctx = tls.createSecureContext(sslOptions)
              callback(null, ctx)
            },
            key: fs.readFileSync(ssl.key),
            cert: fs.readFileSync(ssl.cert)
          },
          (req, res) => {
            this.request(req, res, true)
          }
        )
        .listen(443)
    }
  }

  set(domain, data) {
    Candy.core('Config').config.websites[domain] = Candy.core('Config').config.websites[domain] = data
  }

  async start(domain) {
    if (this.#active[domain] || !this.#loaded) return
    this.#active[domain] = true
    if (!Candy.core('Config').config.websites[domain]) return (this.#active[domain] = false)
    if (
      Candy.core('Config').config.websites[domain].status == 'errored' &&
      Date.now() - Candy.core('Config').config.websites[domain].updated < this.#error_counts[domain] * 1000
    )
      return (this.#active[domain] = false)
    let port = 60000
    let using = false
    do {
      if (this.#ports[port]) {
        port++
        using = true
      } else {
        if (this.checkPort(port)) {
          using = false
        } else {
          port++
          using = true
        }
      }
      if (port > 65535) {
        port = 1000
        using = true
      }
    } while (using)
    Candy.core('Config').config.websites[domain].port = port
    this.#ports[port] = true
    if (!fs.existsSync(Candy.core('Config').config.websites[domain].path + '/index.js')) {
      log(__("Website %s doesn't have index.js file.", domain))
      this.#active[domain] = false
      return
    }
    var child = childProcess.spawn('node', [Candy.core('Config').config.websites[domain].path + '/index.js', port], {
      cwd: Candy.core('Config').config.websites[domain].path
    })
    let pid = child.pid
    child.stdout.on('data', data => {
      if (!this.#logs.log[domain]) this.#logs.log[domain] = ''
      this.#logs.log[domain] +=
        '[LOG][' +
        Date.now() +
        '] ' +
        data
          .toString()
          .trim()
          .split('\n')
          .join('\n[LOG][' + Date.now() + '] ') +
        '\n'
      if (this.#logs.log[domain].length > 1000000)
        this.#logs.log[domain] = this.#logs.log[domain].substr(this.#logs.log[domain].length - 1000000)
      if (Candy.core('Config').config.websites[domain].status == 'errored') Candy.core('Config').config.websites[domain].status = 'running'
    })
    child.stderr.on('data', data => {
      if (!this.#logs.err[domain]) this.#logs.err[domain] = ''
      this.#logs.log[domain] +=
        '[ERR][' +
        Date.now() +
        '] ' +
        data
          .toString()
          .trim()
          .split('\n')
          .join('\n[ERR][' + Date.now() + '] ') +
        '\n'
      this.#logs.err[domain] += data.toString()
      if (this.#logs.err[domain].length > 1000000)
        this.#logs.err[domain] = this.#logs.err[domain].substr(this.#logs.err[domain].length - 1000000)
      Candy.core('Config').config.websites[domain].status = 'errored'
    })
    child.on('exit', () => {
      Candy.core('Config').config.websites[domain].pid = null
      Candy.core('Config').config.websites[domain].updated = Date.now()
      if (Candy.core('Config').config.websites[domain].status == 'errored') {
        Candy.core('Config').config.websites[domain].status = 'errored'
        this.#error_counts[domain] = this.#error_counts[domain] ?? 0
        this.#error_counts[domain]++
      } else Candy.core('Config').config.websites[domain].status = 'stopped'
      this.#watcher[pid] = false
      delete this.#ports[Candy.core('Config').config.websites[domain].port]
      this.#active[domain] = false
    })

    Candy.core('Config').config.websites[domain].pid = pid
    Candy.core('Config').config.websites[domain].started = Date.now()
    Candy.core('Config').config.websites[domain].status = 'running'
    this.#watcher[pid] = true
    this.#started[domain] = Date.now()
  }

  async status() {
    this.init()
    return Candy.core('Config').config.websites
  }

  stopAll() {
    for (const domain of Object.keys(Candy.core('Config').config.websites ?? {})) {
      let website = Candy.core('Config').config.websites[domain]
      if (website.pid) {
        Candy.core('Process').stop(website.pid)
        website.pid = null
        this.set(domain, website)
      }
    }
  }
}

module.exports = new Web()
