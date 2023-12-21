var spawn = require('child_process').spawn;
const { log } = require('console');
const ps = require('ps-node');
const path = require('path');
const fs = require('fs');
const os = require("os");

const Config = require('./Config.js');
const Lang = require('./Lang.js');

var services = [];
var watcher = {};
var loaded = false;
var logs = {};
var errs = {};
var error_counts = {};
var active = {};

function get(id){
    if(!loaded && services.length == 0){
        services = Config.get('services') ?? [];
        loaded = true;
    }
    for (const service of services){
        if(service.id == id || service.name == id || service.file == id){
            service.id = services.indexOf(service);
            return service;
        }
    }
    return false;
}

function add(file){
    let name = path.basename(file);
    if(name.substr(-3) == '.js') name = name.substr(0, name.length - 3);
    service = {
        id: services.length,
        name: path.basename(file),
        file: file,
        active: true
    };
    services.push(service);
    services[service.id] = service;
    Config.set('services', services);
    log(Lang.get('Service %s added.', file));
}


function set(id, key, value){
    let service = get(id);
    if(service){
        if(typeof key == 'object'){
            for(const k in key) service[k] = key[k];
        } else {
            service[key] = value;
        }
    } else {
        return false;
    }
    services[service.id] = service;
    Config.set('services', services);
}

async function check(){
    services = Config.get('services') ?? [];
    for(const service of services) {
        if(service.active){
            if(!service.pid){
                run(service.id);
            } else {
                if(!watcher[service.pid]){
                    try {
                        process.kill(service.pid, 'SIGTERM');
                    } catch(e) {
                    }
                    run(service.id);
                    services[service.id].pid = null;
                }
            }
        }
        services[services.indexOf(service)] = service;
        if(logs[service.id]) fs.writeFile(os.homedir() + '/.candypack/logs/' + service.name + '.log', logs[service.id], 'utf8', function(err) {
            if(err) console.log(err);
        });
        if(errs[service.id]) fs.writeFile(os.homedir() + '/.candypack/logs/' + service.name + '.err.log', errs[service.id], 'utf8', function(err) {
            if(err) console.log(err);
        });
    }
}

async function run(id){
    if(active[id]) return;
    active[id] = true;
    let service = services[id];
    if(error_counts[id] > 5) return;
    if(service.status == 'errored' && (Date.now() - service.updated < error_counts[id] * 1000 || error_counts[id] > 10)) return;
    var child = spawn('node', [service.file]);
    let pid = child.pid;
    child.stdout.on('data', function(data) {
        if(!logs[id]) logs[id] = '';
        logs[id] += '[' + Date.now() + '] ' + data.toString();
        if(logs[id].length > 1000000) logs[id] = logs[id].substr(logs[id].length - 1000000);
    });
    child.stderr.on('data', function(data) {
        if(!errs[id]) errs[id] = '';
        errs[id] += '[' + Date.now() + '] ' + data.toString();
        if(errs[id].length > 1000000) errs[id] = errs[id].substr(errs[id].length - 1000000);
        set(id, {
            // pid: null,
            // started: null,
            status: 'errored',
            updated: Date.now()
        });
        watcher[pid] = false;
        error_counts[id] = error_counts[id] ?? 0;
        error_counts[id]++;
        active[id] = false;
    });
    child.on('exit', function(code, signal) {
        if(services[id].status == 'running'){
            set(id, {
                // pid: null,
                // started: null,
                status: 'stopped'
            });
            watcher[pid] = false;
            error_counts[id] = error_counts[id] ?? 0;
            error_counts[id]++;
        }
        active[id] = false;
    });
    set(id, {
        active: true,
        pid: pid,
        started: Date.now(),
        status: 'running'
    });
    watcher[pid] = true;
}

module.exports = {
    check: check,
    init: async function() {
        services = Config.get('services') ?? [];
        for (const service of services) {
            fs.readFile(os.homedir() + '/.candypack/logs/' + service.name + '.log', 'utf8', function(err, data) {
                if(!err) logs[service.id] = data.toString();
            });
        }
        loaded = true;
    },
    start: async function(file) {
        return new Promise((resolve, reject) => {
            if(file && file.length > 0) {
                file = path.resolve(file);
                if(fs.existsSync(file)){
                    if(!get(file)) add(file);
                    else log(Lang.get('Service %s already exists.', file));
                } else {
                    log(Lang.get('Service file %s not found.', file));
                }
            } else {
                log(Lang.get('Service file not specified.'));
            }
        });
    },
    stop: async function(id) {
        return new Promise((resolve, reject) => {
            let service = get(id);
            if(service){
                if(service.pid){
                    try {
                        process.kill(service.pid, 'SIGTERM');
                    } catch(e) {
                    }
                    set(id, 'pid', null);
                    set(id, 'started', null);
                    set(id, 'active', false);
                } else {
                    log(Lang.get('Service %s is not running.', id));
                }
            } else {
                log(Lang.get('Service %s not found.', id));
            }
        });
    },
    stopAll: function() {
        for(const service of services){
            if(service.pid){
                try {
                    process.kill(service.pid, 'SIGTERM');
                } catch(e) {
                }
                set(service.id, 'pid', null);
                set(service.id, 'started', null);
                set(service.id, 'active', false);
            }
        }
    },
    status: async function() {
        return new Promise((resolve, reject) => {
            let services = Config.get('services') ?? [];
            for(const service of services){
                if(service.status == 'running'){
                    var uptime = Date.now() - service.started;
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
                    service.uptime = uptimeString;
                }
            }
            return resolve(services);
        });
    }
};