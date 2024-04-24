const crypto = require('crypto');
const fs = require('fs');

module.exports = {
    auth: {
        key  : 'id',
        token: 'candy_auth'
    },
    request: {
        timeout: 10000
    },
    encrypt: {
        key: 'candy'
    },

    init: function(){
        if(fs.existsSync(__dir + '/config.json')){
            let config = JSON.parse(fs.readFileSync(__dir + '/config.json'));
            for(const iterator of Object.keys(config)){
                if(typeof config[iterator] === 'object'){
                    for(const iterator2 of Object.keys(config[iterator])){
                        if(!Candy.Config[iterator]) Candy.Config[iterator] = {};
                        Candy.Config[iterator][iterator2] = config[iterator][iterator2];
                    }
                } else {
                    Candy.Config[iterator] = config[iterator];
                }
            }
        }
        this.encrypt.key = crypto.createHash('md5').update(this.encrypt.key).digest('hex');
    }
}