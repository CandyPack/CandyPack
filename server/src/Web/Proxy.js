const http = require('http')
const httpProxy = require('http-proxy')

class WebProxy {
  #log

  constructor(log) {
    this.#log = log
  }

  http2(req, res, website) {
    const options = {
      hostname: '127.0.0.1',
      port: website.port,
      path: req.url,
      method: req.method,
      headers: {}
    }

    for (const [key, value] of Object.entries(req.headers)) {
      if (!key.startsWith(':')) {
        options.headers[key.toLowerCase()] = value
      }
    }

    options.headers['x-candy-connection-remoteaddress'] = req.socket.remoteAddress ?? ''
    options.headers['x-candy-connection-ssl'] = 'true'

    const proxyReq = http.request(options, proxyRes => {
      const responseHeaders = {}
      const forbiddenHeaders = [
        'connection',
        'keep-alive',
        'transfer-encoding',
        'upgrade',
        'proxy-connection',
        'proxy-authenticate',
        'trailer'
      ]

      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (!forbiddenHeaders.includes(key.toLowerCase())) {
          responseHeaders[key] = value
        }
      }

      res.writeHead(proxyRes.statusCode, responseHeaders)
      proxyRes.pipe(res)
    })

    proxyReq.on('error', err => {
      this.#log(`HTTP/2 proxy error: ${err.message}`)
      if (!res.headersSent) {
        res.writeHead(502)
        res.end('Bad Gateway')
      }
    })

    req.pipe(proxyReq)
  }

  http1(req, res, website, host) {
    const proxy = httpProxy.createProxyServer({
      timeout: 30000,
      proxyTimeout: 30000,
      keepAlive: true
    })

    proxy.web(req, res, {target: 'http://127.0.0.1:' + website.port})

    proxy.on('proxyReq', (proxyReq, req) => {
      proxyReq.setHeader('x-candy-connection-remoteaddress', req.socket.remoteAddress ?? '')
      proxyReq.setHeader('x-candy-connection-ssl', 'true')
    })

    proxy.on('error', (err, req, res) => {
      this.#log(`Proxy error for ${host}: ${err.message}`)
      if (!res.headersSent) {
        res.statusCode = 502
        res.end('Bad Gateway')
      }
    })
  }
}

module.exports = WebProxy
