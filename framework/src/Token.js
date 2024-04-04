const crypto = require('crypto');

class Token {

  // - GENERATE TOKEN
  generate() {
    let token = crypto.createHash('md5').update(Date.now().toString() + Math.random().toString()).digest('hex');
    return token;
  }
}

module.exports = Token;