class Cli {

    #backgrounds = { red    :  41,
                     green  :  42,
                     yellow :  43,
                     blue   :  44,
                     magenta:  45,
                     white  :  47,
                     gray   : 100 };
    #colors      = { red    :  31,
                     green  :  32,
                     yellow :  33,
                     blue   :  34,
                     magenta:  35,
                     white  :  37,
                     gray   :  90 };

                        
                    
    #commands = {
        auth: {
            args: ['key'],
            description: "Define your server to your CandyPack account"
        },
        debug: {
            description: "Debug CandyPack Server",
            action: async() => this.debug()
        },
        help: {
            description: "List all available commands",
            action: async() => this.#help()
        },
        monit: {
            description: "Monitor Website or Service",
            action: async() => this.monitor()
        },
        restart: {
            description: "Restart CandyPack Server",
            action: async() => Candy.Server.restart()
        },
        run: {
            args: ['file'],
            description: "Add a new Service",
            action: async(args) => {
                let service = args[0];
                await this.#call({ action: 'service.start', data: [ service ] });
            }
        },

        mail: {
            title: 'MAIL',
            sub: {
                create: {
                    description: "Create a new mail account",
                    action: async() => await this.#call({ action: 'mail.create',   data: [ await this.question(await __('Enter the e-mail address: ')),
                                                                                         await this.question(await(__('Enter the password: '))),
                                                                                         await this.question(await(__('Re-enter the password: '))) ]})
                },
                delete: {
                    description: "Delete a mail account",
                    action: async() => await this.#call({ action: 'mail.delete',   data: [ await this.question(await(__('Enter the e-mail address: '))) ]})
                },
                list: {
                    description: "List all domain mail accounts",
                    action: async() => await this.#call({ action: 'mail.list',     data: [ await this.question(await(__('Enter the domain name: '))) ]})
                },
                password: {
                    description: "Change mail account password",
                    action: async() => await this.#call({ action: 'mail.password', data: [ await this.question(await(__('Enter the e-mail address: '))),
                                                                                           await this.question(await(__('Enter the new password: '))),
                                                                                           await this.question(await(__('Re-enter the new password: '))) ]})
                }
            }
        },
        ssl: {
            title: 'SSL',
            sub: {
                renew: {
                    description: "Renew SSL certificate for a domain",
                    action: async() => await this.#call({action: 'ssl.renew', data: [await this.question(await __('Enter the domain name: '))]})
                }
            }
        },
        subdomain: {
            title: 'SUBDOMAIN',
            sub: {
                create: {
                    description: "Create a new subdomain",
                    action: async() => await this.#call({action: 'subdomain.create', data: [await this.question(await __('Enter the subdomain name (subdomain.example.com): '))]})
                },
                list: {
                    description: "List all domain subdomains",
                    action: async() => await this.#call({action: 'subdomain.list', data: [await this.question(await __('Enter the domain name: '))]})
                }
            }
        },
        web: {
            title: 'WEBSITE',
            sub: {
                create: {
                    description: "Create a new website",
                    action: async() => {
                        let domain = await this.question('Enter the domain name: ')
                        let path = Candy.ext.path.resolve().replace(/\\/g, '/') + '/' + domain + '/';
                        await this.#call({action: 'web.create', data: [domain, await this.question((await __('Enter the path to the website (%s): ', path))) ?? path]});
                    }
                },
                list: {
                    description: "List all websites",
                    action: async() => await this.#call({action: 'web.list'})
                }
            }
        }
    }
    current  = '';
    #modules = ['api', 'candy', 'cli', 'client', 'config', 'dns', 'lang', 'mail', 'server', 'service', 'ssl', 'storage', 'subdomain', 'web'];
    rl;
    selected = 0;
    websites = {};
    services = [];
    domains  = [];
    logs     = {content: [], mtime: null, selected: null};
    printing = false;
    logging  = false;
    width;
    height;
    #watch = [];

    close(){
        if(this.rl) this.rl.close();
    }

    #call(command){
        if(!command) return;
        Candy.ext.axios.post('http://127.0.0.1:1453', command, { headers: { 'Authorization': Candy.config.api.auth }})
            .then((response) => {
                if(response.data.message) this.log(response.data.message);
                this.close();
            }).catch((error) => {
                this.log(error);
            });
    }

    #color(text, color, ...args){
        let output = text;
        if(this.#colors[color]) output = '\x1b[' + this.#colors[color] + 'm' + output + '\x1b[0m';
        for(const arg of args){
            if(this.#backgrounds[arg]) output = '\x1b[' + this.#backgrounds[arg] + 'm' + output + '\x1b[0m';
            if(arg == 'bold') output = '\x1b[1m' + output + '\x1b[0m';
        }
        return output;
    }

    async debug(){
        process.stdout.write(process.platform === 'win32' ? `title CandyPack Debug\n` : `\x1b]2;CandyPack Debug\x1b\x5c`);
        await this.#debug();
        setInterval(() => this.#debug(), 250);
        this.rl = Candy.ext.readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.rl.input.on('keypress', (key, data) => {
            if(data.ctrl && data.name == 'c') {
                process.stdout.write('\x1Bc');
                process.exit(0);
            }
            if(data.name == 'up') if(this.selected > 0) this.selected--;
            if(data.name == 'down') if(this.selected + 1 < this.domains.length + this.services.length) this.selected++;
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            this.#debug();
        });
        this.rl.on('close', () => {
            process.stdout.write('\x1Bc');
            process.exit(0);
        });
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }

    #debug(){
        if(this.printing) return;
        this.printing = true;
        this.websites = Candy.config.websites ?? [];
        this.services = Candy.config.services ?? [];
        this.domains = Object.keys(this.websites);
        this.width = process.stdout.columns - 5;
        this.height = process.stdout.rows - 2;
        this.#load();
        let c1 = (this.width / 12) * 3;
        if(c1 % 1 != 0) c1 = Math.floor(c1);
        if(c1 > 50) c1 = 50;
        let result = '';
        result = this.#color('\n' + this.#spacing('CANDYPACK', this.width, 'center') + '\n\n', 'magenta', 'bold');
        result += this.#color(' ┌', 'gray');
        let service = -1;
        result += this.#color('─'.repeat(5), 'gray');
        let title = this.#color(__('Modules'), null);
        result += ' ' + this.#color(title) + ' ';
        result += this.#color('─'.repeat(c1 - title.length - 7), 'gray');
        service++;
        result += this.#color('┬', 'gray');
        result += this.#color('─'.repeat(5), 'gray');
        title = this.#color(__('Logs'), null);
        result += ' ' + this.#color(title) + ' ';
        result += this.#color('─'.repeat(this.width - c1 - title.length - 7), 'gray');
        result += this.#color('┐ \n', 'gray');
        for(let i = 0; i < this.height - 6; i++){
            if(this.#modules[i]){
                result += this.#color(' │', 'gray');
                result += this.#color('[' + (this.#watch.includes(i) ? 'X' : ' ') + '] ', i == this.selected ? 'blue' : 'white', i == this.selected ? 'white' : null, i == this.selected ? 'bold' : null);
                result += this.#color(this.#spacing(this.#modules[i] ? this.#modules[i] : '', c1 - 4), i == this.selected ? 'blue' : 'white', i == this.selected ? 'white' : null, i == this.selected ? 'bold' : null);
                result += this.#color('│', 'gray');
            } else {
                result += this.#color(' │', 'gray');
                result += ' '.repeat(c1);
                result += this.#color('│', 'gray');
            }
            if(this.logs.selected == this.selected){
                result += this.#spacing(this.logs.content[i] ? this.logs.content[i] : ' ', this.width - c1);
            } else {
                result += ' '.repeat(this.width - c1);
            }
            result += this.#color('│\n', 'gray');
        }
        result += this.#color(' └', 'gray');
        result += this.#color('─'.repeat(c1), 'gray');
        result += this.#color('┴', 'gray');
        result += this.#color('─'.repeat(this.width - c1), 'gray');
        result += this.#color('┘ \n', 'gray');
        result += this.#color('\n' + this.#spacing('Select a module to watch', this.width, 'center') + '\n', 'gray');
        if(result !== this.current){
            this.current = result;
            process.stdout.clearLine(0);
            process.stdout.write('\x1Bc');
            process.stdout.write(result);
        }
        this.printing = false;
    }

    #format(text, raw){
        if(typeof text !== 'string') return text;
        let output = text.toString();
        if(output.toString().length > 1){
            let begin = '';
            let end = '';
            while(output.substr(output.length - 1) == ' '){
                end += ' ';
                output = output.substr(0, output.length - 1);
            }
            while(output.substr(0, 1) == ' '){
                begin += ' ';
                output = output.substr(1);
            }
            if(output.substr(output.length - 1) == ':'){
                end = ':';
                output = output.substr(0, output.length - 1);
            }
            output = begin + output + end;
        }
        if(!raw){
            if(text == 'CandyPack')   output = this.#color(output, 'magenta');
            if(text == __('Running')) output = this.#color(output, 'green');
            if(text == '\u2713')      output = this.#color(output, 'green');
            if(text == '\u2717')      output = this.#color(output, 'red');
        }
        return output;
    }

    async #detail(command, obj){
        let result = "";
        let space = 0;
        if(obj.title) result += "\n\x1b[90m" + await obj.title + "\x1b\n";
        if(obj.description){
            let args = obj.args ? ' <' + obj.args.join('> <') + '>' : '';
            let line = '\x1b[91mcandy ' + command + '\x1b[0m\x1b[90m' + args + '\x1b[0m : ' + (await __(obj.description));
            result += line;
            line = line.split(':')[0];
            if(line.length > space) space = line.length;
        }
        if(obj.sub){
            let lines = [];
            for(const sub in obj.sub){
                let detail = await this.#detail(command + " " + sub, obj.sub[sub]);
                lines.push(detail.result);
                if(detail.space > space) space = detail.space;
            }
            result += lines.join("\n");
        }
        
        return {result: result, space: space};
    }

    async #help(commands) {
        let result = [];
        let space = 0;
        if(typeof commands == 'string'){
            let obj = this.#commands;
            let command = commands.shift();
            if(!obj[command]) return log(__(`'%s' is not a valid command.`, this.#color(`candy ${commands.join(' ')}`, 'yellow')));
            obj = obj[command];
            while(commands.length > 0 && commands.length && obj.sub[commands[0]]){
                command = commands.shift();
                if(!obj.sub[command]) return log(__(`'%s' is not a valid command.`, this.#color(`candy ${commands.join(' ')}`, 'yellow')));
                obj = obj.sub[command];
            }
            let detail = await this.#detail(command, obj);
            if(detail.space > space) space = detail.space;
            let lines = detail.result.split("\n");
            for(let line of lines) result.push(line);
        } else {
            for(const command in this.#commands){
                if(commands && commands !== true && commands[0] !== command) continue;
                let obj = this.#commands[command];
                if(commands === true && !obj.action) continue;
                let detail = (await this.#detail(command, obj));
                if(detail.space > space) space = detail.space;
                let lines = detail.result.split("\n");
                for(let line of lines) result.push(line);
            }
            result = result.map((line) => {
                if(line.includes(':')){
                    let parts = line.split(':');
                    parts[0] = parts[0] + ' '.repeat(space - parts[0].length);
                    line = parts.join(':');
                }
                return line;
            });
        }
        result.push("");
        for(let line of result) log(line);
    }

    #icon(status, selected){
        if(status == 'running') return this.#color(' \u25B6 ', 'green', selected ? 'white' : null);
        if(status == 'stopped') return this.#color(' \u23F8 ', 'yellow', selected ? 'white' : null);
        if(status == 'errored') return this.#color(' ! ', 'red', selected ? 'white' : null);
        return '   ';
    }

    init() {
        if(global.trigger == 'cli') return;
        log("\n",'CandyPack');
        let args = process.argv.slice(2);
        let cmds = process.argv.slice(2);
        if(args.length == 0) return this.#status();
        let command = args.shift();
        if(!this.#commands[command]) return log(__(`'%s' is not a valid command.`, this.#color(`candy ${cmds.join(' ')}`, 'yellow')));
        let action = this.#commands[command];
        while(args.length > 0 && !action.args) {
            command = args.shift();
            if(!action.sub || !action.sub[command]) return this.#help(cmds);
            action = action.sub[command];
        }
        if(action.action) return action.action(args);
        else return this.#help(cmds);
    }

    #length(text){
        return this.#value(text, true).toString().replace(/\x1b\[[0-9;]*m/g, '').length;
    }

    async #load(){
        if(this.logging) return;
        this.logging = true;
        this.logs.selected = this.selected;
        let file = null;
        if(this.selected < this.domains.length){
            file = Candy.ext.os.homedir() + '/.candypack/logs/' + this.domains[this.selected] + '.log';
        } else if(this.selected - this.domains.length < this.services.length){
            file = Candy.ext.os.homedir() + '/.candypack/logs/' + this.services[this.selected - this.domains.length].name + '.log';
        } else {
            this.logging = false;
            return;
        }
        let log = '';
        let mtime = null;
        if(Candy.ext.fs.existsSync(file)){
            mtime = Candy.ext.fs.statSync(file).mtime;
            if(this.selected == this.logs.selected && mtime == this.logs.mtime) return;
            log = Candy.ext.fs.readFileSync(file, 'utf8');
        }
        this.logs.content = log.trim().replace(/\r\n/g, '\n').split('\n').map((line) => {
            if('[LOG]' == line.substr(0, 5)){
                line = line = line.substr(5);
                let date = parseInt(line.substr(1, 13));
                line = this.#color('[' + new Date(date).toLocaleString() + ']', 'green', 'bold') + line.substr(15);
            } else if ('[ERR]' == line.substr(0, 5)){
                line = line = line.substr(5);
                let date = parseInt(line.substr(1, 13));
                line = this.#color('[' + new Date(date).toLocaleString() + ']', 'red', 'bold') + line.substr(15);
            }
            return line;
        }).slice(-this.height + 4);
        this.logs.mtime = mtime;
        this.logging = false;
    }
    
    async log(...args) {
        let output = [];
        for(let i = 0; i < args.length; i++){
            if(typeof args[i] != 'string') output.push(args[i]);
            else output.push(this.#format(args[i]));
        }
        console.log(...output);
    }

    async monitor() {
        process.stdout.write(process.platform === 'win32' ? `title CandyPack Monitor\n` : `\x1b]2;CandyPack Monitor\x1b\x5c`);
        await this.#monitor();
        setInterval(() => this.#monitor(), 250);
        this.rl = Candy.ext.readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.rl.input.on('keypress', (key, data) => {
            if(data.ctrl && data.name == 'c') {
                process.stdout.write('\x1Bc');
                process.exit(0);
            }
            if(data.name == 'up') if(this.selected > 0) this.selected--;
            if(data.name == 'down') if(this.selected + 1 < this.domains.length + this.services.length) this.selected++;
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            this.#monitor();
        });
        this.rl.on('close', () => {
            process.stdout.write('\x1Bc');
            process.exit(0);
        });
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
    }

    #monitor(){
        if(this.printing) return;
        this.printing = true;
        this.websites = Candy.config.websites ?? [];
        this.services = Candy.config.services ?? [];
        this.domains = Object.keys(this.websites);
        this.width = process.stdout.columns - 5;
        this.height = process.stdout.rows - 2;
        this.#load();
        let c1 = (this.width / 12) * 3;
        if(c1 % 1 != 0) c1 = Math.floor(c1);
        if(c1 > 50) c1 = 50;
        let result = '';
        result = this.#color('\n' + this.#spacing('CANDYPACK', this.width, 'center') + '\n\n', 'magenta', 'bold');
        result += this.#color(' ┌', 'gray');
        let service = -1;
        if(this.domains.length){
            result += this.#color('─'.repeat(5), 'gray');
            let title = this.#color(__('Websites'), null);
            result += ' ' + this.#color(title) + ' ';
            result += this.#color('─'.repeat(c1 - title.length - 7), 'gray');
        } else if(this.services.length){
            result += this.#color('─'.repeat(5), 'gray');
            let title = this.#color(__('Services'), null);
            result += ' ' + this.#color(title) + ' ';
            result += this.#color('─'.repeat(c1 - title.length - 7), 'gray');
            service++;
        } else {
            result += this.#color('─'.repeat(c1), 'gray');
        }
        result += this.#color('┬', 'gray');
        result += this.#color('─'.repeat(this.width - c1), 'gray');
        result += this.#color('┐ \n', 'gray');
        for(let i = 0; i < this.height - 4; i++){
            if(this.domains[i]){
                result += this.#color(' │', 'gray');
                result += this.#icon(this.websites[this.domains[i]].status ?? null, i == this.selected);
                result += this.#color(this.#spacing(this.domains[i] ? this.domains[i] : '', c1 - 3), i == this.selected ? 'blue' : 'white', i == this.selected ? 'white' : null, i == this.selected ? 'bold' : null);
                result += this.#color('│', 'gray');
            } else if(this.services.length && service == -1){
                result += this.#color(' ├','gray');
                result += this.#color('─'.repeat(5), 'gray');
                let title = this.#color(__('Services'), null);
                result += ' ' + this.#color(title) + ' ';
                result += this.#color('─'.repeat(c1 - title.length - 7), 'gray');
                result += this.#color('┤','gray');
                service++;
            } else if(service >= 0 && service < this.services.length){
                result += this.#color(' │', 'gray');
                result += this.#icon(this.services[service].status ?? null, i - 1 == this.selected);
                result += this.#color(this.#spacing(this.services[service].name, c1 - 3), i - 1 == this.selected ? 'blue' : 'white', i - 1 == this.selected ? 'white' : null, i - 1 == this.selected ? 'bold' : null);
                result += this.#color('│', 'gray');
                service++;
            } else {
                result += this.#color(' │', 'gray');
                result += ' '.repeat(c1);
                result += this.#color('│', 'gray');
            }
            if(this.logs.selected == this.selected){
                result += this.#spacing(this.logs.content[i] ? this.logs.content[i] : ' ', this.width - c1);
            } else {
                result += ' '.repeat(this.width - c1);
            }
            result += this.#color('│\n', 'gray');
        }
        result += this.#color(' └', 'gray');
        result += this.#color('─'.repeat(c1), 'gray');
        result += this.#color('┴', 'gray');
        result += this.#color('─'.repeat(this.width - c1), 'gray');
        result += this.#color('┘ \n', 'gray');
        if(result !== this.current){
            this.current = result;
            process.stdout.clearLine(0);
            process.stdout.write('\x1Bc');
            process.stdout.write(result);
        }
        this.printing = false;
    }

    #spacing(text, len, direction){
        if(direction == 'right') return ' '.repeat(len - this.#length(text)) + text;
        if(direction == 'center') return ' '.repeat(Math.floor((len - this.#length(text)) / 2)) + text + ' '.repeat(Math.ceil((len - this.#length(text)) / 2))
        if(this.#length(text) > len) return text.substr(0, len);
        return text + ' '.repeat(len - this.#length(text));
    }

    async #status(){
        let status = {
            online:   false,
            services: 0,
            auth:     false,
            uptime:   0
        };
        status.online   = await Candy.Server.check();
        status.uptime   = await Candy.Server.uptime();
        status.services = await Candy.Server.services();
        status.websites = Candy.config.websites ? Object.keys(Candy.config.websites).length : 0;
        var args = process.argv.slice(2);
        if(global.trigger == 'candy'){
            if(args.length == 0){
                let length = 0;
                for(let i = 0; i < 2; i++){
                    for (let iterator of ['Status', 'Uptime', 'Websites', 'Services', 'Auth']) {
                        let title = await __(iterator);
                        if(title.length > length) length = title.length;
                        if(i){
                            let space = '';
                            for(let j = 0; j < length - title.length; j++) space += ' ';
                            switch(iterator){
                                case 'Status':
                                    log(title + space + ' : ' + (status.online ? '\x1b[32m ' + await __('Online')    : '\x1b[33m ' + await __('Offline'))       + '\x1b[0m');
                                    break;
                                case 'Uptime':
                                    if(status.online) log(title + space + ' : ' + '\x1b[32m ' + status.uptime + '\x1b[0m');
                                    break;
                                case 'Websites':
                                    if(status.online) log(title + space + ' : ' + '\x1b[32m ' + status.websites + '\x1b[0m');
                                    break;
                                case 'Services':
                                    if(status.online) log(title + space + ' : ' + '\x1b[32m ' + status.services + '\x1b[0m');
                                    break;
                                case 'Auth':
                                    log(title + space + ' : ' + (status.auth   ? '\x1b[32m ' + await __('Logged in') : '\x1b[33m ' + await __('Not logged in')) + '\x1b[0m');
                                    break;
                            }
                        }
                    }
                }
                if(!status.auth) log(await __('Login on %s to manage all your server operations.', '\x1b[95mhttps://candypack.dev\x1b[0m'));
                log();
                log(await __('Commands:'));
                length = 0;
                this.#help(true);
                log('');
            }
        }
    }

    table(input) {
        let result = '';
        let width = [];
        for (const row of input) {
            for (const key of Object.keys(row)) {
                if(input.indexOf(row) == 0) width[key] = this.#length(key);
                if(this.#length(row[key]) > width[key]) width[key] = this.#length(row[key]);
            }
        }
        for (const row of input) {
            let insert = '';
            if(input.indexOf(row) == 0){
                result += '┌─';
                for(const key of Object.keys(row)) result += '─'.repeat(width[key]) + '─┬─';
                result = this.#color(result.substr(0, result.length - 3) + '─┐\n', 'gray');
                result += this.#color('│ ', 'gray');
                for(const key of Object.keys(row)){
                    result += this.#color(this.#value(key), 'blue') + ' '.repeat(width[key] - this.#length(key)) + this.#color(' │ ', 'gray');
                }
                result += '\n';
            }
            insert += '├─';
            for(const key of Object.keys(row)) insert += '─'.repeat(width[key]) + '─┼─';
            insert = insert.substr(0, insert.length - 3) + '─┤\n';
            insert += '│ ';
            result += this.#color(insert, 'gray');
            for(const key of Object.keys(row)){
                result += this.#value(row[key]) + ' '.repeat(width[key] - this.#length(row[key])) + this.#color(' │ ', 'gray');
            }
            result += '\n';
        }
        insert = '└─';
        for(const key of Object.keys(input[0])) insert += '─'.repeat(width[key]) + '─┴─';
        insert = insert.substr(0, insert.length - 3) + '─┘';
        result += this.#color(insert, 'gray');
        console.log(result);
    }

    #value(text, raw){
        if(!text) return '';
        let result = '';
        if(typeof text == 'object') result = this.#format(text.content);
        else result = this.#format(text, raw);
        return result;
    }

    question(question){
        return new Promise((resolve, reject) => {
            if(!this.rl){
                this.rl = Candy.ext.readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
            }
            this.rl.question(question, (answer) => {
                return resolve(answer.trim());
            });
        });
    }

}

module.exports = new Cli();