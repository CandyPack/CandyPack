const fs = require('fs');
const { log } = require('console');

var strings = {};

var locale = Intl.DateTimeFormat().resolvedOptions().locale;

var file = __dirname + '/../lang/' + locale + '.json';

async function save() {
    fs.writeFile(file, JSON.stringify(strings), 'utf8', function(err) {
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
            try{
                strings = JSON.parse(data);
            }catch(e){
                save();
            }
            resolve();
        });
    });
}

module.exports = {
    init: async function() {
        if(!fs.existsSync(file)) save();
        else await load();
    },
    get: function(key) {
        if(!strings[key]) {
            strings[key] = key;
            save();
        }
        return strings[key];
    }
}