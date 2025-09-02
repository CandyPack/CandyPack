const http = require(`http`)

module.exports = {
  init: function () {
    let args = process.argv.slice(2)
    if (!args[0]) {
      console.error(`CandyPack Server requires a port.`)
      process.exit(0)
    }
    let port = parseInt(args[0])
    if (!port) {
      console.error(`CandyPack Server requires a port.`)
      process.exit(0)
    }
    http
      .createServer((req, res) => {
        return Candy.Route.request(req, res)
      })
      .listen(port)
  }
}