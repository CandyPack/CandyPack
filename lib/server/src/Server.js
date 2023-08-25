const { log } = require('console');
const Config = require('./Config.js');
const Service = require('./Service.js');

const { exec } = require('child_process');
var ps = require('ps-node');

async function check(){
    return new Promise((resolve, reject) => {
        if(!Config.get('pid')) resolve(false);
        ps.lookup({ pid: Config.get('pid') }, function(err, resultList ) {
            if(err) throw new Error(err);
            var process = resultList[0];
            if(process) resolve(true);
            else resolve(false);
        });
    });
}

async function init(){
    return new Promise((resolve, reject) => {
        exec('node ' + __dirname + '/../cli.js start > /dev/null 2>&1', (err, stdout, stderr) => {
            if (err) {
                log(err);
                resolve(false);
            }
            resolve(true);
        });
    });
}

async function start(){
    Config.set('pid', process.pid);
    await Service.init();
}

async function stop(){
    if(!check()) return;
    try{
        process.kill(Config.get('pid'), 'SIGTERM');
    }catch(e){
        
    }
}

module.exports = {
    check: check,
    init: async function() {
        return new Promise(async function(resolve, reject){
            var args = process.argv.slice(2);
            if(args[0] == 'restart'){
                log('Restarting CandyPack Server...');
                await stop();
                await init();
                return resolve();
            }
            if(await check()) return resolve();
            if(args[0] == 'start'){
                await start();
                return resolve(true);
            }
            init();
            setTimeout(async function(){ return resolve(); }, 2000);
        });
    }
};