const crypto = require('crypto');
const fs = require('fs');

module.exports = {
    init: function(){
        if(fs.existsSync(__dir + '/config.js')){
            let config = require(__dir + '/config.js');
            for(const iterator of Object.keys(config)) this[iterator] = config[iterator];
        }
        if(!this.encrypt?.key){
            if(!this.encrypt) this.encrypt = {};
            let key = 'candy';
            this.encrypt.key = crypto.createHash('md5').update(key).digest('hex');
        }
    }
}