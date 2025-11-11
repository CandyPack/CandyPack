const http = require('http')
const httpProxy = require('http-proxy')

class WebProxy {
  #log
  #proxy

  constructor(log) {
    this.#log = log
    this.#proxy = httpProxy.createProxyServer({
      timeout: 30000,
      proxyTimeout: 30000,
      keepAlive: true
    })
  }

  http2(req, res, website, host) {
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
      if (proxyRes.headers['x-candy-early-hints'] && typeof res.writeEarlyHints === 'function') {
        try {
          const links = JSON.parse(proxyRes.headers['x-candy-early-hints'])
          if (Array.isArray(links) && links.length > 0) {
            res.writeEarlyHints({link: links})
          }
        } catch {
          // Ignore parsing errors
        }
      }

      const responseHeaders = {}
      const forbiddenHeaders = [
        'connection',
        'keep-alive',
        'transfer-encoding',
        'upgrade',
        'proxy-connection',
        'proxy-authenticate',
        'trailer',
        'x-candy-early-hints'
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
      this.#log(`HTTP/2 proxy error for ${host}: ${err.message}`)
      if (!res.headersSent) {
        res.writeHead(502)
        res.end('Bad Gateway')
      }
    })

    req.pipe(proxyReq)
  }

  http1(req, res, website, host) {
    const onProxyReq = (proxyReq, req) => {
      proxyReq.setHeader('x-candy-connection-remoteaddress', req.socket.remoteAddress ?? '')
      proxyReq.setHeader('x-candy-connection-ssl', 'true')
    }

    const onProxyRes = (proxyRes, req, res) => {
      if (proxyRes.headers['x-candy-early-hints'] && typeof res.writeEarlyHints === 'function') {
        try {
          const links = JSON.parse(proxyRes.headers['x-candy-early-hints'])
          if (Array.isArray(links) && links.length > 0) {
            res.writeEarlyHints({link: links})
          }
        } catch {
          // Ignore parsing errors
        }
      }

      delete proxyRes.headers['x-candy-early-hints']
    }

    const onError = (err, req, res) => {
      this.#log(`Proxy error for ${host}: ${err.message}`)
      if (!res.headersSent) {
        res.statusCode = 502
        res.end('Bad Gateway')
      }
    }

    const cleanup = () => {
      this.#proxy.off('proxyReq', onProxyReq)
      this.#proxy.off('proxyRes', onProxyRes)
      this.#proxy.off('error', onError)
    }

    this.#proxy.on('proxyReq', onProxyReq)
    this.#proxy.on('proxyRes', onProxyRes)
    this.#proxy.on('error', onError)

    res.on('finish', cleanup)
    res.on('close', cleanup)

    this.#proxy.web(req, res, {target: 'http://127.0.0.1:' + website.port})
  }
}

module.exports = WebProxy
