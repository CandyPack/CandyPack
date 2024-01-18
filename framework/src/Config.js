const crypto = require('crypto');
const fs = require('fs');

module.exports = {
    request: {
        timeout: 1000
    },
    encrypt: {
        key: 'candy'
    },

    init: function(){
        if(fs.existsSync(__dir + '/config.js')){
            let config = require(__dir + '/config.js');
            for(const iterator of Object.keys(config)) this[iterator] = config[iterator];
        }
        this.encrypt.key = crypto.createHash('md5').update(this.encrypt.key).digest('hex');
    }
}