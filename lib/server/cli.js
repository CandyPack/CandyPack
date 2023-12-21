'use strict';

if(!global.trigger) global.trigger = 'cli';
global.completed = false;

const { log } = require('console');

const Config = require('./src/Config.js');
const Lang   = require('./src/Lang.js');
const Server = require('./src/Server.js');

const commands = [
    'restart',
    'login',
    'start',
    'create',
    'services',
    'websites'
];

const command_descriptions = {
    start: {
        description: 'Start a CandyPack Service',
        args: ['service']
    },
    create: {
        description: 'Create a new Website'
    },
    restart: {
        description: 'Restart CandyPack Server'
    },
    services: {
        description: 'List all CandyPack Services'
    },
    websites: {
        description: 'List all CandyPack Websites'
    }
};

var status = {
    online: false,
    services: 0,
    auth: false,
    uptime: 0
};

async function init(){
    await Lang.init();
    await Config.init();
    await Server.init();
    print();
}

async function print(){
    await Config.load();
    status.online = await Server.check();
    status.uptime = await Server.uptime();
    status.services = await Server.services();
    status.websites = Config.get('websites') ? Object.keys(Config.get('websites')).length : 0;
    var args = process.argv.slice(2);
    if(global.trigger == 'candy'){
        if(args.length == 0){
            log('\n\x1b[35mCandyPack \x1b[0m');
            let length = 0;
            for(let i = 0; i < 2; i++){
                for (let iterator of ['Status', 'Uptime', 'Websites', 'Services', 'Auth']) {
                    let title = await Lang.get(iterator);
                    if(title.length > length) length = title.length;
                    if(i){
                        let space = '';
                        for(let j = 0; j < length - title.length; j++) space += ' ';
                        switch(iterator){
                            case 'Status':
                                log(title + space + ' : ' + (status.online ? '\x1b[32m ' + await Lang.get('Online')    : '\x1b[33m ' + await Lang.get('Offline'))       + '\x1b[0m');
                                break;
                            case 'Uptime':
                                if(status.online) log(title + space + ' : ' + '\x1b[32m ' + status.uptime + '\x1b[0m');
                                break;
                            case 'Websites':
                                if(status.online) log(title + space + ' : ' + '\x1b[32m ' + status.websites + '\x1b[0m');
                                break;
                            case 'Services':
                                if(status.online) log(title + space + ' : ' + '\x1b[32m ' + status.services + '\x1b[0m');
                                break;
                            case 'Auth':
                                log(title + space + ' : ' + (status.auth   ? '\x1b[32m ' + await Lang.get('Logged in') : '\x1b[33m ' + await Lang.get('Not logged in')) + '\x1b[0m');
                                break;
                        }
                    }
                }
            }
            if(!status.auth) log(await Lang.get('Login on %s to manage all your server operations.', '\x1b[95mhttps://candypack.dev\x1b[0m'));
            log();
            log('Commands:');
            length = 0;
            for (let index = 0; index < 2; index++) {
                for(var i in command_descriptions){
                    var cmd = command_descriptions[i];
                    let command = 'candypack ' + i;
                    let args = '';
                    if(cmd.args) args = ' <' + cmd.args.join('> <') + '>';
                    let description = cmd.description;
                    if(command.length + args.length > length) length = (command.length + args.length);
                    if(index){
                        let space = '';
                        for(let j = 0; j < length - (command.length + args.length); j++) space += ' ';
                        log('\x1b[91m' + command + '\x1b[0m\x1b[90m' + args + '\x1b[0m' + space + ' : ' + await Lang.get(description));
                    }
                }
            }
            log('');
        } else if(!commands.includes(args[0])) {
            log('\n\x1b[35mCandyPack \x1b[0m\x1b[91m' + args[0] + '\x1b[0m is not a valid command.\n');
        }
        setTimeout(() => { global.completed = true; }, 100);
    }
}

init();