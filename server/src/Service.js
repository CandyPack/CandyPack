const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

class Service {
  #services = []
  #watcher = {}
  #loaded = false
  #logs = {}
  #errs = {}
  #error_counts = {}
  #active = {}

  #get(id) {
    if (!this.#loaded && this.#services.length == 0) {
      this.#services = Candy.core('Config').config.services ?? []
      this.#loaded = true
    }
    for (const service of this.#services) {
      if (service.id == id || service.name == id || service.file == id) return service
    }
    return false
  }

  #add(file) {
    let name = path.basename(file)
    if (name.substr(-3) == '.js') name = name.substr(0, name.length - 3)
    let service = {
      id: this.#services.length,
      name: path.basename(file),
      file: file,
      active: true
    }
    this.#services.push(service)
    this.#services[service.id] = service
    Candy.core('Config').config.services = this.#services
    return true
  }

  #set(id, key, value) {
    let service = this.#get(id)
    let index = this.#services.indexOf(service)
    if (service) {
      if (typeof key == 'object') {
        for (const k in key) service[k] = key[k]
      } else {
        service[key] = value
      }
    } else {
      return false
    }
    this.#services[index] = service
    Candy.core('Config').config.services = this.#services
  }

  async check() {
    this.#services = Candy.core('Config').config.services ?? []
    for (const service of this.#services) {
      if (service.active) {
        if (!service.pid) {
          this.#run(service.id)
        } else {
          if (!this.#watcher[service.pid]) {
            Candy.core('Process').stop(service.pid)
            this.#run(service.id)
            this.#set(service.id, 'pid', null)
          }
        }
      }
      if (this.#logs[service.id])
        fs.writeFile(os.homedir() + '/.candypack/logs/' + service.name + '.log', this.#logs[service.id], 'utf8', function (err) {
          if (err) console.log(err)
        })
      if (this.#errs[service.id])
        fs.writeFile(os.homedir() + '/.candypack/logs/' + service.name + '.err.log', this.#errs[service.id], 'utf8', function (err) {
          if (err) console.log(err)
        })
    }
  }

  async #run(id) {
    if (this.#active[id]) return
    this.#active[id] = true
    let service = this.#get(id)
    if (!service) return
    if (this.#error_counts[id] > 10) {
      this.#active[id] = false
      return
    }
    if ((service.status == 'errored' || service.status == 'stopped') && Date.now() - service.updated < this.#error_counts[id] * 1000) {
      this.#active[id] = false
      return
    }
    this.#set(id, 'updated', Date.now())
    var child = childProcess.spawn('node', [service.file], {
      cwd: path.dirname(service.file)
    })
    let pid = child.pid
    child.stdout.on('data', data => {
      if (!this.#logs[id]) this.#logs[id] = ''
      this.#logs[id] +=
        '[LOG][' +
        Date.now() +
        '] ' +
        data
          .toString()
          .trim()
          .split('\n')
          .join('\n[LOG][' + Date.now() + '] ') +
        '\n'
      if (this.#logs[id].length > 1000000) this.#logs[id] = this.#logs[id].substr(this.#logs[id].length - 1000000)
    })
    child.stderr.on('data', data => {
      if (!this.#errs[id]) this.#errs[id] = ''
      this.#logs[id] +=
        '[ERR][' +
        Date.now() +
        '] ' +
        data
          .toString()
          .trim()
          .split('\n')
          .join('\n[ERR][' + Date.now() + '] ') +
        '\n'
      this.#errs[id] += data.toString()
      if (this.#errs[id].length > 1000000) this.#errs[id] = this.#errs[id].substr(this.#errs[id].length - 1000000)
      this.#set(id, {
        status: 'errored',
        updated: Date.now()
      })
      // watcher[pid] = false;
      // error_counts[id] = error_counts[id] ?? 0;
      // error_counts[id]++;
      // active[id] = false;
    })
    child.on('exit', () => {
      if (this.#get(service.id).status == 'running') {
        this.#set(id, {
          pid: null,
          started: null,
          status: 'stopped',
          updated: Date.now()
        })
      }
      this.#watcher[pid] = false
      this.#error_counts[id] = this.#error_counts[id] ?? 0
      this.#error_counts[id]++
      this.#active[id] = false
    })
    this.#set(id, {
      active: true,
      pid: pid,
      started: Date.now(),
      status: 'running'
    })
    this.#watcher[pid] = true
  }

  async init() {
    this.#services = Candy.core('Config').config.services ?? []
    for (const service of this.#services) {
      fs.readFile(os.homedir() + '/.candypack/logs/' + service.name + '.log', 'utf8', (err, data) => {
        if (!err) this.#logs[service.id] = data.toString()
      })
    }
    this.#loaded = true
    this.stopAll()
  }

  async start(file) {
    return new Promise(resolve => {
      if (file && file.length > 0) {
        file = path.resolve(file)
        if (fs.existsSync(file)) {
          if (!this.#get(file)) this.#add(file)
          else return resolve(Candy.server('Api').result(true, __('Service %s already exists.', file)))
        } else {
          return resolve(Candy.server('Api').result(false, __('Service file %s not found.', file)))
        }
      } else {
        return resolve(Candy.server('Api').result(false, __('Service file not specified.')))
      }
    })
  }

  stop(id) {
    let service = this.#get(id)
    if (service) {
      if (service.pid) {
        Candy.core('Process').stop(service.pid)
        this.#set(id, 'pid', null)
        this.#set(id, 'started', null)
        this.#set(id, 'active', false)
      } else {
        log(__('Service %s is not running.', id))
      }
    } else {
      log(__('Service %s not found.', id))
    }
  }

  stopAll() {
    for (const service of this.#services) this.stop(service.id)
  }

  async status() {
    let services = Candy.core('Config').config.services ?? []
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
    return services
  }
}

module.exports = new Service()
