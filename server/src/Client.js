const os = require('node:os');
const axios = require('axios');

const Cli = require('./Cli.js');
const Config = require('./Config.js');

class Client {

    auth(code) {
        Cli.log('CandyPack authenticating...');
        let data = { code: code };
        this.call('auth', data).then((response) => {
            let token = response.token;
            let secret = response.secret;
            Config.set('auth', { token: token, secret: secret });
            Cli.log('CandyPack authenticated!');
        }).catch((error) => {
            Cli.log(error ? error : 'CandyPack authentication failed!');
        });
    }

    call(action, data){
        return new Promise((resolve, reject) => {
            axios.post('https://api.candypack.dev/' + action, data).then((response) => {
                if(!response.data.result.success) return reject(response.data.result.message);
                resolve(response.data.data);
            }).catch((error) => {
                console.log(error.response.data);
                reject(error.response.data);
            });
        });
    }
    
};

module.exports = new Client();