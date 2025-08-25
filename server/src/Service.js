var services = []
var watcher = {}
var loaded = false
var logs = {}
var errs = {}
var error_counts = {}
var active = {}

function get(id) {
  if (!loaded && services.length == 0) {
    services = Candy.Config.config.services ?? []
    loaded = true
  }
  for (const service of services) {
    if (service.id == id || service.name == id || service.file == id) return service
  }
  return false
}

function add(file) {
  let name = Candy.ext.path.basename(file)
  if (name.substr(-3) == '.js') name = name.substr(0, name.length - 3)
  let service = {
    id: services.length,
    name: Candy.ext.path.basename(file),
    file: file,
    active: true
  }
  services.push(service)
  services[service.id] = service
  Candy.Config.config.services = services
  return true
}

function set(id, key, value) {
  let service = get(id)
  let index = services.indexOf(service)
  if (service) {
    if (typeof key == 'object') {
      for (const k in key) service[k] = key[k]
    } else {
      service[key] = value
    }
  } else {
    return false
  }
  services[index] = service
  Candy.Config.config.services = services
}

async function check() {
  services = Candy.Config.config.services ?? []
  for (const service of services) {
    if (service.active) {
      if (!service.pid) {
        run(service.id)
      } else {
        if (!watcher[service.pid]) {
          try {
            process.kill(service.pid, 'SIGTERM')
          } catch {
            console.error('Failed to kill process:', service.pid)
          }
          run(service.id)
          set(service.id, 'pid', null)
        }
      }
    }
    if (logs[service.id])
      Candy.ext.fs.writeFile(
        Candy.ext.os.homedir() + '/.candypack/logs/' + service.name + '.log',
        logs[service.id],
        'utf8',
        function (err) {
          if (err) console.log(err)
        }
      )
    if (errs[service.id])
      Candy.ext.fs.writeFile(
        Candy.ext.os.homedir() + '/.candypack/logs/' + service.name + '.err.log',
        errs[service.id],
        'utf8',
        function (err) {
          if (err) console.log(err)
        }
      )
  }
}

async function run(id) {
  if (active[id]) return
  active[id] = true
  let service = get(id)
  if (!service) return
  if (error_counts[id] > 10) {
    active[id] = false
    return
  }
  if ((service.status == 'errored' || service.status == 'stopped') && Date.now() - service.updated < error_counts[id] * 1000) {
    active[id] = false
    return
  }
  set(id, 'updated', Date.now())
  var child = Candy.ext.childProcess.spawn('node', [service.file], {
    cwd: Candy.ext.path.dirname(service.file),
    detached: true
  })
  let pid = child.pid
  child.stdout.on('data', function (data) {
    if (!logs[id]) logs[id] = ''
    logs[id] +=
      '[LOG][' +
      Date.now() +
      '] ' +
      data
        .toString()
        .trim()
        .split('\n')
        .join('\n[LOG][' + Date.now() + '] ') +
      '\n'
    if (logs[id].length > 1000000) logs[id] = logs[id].substr(logs[id].length - 1000000)
  })
  child.stderr.on('data', function (data) {
    if (!errs[id]) errs[id] = ''
    logs[id] +=
      '[ERR][' +
      Date.now() +
      '] ' +
      data
        .toString()
        .trim()
        .split('\n')
        .join('\n[ERR][' + Date.now() + '] ') +
      '\n'
    errs[id] += data.toString()
    if (errs[id].length > 1000000) errs[id] = errs[id].substr(errs[id].length - 1000000)
    set(id, {
      status: 'errored',
      updated: Date.now()
    })
    // watcher[pid] = false;
    // error_counts[id] = error_counts[id] ?? 0;
    // error_counts[id]++;
    // active[id] = false;
  })
  child.on('exit', function () {
    if (get(service.id).status == 'running') {
      set(id, {
        pid: null,
        started: null,
        status: 'stopped',
        updated: Date.now()
      })
    }
    watcher[pid] = false
    error_counts[id] = error_counts[id] ?? 0
    error_counts[id]++
    active[id] = false
  })
  set(id, {
    active: true,
    pid: pid,
    started: Date.now(),
    status: 'running'
  })
  watcher[pid] = true
}

module.exports = {
  check: check,
  init: async function () {
    services = Candy.Config.config.services ?? []
    for (const service of services) {
      Candy.ext.fs.readFile(Candy.ext.os.homedir() + '/.candypack/logs/' + service.name + '.log', 'utf8', function (err, data) {
        if (!err) logs[service.id] = data.toString()
      })
    }
    loaded = true
  },
  start: async function (file) {
    return new Promise(resolve => {
      if (file && file.length > 0) {
        file = Candy.ext.path.resolve(file)
        if (Candy.ext.fs.existsSync(file)) {
          if (!get(file)) add(file)
          else return resolve(Candy.Api.result(true, __('Service %s already exists.', file)))
        } else {
          return resolve(Candy.Api.result(false, __('Service file %s not found.', file)))
        }
      } else {
        return resolve(Candy.Api.result(false, __('Service file not specified.')))
      }
    })
  },
  stop: async function (id) {
    return new Promise(() => {
      let service = get(id)
      if (service) {
        if (service.pid) {
          try {
            process.kill(service.pid, 'SIGTERM')
          } catch {
            console.error('Failed to kill process:', service.pid)
          }
          set(id, 'pid', null)
          set(id, 'started', null)
          set(id, 'active', false)
        } else {
          log(Candy.Lang.get('Service %s is not running.', id))
        }
      } else {
        log(Candy.Lang.get('Service %s not found.', id))
      }
    })
  },
  stopAll: function () {
    for (const service of services) {
      if (service.pid) {
        try {
          process.kill(service.pid, 'SIGTERM')
        } catch {
          console.error('Failed to kill process:', service.pid)
        }
        set(service.id, 'pid', null)
        set(service.id, 'started', null)
        set(service.id, 'active', false)
      }
    }
  },
  status: async function () {
    return new Promise(resolve => {
      let services = Candy.Config.config.services ?? []
      for (const service of services) {
        if (service.status == 'running') {
          var uptime = Date.now() - service.started
          let seconds = Math.floor(uptime / 1000)
          let minutes = Math.floor(seconds / 60)
          let hours = Math.floor(minutes / 60)
          let days = Math.floor(hours / 24)
          seconds %= 60
          minutes %= 60
          hours %= 24
          let uptimeString = ''
          if (days) uptimeString += days + 'd '
          if (hours) uptimeString += hours + 'h '
          if (minutes) uptimeString += minutes + 'm '
          if (seconds) uptimeString += seconds + 's'
          service.uptime = uptimeString
        }
      }
      return resolve(services)
    })
  }
}
