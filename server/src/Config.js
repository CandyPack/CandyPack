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
            Candy.config = new Proxy(Candy.config, {
                set: (target, name, value) => {
                    this.#changed = true;
                    target[name] = value;
                    return true;
                },
                deleteProperty: (target, name) => {
                    this.#changed = true;
                    delete target[name];
                    return true;
                }
            });
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
                        var backup = this.#dir + '/config-bak.json';
                        Candy.ext.fs.copyFileSync(file, backup);
                    }
                    this.save(true);
                }
                Candy.config = data;
                return resolve();
            });
        });
    }

    #save() {
        if(this.#saving || !this.#changed) return;
        this.#changed = false;
        this.#saving = true;
        let json = JSON.stringify(Candy.config, null, 4);
        if(json.length < 3) json = '{}';
        Candy.ext.fs.writeFileSync(this.#file, json, 'utf8');
        this.#saving = false;
    }
}

module.exports = new Config();