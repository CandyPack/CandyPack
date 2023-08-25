
const fs = require('fs');
const os = require("os");
const readline = require('readline');

const userHomeDir = os.homedir();
const dir  = userHomeDir + '/.candypack';
const file = dir + '/config.json';

var config = {};

async function init() {
    if(!fs.existsSync(dir)) fs.mkdirSync(dir);
    if(!fs.existsSync(file)) save();
    else await load();
}

async function save() {
    fs.writeFile(file, JSON.stringify(config), 'utf8', function(err) {
        if(err) log(err);
    });
}

async function load() {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', function(err, data) {
            if(err){
                save();
                resolve();
            }
            config = JSON.parse(data);
            resolve();
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
        save();
    },
    load: load
};