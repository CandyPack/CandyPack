const { log } = require('console');
const fs = require('fs');
const os = require("os");
const readline = require('readline');

const userHomeDir = os.homedir();
const dir  = userHomeDir + '/.candypack';
const file = dir + '/config.json';

var config = {};
var loaded = false;
global.saving = false;

async function init() {
    if(!fs.existsSync(dir)) fs.mkdirSync(dir);
    if(!fs.existsSync(file)) save();
    else await load();
    let t = setInterval(function(){
        save(true);
        if(global.trigger == 'candy' && global.completed && !global.saving) clearInterval(t);
    }, 500);
}

function save(b) {
    if(!global.saving || !loaded){
        if(!b) global.saving = true;
        return;
    }
    let json = JSON.stringify(config, null, 4);
    if(json.length < 3) json = '{}';
    fs.writeFileSync(file, json, 'utf8');
    global.saving = false;
}

async function load() {
    return new Promise((resolve, reject) => {
        if(global.saving && loaded) return resolve();
        if(!fs.existsSync(file)){
            loaded = true;
            return resolve();
        }
        fs.readFile(file, 'utf8', function(err, data) {
            if(err){
                console.log(err);
                loaded = true;
                save(true);
                return resolve();
            }
            try {
                data = JSON.parse(data);
                if(!config.updated || (data.updated && data.updated > config.updated)) config = data;
                loaded = true;
            } catch(e) {
                console.log(e);
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
    get: function(...keys) {
        let value = config;
        for(let key of keys){
            if(!value[key]) return null;
            value = value[key];
        }
        return value;
    },
    set: function(key, value) {
        config[key] = value;
        config.updated = Date.now();
        save();
    },
    load: load
};