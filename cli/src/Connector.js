const axios = require('axios')
const findProcess = require('find-process').default

class Connector {
  call(command) {
    if (!command) return
    return new Promise((resolve, reject) => {
      axios
        .post('http://127.0.0.1:1453', command, {headers: {Authorization: Candy.core('Config').config.api.auth}})
        .then(response => {
          if (response.data.message) console.log(response.data.message)
          resolve(response.data)
        })
        .catch(error => {
          console.error(error)
          reject(error)
        })
    })
  }

  check() {
    return new Promise(resolve => {
      if (!Candy.core('Config').config.server.watchdog) return resolve(false)
      findProcess('pid', Candy.core('Config').config.server.watchdog)
        .then(list => {
          if (list.length > 0 && list[0].name == 'node') return resolve(true)
          return resolve(false)
        })
        .catch(err => {
          console.error('Error checking process:', err)
          return resolve(false)
        })
    })
  }
}

module.exports = new Connector()
