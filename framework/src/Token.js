const crypto = require('crypto')

class Token {
  confirmed = []

  constructor(Request) {
    this.Request = Request
  }

  // - CHECK TOKEN
  check(token) {
    let tokens = this.Request.session('_token') || []
    if (this.confirmed.includes(token)) return true
    if (tokens.includes(token)) {
      tokens = tokens.filter(t => t !== token)
      this.Request.session('_token', tokens)
      this.confirmed.push(token)
      return true
    }
    return false
  }

  // - GENERATE TOKEN
  generate() {
    let token = crypto
      .createHash('md5')
      .update(this.Request.id + Date.now().toString() + Math.random().toString())
      .digest('hex')
    let tokens = this.Request.session('_token') || []
    tokens.push(token)
    if (tokens.length > 50) tokens = tokens.slice(-50)
    this.Request.session('_token', tokens)
    return token
  }
}

module.exports = Token
