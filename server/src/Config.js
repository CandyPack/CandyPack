
const { log } = require('console');
const fs = require('fs');
const os = require("os");
const readline = require('readline');

const userHomeDir = os.homedir();
const dir  = userHomeDir + '/.candypack';
const file = dir + '/config.json';

var config = {};
var loaded = false;
var saving = false;

async function init() {
    if(!fs.existsSync(dir)) fs.mkdirSync(dir);
    if(!fs.existsSync(file)) save();
    else await load();
    let t = setInterval(function(){
        save(true);
        if(global.trigger == 'candy' && global.completed && !saving) clearInterval(t);
    }, 500);
}

function save(b) {
    if(!saving || !loaded){
        if(!b) saving = true;
        return;
    }
    let json = JSON.stringify(config, null, 4);
    if(json.length < 3) json = '{}';
    fs.writeFileSync(file, json, 'utf8');
    saving = false;
}

async function load() {
    return new Promise((resolve, reject) => {
        if(saving) return resolve();
        fs.readFile(file, 'utf8', function(err, data) {
            if(err){
                loaded = true;
                save(true);
                return resolve();
            }
            try {
                data = JSON.parse(data);
                if(!config.updated || (data.updated && data.updated > config.updated)) config = data;
                loaded = true;
            } catch(e) {
                loaded = true;
                if(data.length > 2){
                    var backup = dir + '/config-' + Date.now() + '.json';
                    fs.copyFileSync(file, backup);
                }
                save(true);
            }
            return resolve();
        });
    });
}

module.exports = {
    init: init,
    get: function(key) {
        return config[key];
    },
    set: function(key, value) {
        config[key] = value;
        config.updated = Date.now();
        save();
    },
    load: load
};