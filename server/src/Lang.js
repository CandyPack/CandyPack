var locale = Intl.DateTimeFormat().resolvedOptions().locale;
var file = __dirname + '/../lang/' + locale + '.json';
var strings = {};
var saving = false;
var queue = false;

async function save() {
    if(saving){
        if(queue) return;
        queue = true;
        setTimeout(save, 200);
        return;
    }
    saving = true;
    return new Promise((resolve, reject) => {
        Candy.ext.fs.writeFile(file, JSON.stringify(strings, null, 4), 'utf8', function(err) {
            if(err) log(err);
            saving = false;
            return resolve();
        });
    });
}

async function load() {
    return new Promise((resolve, reject) => {
        Candy.ext.fs.readFile(file, 'utf8', function(err, data) {
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
        if(!Candy.ext.fs.existsSync(file)) save();
        else await load();
    },
    get: function(key, ...args) {
        if(key == 'CandyPack') return 'CandyPack';
        if(!strings[key]) {
            strings[key] = key;
            save();
        }
        let text = strings[key];
        if(args.length > 0) {
            for(var i = 0; i < args.length; i++) {
                text = text.replace('%s', args[i]);
            }
        }
        return text;
    }
}