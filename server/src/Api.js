class Api {
    #commands = {
        auth: {
            description: "Define your server to your CandyPack account",
            args: ['key']
        },
        help: {
            description: "List all available commands",
            action: async (command) => {
                return await this.help();
            }
        },
        monit: {
            description: "Monitor Website or Service"
        },
        restart: {
            description: "Restart CandyPack Server"
        },

        subdomain: {
            title: 'SUBDOMAIN',
            sub: {
                create: {
                    description: "Create a new subdomain"
                }
            }
        },
        web: {
            title: 'WEBSITE',
            sub: {
                create: {
                    description: "Create a new website"
                }
            }
        }
    }

    async #action(commands) {
        let cmds = commands.join(' ');
        cmds = cmds.split(' ');
        let command = commands.shift();
        if(!this.#commands[command]) return ['\n\x1b[35mCandyPack \x1b[0m\x1b[91m' + cmds.join(' ') + '\x1b[0m is not a valid command.\n'];
        let action = this.#commands[command];
        while(commands.length > 0) {
            command = commands.shift();
            if(!action.sub || !action.sub[command]) return ['\n\x1b[35mCandyPack \x1b[0m\x1b[91m' + cmds.join(' ') + '\x1b[0m is not a valid command.\n'];
            action = action.sub[command];
        }
        if(action.action) return await action.action(cmds);
        return await this.help(cmds);
    }

    async #detail(command, obj){
        let result = "";
        let space = 0;
        if(obj.title) result += "\n\x1b[90m" + await __(obj.title) + "\x1b\n";
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

    async help(commands) {
        let result = [""];
        let space = 0;
        result.push('\x1b[35mCandyPack \x1b[0m');
        if(commands && commands.length){
            let obj = this.#commands;
            let command = commands.shift();
            if(!obj[command]) return ['\n\x1b[35mCandyPack \x1b[0m\x1b[91m' + commands.join(' ') + '\x1b[0m is not a valid command.\n'];
            obj = obj[command];
            while(commands.length > 0 && commands.length && obj.sub[commands[0]]){
                command = commands.shift();
                if(!obj.sub[command]) return ['\n\x1b[35mCandyPack \x1b[0m\x1b[91m' + commands.join(' ') + '\x1b[0m is not a valid command.\n'];
                obj = obj.sub[command];
            }
            let detail = await this.#detail(command, obj);
            if(detail.space > space) space = detail.space;
            let lines = detail.result.split("\n");
            for(let line of lines) result.push(line);
        } else {
            for(const command in this.#commands){
                let detail = (await this.#detail(command, this.#commands[command]));
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
        return result;
    }

    init() {
        if(!Candy.config.api) Candy.config.api = {};
        Candy.config.api.auth = Candy.ext.crypto.randomBytes(32).toString('hex');
        Candy.ext.http.createServer((req, res) => {
            if(req.socket.remoteAddress !== '::ffff:127.0.0.1') res.end();
            if(req.headers.authorization !== Candy.config.api.auth) return res.end();
            if(req.method !== 'POST') return res.end();
            let data = '';
            req.on('data', (chunk) => {
                data += chunk;
            });
            req.on('end', async () => {
                let commands = JSON.parse(data);
                if(!commands || !commands.args) return res.end();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify({output: await this.#action(commands.args)}));
                res.end();
            });
        }).listen(1453);
    }
    
}

module.exports = new Api();