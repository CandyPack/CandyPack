const spawn = require('child_process').spawn;
const fs = require('fs');
const os = require("os");

const logdir = os.homedir() + '/.candypack/logs/';
var watchdog = process.pid;
var log = "";
var err = "";
var err_count = 0;
var err_date = 0;
var saving = false;

function save(b){
    if(!b){
        saving = true;
        return;
    }
    if(!saving) return;
    fs.writeFile(logdir + '.candypack.log', log, 'utf8', function(error) {
        if(error) console.log(error);
        fs.writeFile(logdir + '.candypack_err.log', err, 'utf8', function(err) {
            if(error) console.log(error);
            saving = false;
        });
    });
}

async function check(){
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(os.homedir() + '/.candypack/config.json')){
            fs.mkdirSync(os.homedir() + '/.candypack/');
            fs.writeFileSync(os.homedir() + '/.candypack/config.json', '{}', 'utf8');
        }
        fs.readFile(os.homedir() + '/.candypack/config.json', 'utf8', function(err, data) {
            if(err){
                data = {};
                data.watchdog = watchdog;
                fs.writeFile(os.homedir() + '/.candypack/config.json', JSON.stringify(data, null, 4), 'utf8', function(err) {
                    if(err) console.log(err);
                });
                return resolve(false);
            }
            data = JSON.parse(data);
            if(data.watchdog && data.watchdog != watchdog){
                try {
                    console.log(data.watchdog);
                    process.kill(data.watchdog, 'SIGTERM');
                } catch(e) { }
            }
            if(data.pid){
                try {
                    process.kill(data.pid, 'SIGTERM');
                } catch(e) { }
            }
            data.watchdog = watchdog;
            data.started = Date.now();
            fs.writeFile(os.homedir() + '/.candypack/config.json', JSON.stringify(data, null, 4), 'utf8', function(err) {
                if(err) console.log(err);
            });
            return resolve(true);
        });
    });
}

async function start() {
    await check();
    if(!fs.existsSync(logdir)) fs.mkdirSync(logdir);
    var child = spawn('node', [__dirname + '/cli.js', 'start'], { detached: true });
    child.stdout.on('data', function(data) {
        log += data.toString();
        save();
    });
    child.stderr.on('data', function(data) {
        err += data.toString();
        save();
    });
    child.on('close', function(){
        if(Date.now() - err_date > 1000 * 60 * 5) err_count = 0;
        err_count++;
        err_date = Date.now();
        if(err_count < 5){
            start();
        } else {
            save();
            setTimeout(process.exit, 1000);
        }
    });
    setInterval(function(){
        save(true);
    }, 1000);
}

start();
