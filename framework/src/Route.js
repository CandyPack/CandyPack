const fs = require('fs')

var routes2 = {}
const mime = {
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  webm: 'video/webm',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'font/eot',
  pdf: 'application/pdf',
  zip: 'application/zip',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  txt: 'text/plain',
  log: 'text/plain',
  csv: 'text/csv',
  xml: 'text/xml',
  rss: 'application/rss+xml',
  atom: 'application/atom+xml',
  yaml: 'application/x-yaml',
  sh: 'application/x-sh',
  bat: 'application/x-bat',
  exe: 'application/x-exe',
  bin: 'application/x-binary',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  avi: 'video/x-msvideo',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  weba: 'audio/webm',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
  midi: 'audio/midi'
}

class Route {
  loading = false
  routes = {}

  async check(Candy) {
    let url = Candy.Request.url.split('?')[0]
    if (url.substr(-1) === '/') url = url.substr(0, url.length - 1)
    if (
      Candy.Request.url == '/' &&
      Candy.Request.method == 'get' &&
      Candy.Request.header('X-Candy') == 'token' &&
      Candy.Request.header('Referer').startsWith((Candy.Request.ssl ? 'https://' : 'http://') + Candy.Request.host + '/') &&
      Candy.Request.header('X-Candy-Client') == Candy.Request.cookie('candy_client')
    ) {
      Candy.Request.header('Access-Control-Allow-Origin', (Candy.Request.ssl ? 'https://' : 'http://') + Candy.Request.host)
      Candy.Request.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      return {
        token: Candy.token(),
        page: this.routes[Candy.Request.route]['page'][url].file || this.routes[Candy.Request.route].error[404].file || ''
      }
    }
    if (Candy.Config.route && Candy.Config.route[url]) {
      Candy.Config.route[url] = Candy.Config.route[url].replace('${candy}', `${__dir}/node_modules/candypack`)
      if (fs.existsSync(Candy.Config.route[url])) {
        let stat = fs.lstatSync(Candy.Config.route[url])
        if (stat.isFile()) {
          let type = 'text/html'
          if (Candy.Config.route[url].includes('.')) {
            let arr = Candy.Config.route[url].split('.')
            type = mime[arr[arr.length - 1]]
          }
          Candy.Request.header('Content-Type', type)
          Candy.Request.header('Cache-Control', 'public, max-age=31536000')
          Candy.Request.header('Content-Length', stat.size)
          return fs.readFileSync(Candy.Config.route[url])
        }
      }
    }
    for (let method of ['#' + Candy.Request.method, Candy.Request.method]) {
      let controller = this.#controller(Candy.Request.route, method, url)
      if (controller) {
        if (!Candy.Request.method.startsWith('#') || (await Candy.Auth.check())) {
          Candy.Request.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
          if (
            ['post', 'get'].includes(Candy.Request.method) &&
            controller.token &&
            (!(await Candy.request('_token')) || !Candy.token(await Candy.Request.request('_token')))
          )
            return Candy.Request.abort(401)
          if (typeof controller.cache === 'function') {
            if (controller.params) for (let key in controller.params) Candy.Request.data.url[key] = controller.params[key]
            return controller.cache(Candy)
          }
        }
      }
    }
    if (
      this.routes[Candy.Request.route]['#page'] &&
      this.routes[Candy.Request.route]['#page'][url] &&
      typeof this.routes[Candy.Request.route]['#page'][url].cache === 'function'
    ) {
      if (await Candy.Auth.check()) {
        Candy.Request.page = this.routes[Candy.Request.route]['#page'][url].file
        Candy.cookie('candy_data', {page: Candy.Request.page, token: Candy.token()}, {expires: null, httpOnly: false})
        return this.routes[Candy.Request.route]['#page'][url].cache(Candy)
      }
    }
    if (
      this.routes[Candy.Request.route]['page'] &&
      this.routes[Candy.Request.route]['page'][url] &&
      typeof this.routes[Candy.Request.route]['page'][url].cache === 'function'
    ) {
      Candy.Request.page = this.routes[Candy.Request.route]['page'][url].file
      Candy.cookie('candy_data', {page: Candy.Request.page, token: Candy.token()}, {expires: null, httpOnly: false})
      return this.routes[Candy.Request.route]['page'][url].cache(Candy)
    }
    if (url && !url.includes('/../') && fs.existsSync(`${__dir}/public${url}`)) {
      let stat = fs.lstatSync(`${__dir}/public${url}`)
      if (stat.isFile()) {
        let type = 'text/html'
        if (url.includes('.')) {
          let arr = url.split('.')
          type = mime[arr[arr.length - 1]]
        }
        Candy.Request.header('Content-Type', type)
        Candy.Request.header('Cache-Control', 'public, max-age=31536000')
        Candy.Request.header('Content-Length', stat.size)
        return fs.readFileSync(`${__dir}/public${url}`)
      }
    }
    return Candy.Request.abort(404)
  }

  #controller(route, method, url) {
    if (!this.routes[route] || !this.routes[route][method]) return false
    if (this.routes[route][method][url]) return this.routes[route][method][url]
    let arr = url.split('/')
    for (let key in this.routes[route][method]) {
      if (!key.includes('{') || !key.includes('}')) continue
      let route_arr = key.split('/')
      if (route_arr.length !== arr.length) continue
      let params = {}
      let next = false
      for (let i = 0; i < route_arr.length; i++) {
        if (route_arr[i].includes('{') && route_arr[i].includes('}')) {
          params[route_arr[i].replace('{', '').replace('}', '')] = arr[i]
          arr[i] = route_arr[i]
        } else if (route_arr[i] !== arr[i]) {
          next = true
          break
        }
      }
      if (next) continue
      if (arr.join('/') === key)
        return {
          params: params,
          cache: this.routes[route][method][key].cache,
          token: this.routes[route][method][key].token
        }
    }
    return false
  }

  #init() {
    if (this.loading) return
    this.loading = true
    for (const file of fs.readdirSync(`${__dir}/controller/`)) {
      if (file.substr(-3) !== '.js') continue
      let name = file.replace('.js', '')
      if (!Candy.Route.class) Candy.Route.class = {}
      if (Candy.Route.class[name]) {
        if (Candy.Route.class[name].mtime >= fs.statSync(Candy.Route.class[name].path).mtimeMs) continue
        delete global[name]
        delete require.cache[require.resolve(Candy.Route.class[name].path)]
      }
      if (global[name]) continue
      Candy.Route.class[name] = {
        path: `${__dir}/controller/${file}`,
        mtime: fs.statSync(`${__dir}/controller/${file}`).mtimeMs
      }
      global[name] = require(Candy.Route.class[name].path)
    }
    let dir = fs.readdirSync(`${__dir}/route/`)
    for (const file of dir) {
      if (file.substr(-3) !== '.js') continue
      let mtime = fs.statSync(`${__dir}/route/${file}`).mtimeMs
      Candy.Route.buff = file.replace('.js', '')
      if (!routes2[Candy.Route.buff] || routes2[Candy.Route.buff] < mtime) {
        delete require.cache[require.resolve(`${__dir}/route/${file}`)]
        routes2[Candy.Route.buff] = mtime
        require(`${__dir}/route/${file}`)
      }
      for (const type of ['page', '#page', 'post', '#post', 'get', '#get', 'error']) {
        if (!this.routes[Candy.Route.buff]) continue
        if (!this.routes[Candy.Route.buff][type]) continue
        for (const route in this.routes[Candy.Route.buff][type]) {
          if (routes2[Candy.Route.buff] > this.routes[Candy.Route.buff][type][route].loaded) {
            delete require.cache[require.resolve(this.routes[Candy.Route.buff][type][route].path)]
            delete this.routes[Candy.Route.buff][type][route]
          } else if (this.routes[Candy.Route.buff][type][route]) {
            if (typeof this.routes[Candy.Route.buff][type][route].type === 'function') continue
            if (this.routes[Candy.Route.buff][type][route].mtime < fs.statSync(this.routes[Candy.Route.buff][type][route].path).mtimeMs) {
              delete require.cache[require.resolve(this.routes[Candy.Route.buff][type][route].path)]
              this.routes[Candy.Route.buff][type][route].cache = require(this.routes[Candy.Route.buff][type][route].path)
              this.routes[Candy.Route.buff][type][route].mtime = fs.statSync(this.routes[Candy.Route.buff][type][route].path).mtimeMs
            }
          }
        }
      }
      delete Candy.Route.buff
    }
    this.loading = false
  }

  init() {
    this.#init()
    setInterval(() => {
      this.#init()
    }, 1000)
  }

  async request(req, res) {
    let id = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    let param = Candy.instance(id, req, res)
    if (!this.routes[param.Request.route]) return param.Request.end()
    try {
      let result = this.check(param)
      if (result instanceof Promise) result = await result
      if (result) param.Request.end(result)
      param.Request.print(param)
      param.View.print(param)
    } catch (e) {
      console.error(e)
      param.Request.abort(500)
      return param.Request.end()
    }
  }

  set(type, url, file, options = {}) {
    if (!options) options = {}
    if (typeof url != 'string') url.toString()
    if (url.length && url.substr(-1) === '/') url = url.substr(0, url.length - 1)
    let path = `${__dir}/route/${Candy.Route.buff}.js`
    if (typeof file !== 'function') {
      path = `${__dir}/controller/${type.replace('#', '')}/${file}.js`
      if (file.includes('.')) {
        let arr = file.split('.')
        path = `${__dir}/controller/${arr[0]}/${type.replace('#', '')}/${arr.slice(1).join('.')}.js`
      }
    }
    if (!this.routes[Candy.Route.buff]) this.routes[Candy.Route.buff] = {}
    if (!this.routes[Candy.Route.buff][type]) this.routes[Candy.Route.buff][type] = {}
    if (this.routes[Candy.Route.buff][type][url]) {
      this.routes[Candy.Route.buff][type][url].loaded = routes2[Candy.Route.buff]
      if (this.routes[Candy.Route.buff][type][url].mtime < fs.statSync(path).mtimeMs) {
        delete this.routes[Candy.Route.buff][type][url]
        delete require.cache[require.resolve(path)]
      } else return
    }
    if (fs.existsSync(path)) {
      if (!this.routes[Candy.Route.buff][type][url]) this.routes[Candy.Route.buff][type][url] = {}
      this.routes[Candy.Route.buff][type][url].cache = typeof file === 'function' ? file : require(path)
      this.routes[Candy.Route.buff][type][url].type = typeof file === 'function' ? 'function' : 'controller'
      this.routes[Candy.Route.buff][type][url].file = file
      this.routes[Candy.Route.buff][type][url].mtime = fs.statSync(path).mtimeMs
      this.routes[Candy.Route.buff][type][url].path = path
      this.routes[Candy.Route.buff][type][url].loaded = routes2[Candy.Route.buff]
      this.routes[Candy.Route.buff][type][url].token = options.token ?? true
    }
  }

  page(path, file) {
    if (file === undefined) {
      return {
        view: (...args) => {
          this.set('page', path, _candy => {
            _candy.View.set(...args)
            return
          })
        }
      }
    }
    this.set('page', path, file)
  }

  post(path, file, options) {
    this.set('post', path, file, options)
  }

  get(path, file, options) {
    this.set('get', path, file, options)
  }

  authPage(path, authFile, file) {
    if (file === undefined) {
      return {
        view: (...args) => {
          if (authFile)
            this.set('#page', path, _candy => {
              _candy.View.set(...args)
              return
            })
          else
            this.set('page', path, _candy => {
              _candy.View.set(...args)
              return
            })
        }
      }
    }
    if (authFile) this.set('#page', path, authFile)
    if (file) this.page(path, file)
  }

  authPost(path, authFile, file) {
    if (authFile) this.set('#post', path, authFile)
    if (file) this.post(path, file)
  }

  authGet(path, authFile, file) {
    if (authFile) this.set('#get', path, authFile)
    if (file) this.get(path, file)
  }

  error(code, file) {
    this.set('error', code, file)
  }
}

module.exports = Route
