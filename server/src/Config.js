class Config {
    #dir;
    #file;
    #loaded = false;
    #saving = false;
    #changed = false;

    async init() {
        return new Promise(async (resolve, reject) => {
            this.#dir = Candy.ext.os.homedir() + '/.candypack';
            this.#file = this.#dir + '/config.json';
            Candy.config = {};
            if(!Candy.ext.fs.existsSync(this.#dir))  Candy.ext.fs.mkdirSync(this.#dir);
            if(!Candy.ext.fs.existsSync(this.#file)) this.#save();
            else await this.#load();
            if(global.trigger === 'cli') setInterval(() => this.#save(), 500);
            Candy.config = this.#proxy(Candy.config);
            return resolve();
        });
    }

    async #load() {
        return new Promise((resolve, reject) => {
            if(this.#saving && this.#loaded) return resolve();
            if(!Candy.ext.fs.existsSync(this.#file)){
                this.#loaded = true;
                return resolve();
            }
            Candy.ext.fs.readFile(this.#file, 'utf8', (err, data) => {
                if(err){
                    console.log(err);
                    this.#loaded = true;
                    this.#save();
                    return resolve();
                }
                try {
                    data = JSON.parse(data);
                    this.#loaded = true;
                } catch(e) {
                    this.#loaded = true;
                    if(data.length > 2){
                        var backup = this.#dir + '/config-corrupted.json';
                        if(Candy.ext.fs.existsSync(file)) Candy.ext.fs.copyFileSync(file, backup);
                    }
                    if(Candy.ext.fs.existsSync(this.#file + '.bak')){
                        Candy.ext.fs.readFile(this.#file + '.bak', 'utf8', (err, data) => {
                            if(err){
                                console.log(err);
                                this.#save(true);
                                return resolve();
                            }
                            try {
                                data = JSON.parse(data);
                                this.#save(true);
                            } catch(e) {
                                console.log(e);
                                this.#save(true);
                            }
                            Candy.config = data;
                            return resolve();
                        });
                    }
                    this.#save(true);
                }
                Candy.config = data;
                return resolve();
            });
        });
    }

    #proxy(target) {
        if (typeof target !== 'object' || target === null) return target;
        const handler = {
            get: (obj, prop) => {
                const value = obj[prop];
                if(typeof value === 'object' && value !== null) return this.#proxy(value);
                return value;
            },
            set: (obj, prop, value) => {
                obj[prop] = typeof value === 'object' && value !== null ? this.#proxy(value) : value;
                this.#changed = true;
                obj[prop] = value;
                return true;
            },
            deleteProperty: (obj, prop) => {
                this.#changed = true;
                delete obj[prop];
                return true;
            }
        };
        return new Proxy(target, handler);
    }

    #save() {
        if(this.#saving || !this.#changed) return;
        this.#changed = false;
        this.#saving = true;
        let json = JSON.stringify(Candy.config, null, 4);
        if(json.length < 3) json = '{}';
        Candy.ext.fs.writeFileSync(this.#file, json, 'utf8');
        setTimeout(() => {
            Candy.ext.fs.writeFileSync(this.#file + '.bak', json, 'utf8');
        }, 5000);
        this.#saving = false;
    }
}

module.exports = new Config();