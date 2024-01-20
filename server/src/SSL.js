const selfsigned = require('selfsigned');
const crypto = require('crypto');
const acme = require('acme-client');
const fs = require('fs');
const os = require("os");

const Config = require('./Config');

var records = {dns: {}, http: {}};

function self(){
    let ssl = Config.get('ssl') ?? {};
    if(ssl && ssl.expiry > Date.now() && ssl.key && ssl.cert && fs.existsSync(ssl.key) && fs.existsSync(ssl.cert)) return;
    const attrs = [{ name: 'commonName', value: 'CandyPack' }];
    const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048});
    if(!fs.existsSync(os.homedir() + '/.candypack/ssl')) fs.mkdirSync(os.homedir() + '/.candypack/ssl');
    let key_file = os.homedir() + '/.candypack/ssl/candypack.key';
    let crt_file = os.homedir() + '/.candypack/ssl/candypack.crt';
    fs.writeFileSync(key_file, pems.private);
    fs.writeFileSync(crt_file, pems.cert);
    ssl.key = key_file;
    ssl.cert = crt_file;
    ssl.expiry = Date.now() + 86400000;
    Config.set('ssl', ssl);
}

module.exports = {
    check: function(){
        self();
    }
};