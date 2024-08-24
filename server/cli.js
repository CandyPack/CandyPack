if(!global.trigger) global.trigger = 'cli';
global.completed = false;

global.Candy = require('./src/Candy.js');

global.__  = (key, ...args) => Candy.Lang.get(key, ...args);
global.log = (...args)      => Candy.Cli.log(...args);

const commands = [
    'auth',
    'help',
    'monit',
    'restart',
];

const command_descriptions = {
    auth: {
        description: 'Define your server to your CandyPack account',
        args: ['key']
    },
    help: {
        description: 'List all available commands'
    },
    monit: {
        description: 'Monitor Website or Service'
    },
    restart: {
        description: 'Restart CandyPack Server'
    }
};

var status = {
    online: false,
    services: 0,
    auth: false,
    uptime: 0
};

async function init(){
    await Candy.init();
    print();
}

async function print(){
    status.online = await Candy.Server.check();
    status.uptime = await Candy.Server.uptime();
    status.services = await Candy.Server.services();
    status.websites = Candy.config.websites ? Object.keys(Candy.config.websites).length : 0;
    var args = process.argv.slice(2);
    if(global.trigger == 'candy'){
        if(args.length == 0){
            log("\n",'CandyPack',"\n");
            let length = 0;
            for(let i = 0; i < 2; i++){
                for (let iterator of ['Status', 'Uptime', 'Websites', 'Services', 'Auth']) {
                    let title = await __(iterator);
                    if(title.length > length) length = title.length;
                    if(i){
                        let space = '';
                        for(let j = 0; j < length - title.length; j++) space += ' ';
                        switch(iterator){
                            case 'Status':
                                log(title + space + ' : ' + (status.online ? '\x1b[32m ' + await __('Online')    : '\x1b[33m ' + await __('Offline'))       + '\x1b[0m');
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
                                log(title + space + ' : ' + (status.auth   ? '\x1b[32m ' + await __('Logged in') : '\x1b[33m ' + await __('Not logged in')) + '\x1b[0m');
                                break;
                        }
                    }
                }
            }
            if(!status.auth) log(await __('Login on %s to manage all your server operations.', '\x1b[95mhttps://candypack.dev\x1b[0m'));
            log();
            log('Commands:');
            length = 0;
            for (let index = 0; index < 2; index++) {
                for(var i in command_descriptions){
                    var cmd = command_descriptions[i];
                    let command = 'candy ' + i;
                    let args = '';
                    if(cmd.args) args = ' <' + cmd.args.join('> <') + '>';
                    let description = cmd.description;
                    if(command.length + args.length > length) length = (command.length + args.length);
                    if(index){
                        let space = '';
                        for(let j = 0; j < length - (command.length + args.length); j++) space += ' ';
                        log('\x1b[91m' + command + '\x1b[0m\x1b[90m' + args + '\x1b[0m' + space + ' : ' + await __(description));
                    }
                }
            }
            log('');
        } else if(!commands.includes(args[0])) {
            axios.post('http://127.0.0.1:1453', { args: args }, { headers: { 'Authorization': Config.get('auth') }})
                 .then((response) => {
                    console.log(response.data);
                    for(const result of response.data.result) log(result);
                }).catch((error) => {
                    console.error(error);
                });
        }
        setTimeout(() => { global.completed = true; }, 100);
    }
}

init();