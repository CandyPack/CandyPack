'use strict';

const { log } = require('console');

const Config = require('./src/Config.js');
const Lang   = require('./src/Lang.js');
const Server = require('./src/Server.js');

var status = {
    online: false,
    services: 0,
    auth: false
};

async function init(){
    await Lang.init();
    await Config.init();
    let wait = await Server.init();
    setTimeout(print, wait ? 1000 : 0);
}

async function print(){
    await Config.load();
    status.online = await Server.check();
    var args = process.argv.slice(2);
    if(args.length == 0){
        log('\n\x1b[35mCandyPack \x1b[0m\n');
        log('Status  : ' + (status.online ? '\x1b[32m Online'    : '\x1b[33m Offline')       + '\x1b[0m');
        if(status.online){
            if(status.services) log('Running : ' + '\x1b[32m ' + status.services + ' Services\x1b[0m');
            log('Auth    : ' + (status.auth   ? '\x1b[32m Logged in' : '\x1b[33m Not logged in') + '\x1b[0m');
            if(!status.auth) log('Login on \x1b[95mhttps://candypack.dev\x1b[0m to manage all your server operations.');
        }
        log();
        log('Commands:');
        log('\x1b[91m' + 'candypack restart' + '\x1b[0m : Restart CandyPack Server');
        log('');
        process.exit();
    }
    if(['restart'].includes(args[0] ?? ''))process.exit();
}

init();