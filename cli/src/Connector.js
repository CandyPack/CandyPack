const axios = require('axios')
const findProcess = require('find-process').default

class Connector {
  call(command) {
    if (!command) return
    return new Promise((resolve, reject) => {
      axios
        .post('http://127.0.0.1:1453', command, {headers: {Authorization: this.key}})
        .then(response => {
          if (response.data.message) log(response.data.message)
          resolve(response.data)
        })
        .catch(error => {
          log(error)
          reject(error)
        })
    })
  }

  check() {
    return new Promise(resolve => {
      Candy.core('Config')
        .get('server')
        .then(server => {
          if (!server.watchdog) return resolve(false)
          findProcess('pid', server.watchdog)
            .then(list => {
              if (list.length > 0 && list[0].name == 'node') return resolve(true)
              return resolve(false)
            })
            .catch(err => {
              console.error('Error checking process:', err)
              return resolve(false)
            })
        })
    })
  }

  async init() {
    this.key = await Candy.core('Config').get('api').auth
  }
}

module.exports = new Connector()
