const spawn = require('child_process').spawn;
const { Console, log } = require('console');
const { Transform } = require('stream');
const { resolve } = require('path');
const ps = require('ps-node');
const os = require("os");

const Service = require('./Service.js');
const Config = require('./Config.js');
const Lang = require('./Lang.js');
const Web = require('./Web.js');
const Cli = require('./Cli.js');

async function check(){
    return new Promise((resolve, reject) => {
        if(!Config.get('watchdog')) return resolve(false);
        ps.lookup({ pid: Config.get('watchdog') }, function(err, resultList ) {
            if(err) throw new Error(err);
            let process = resultList[0];
            if(process) resolve(true);
            else resolve(false);
        });
    });
}

async function watchdog(){
    log(await Lang.get('Starting CandyPack Server...'));
    let child = spawn('node', [__dirname + '/../watchdog.js', 'start'], { detached: true });
    Config.set('watchdog', child.pid);
    Config.set('started', Date.now());
    setInterval(async function(){
        if(global.completed) process.exit(0);
    }, 500);
}

async function init(){
    let pid = Config.get('watchdog');
    if(!pid){
        watchdog();
    } else {
        ps.lookup({ pid: pid }, function(err, resultList ) {
            if(err) throw new Error(err);
            if(!resultList){
                watchdog();
            } else {
                let process = resultList[0];
                if(!process) watchdog();
            }
        });
    }
}

async function start(){
    Config.set('pid', process.pid);
    Config.set('started', Date.now());
    Service.init();
    Web.init();
    setTimeout(function(){
        let t = setInterval(function(){
            Config.load();
            Service.check();
            Web.check();
        }, 1000);
    }, 1000);
}

function stop(){
    return new Promise((resolve, reject) => {
        if(!check()) return resolve();
        try {
            process.kill(Config.get('watchdog'), 'SIGTERM');
            process.kill(Config.get('pid'), 'SIGTERM');
            Service.stopAll();
        } catch(e) {
        }
        Config.set('pid', null);
        Config.set('started', null);
        return resolve();
    });
}

module.exports = {
    check: check,
    init: async function() {
        return new Promise(async function(resolve, reject){
            var args = process.argv.slice(2);
            switch(args[0]){
                case 'restart':
                    log(await Lang.get('Restarting CandyPack Server...'));
                    await stop();
                    init();
                    return resolve();
                    break;
                case 'start':
                    if(global.trigger == 'cli') await start();
                    else Service.start(args[1]);
                    return resolve();
                    break;
                case 'services': {
                    let services = await Service.status();
                    let data = [];
                    Cli.log('');
                    Cli.log('CandyPack');
                    Cli.log('');
                    if(services.length == 0){
                        Cli.log(' ', Lang.get('No services found.'));
                        Cli.log(' ');
                        return resolve();
                    }
                    Cli.log(' ', Lang.get('Services') + ': ', services.length);
                    for(const service of services){
                        let status = 'Stopped';
                        if(service.active) status = service.status == 'running' ? 'Running' : service.status.charAt(0).toUpperCase() + service.status.slice(1);
                        let row = {};
                        row['ID'] = {
                            content: service.id,
                            direction: 'right'
                        };
                        row[Lang.get('Name')] = service.name;
                        row['PID'] = service.status == 'running' ? service.pid : '-';
                        row[Lang.get('Uptime')] = service.uptime;
                        row[Lang.get('Status')] = Lang.get(status);
                        row[Lang.get('Active')] = service.active ? '\u2713' : '\u2717';
                        data.push(row);
                    }
                    Cli.table(data);
                    Cli.log(' ');
                    return resolve();
                    break;
                }
                case 'websites': {
                    let websites = await Web.status();
                    Cli.log('');
                    Cli.log('CandyPack');
                    Cli.log('');
                    if(Object.keys(websites).length == 0){
                        Cli.log(' ', Lang.get('No websites found.'));
                        Cli.log(' ');
                        return resolve();
                    }
                    Cli.log(' ', Lang.get('Websites') + ': ', Object.keys(websites).length);
                    let data = [];
                    for(const website of Object.keys(websites)){
                        let row = {};
                        row[Lang.get('Domain')] = website;
                        data.push(row);
                    }
                    Cli.table(data);
                    Cli.log(' ');
                    return resolve();
                    break;
                }
                case 'create':
                    log('\n\x1b[35mCandyPack \x1b[0m');
                    await Web.create();
                    break;
                case 'monit':
                    Cli.monitor();
                    break;
            }
            if(!(await check())) init();
            setTimeout(async function(){ return resolve(); }, 1000);
        });
    },
    uptime: async function(){
        return new Promise(async function(resolve, reject){
            if(!Config.get('started')) return resolve(0);
            var uptime = Date.now() - Config.get('started');
            let seconds = Math.floor(uptime / 1000);
            let minutes = Math.floor(seconds / 60);
            let hours = Math.floor(minutes / 60);
            let days = Math.floor(hours / 24);
            seconds %= 60;
            minutes %= 60;
            hours %= 24;
            let uptimeString = '';
            if(days) uptimeString += days + 'd ';
            if(hours) uptimeString += hours + 'h ';
            if(minutes) uptimeString += minutes + 'm ';
            if(seconds) uptimeString += seconds + 's';
            return resolve(uptimeString);
        });
    },
    services: async function(){
        return new Promise((resolve, reject) => {
            let services = Config.get('services') ?? [];
            let running = 0;
            for(const service of services) if(service.active && service.status == 'running') running++;
            return resolve(running);
        });
    },
    home: os.homedir() + '/.candypack'
};
