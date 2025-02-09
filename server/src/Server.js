class Server {

    async check(){
        return new Promise((resolve, reject) => {
            if(!Candy.config.server.watchdog) return resolve(false);
            Candy.ext.ps.lookup({ pid: Candy.config.server.watchdog }, function(err, resultList ) {
                if(err) throw new Error(err);
                let process = resultList[0];
                if(process) resolve(true);
                else resolve(false);
            });
        });
    }

    #init(){
        let pid = Candy.config.server.watchdog;
        if(!pid){
            this.watchdog();
        } else {
            Candy.ext.ps.lookup({ pid: pid }, (err, resultList) => {
                if(err) throw new Error(err);
                if(!resultList){
                    this.watchdog();
                } else {
                    let process = resultList[0];
                    if(!process) this.watchdog();
                }
            });
        }
    }

    async init() {
        process.on('uncaughtException', (err) => {
            console.error('Uncaught Exception:', err.stack || err);
        });
        if(!Candy.config.server) Candy.config.server = {};
        return new Promise(async(resolve, reject) => {
            var args = process.argv.slice(2);
            switch(args[0]){
                case 'start':
                    if(global.trigger == 'cli') await this.start();
                    else Candy.Service.start(args[1]);
                    return resolve();
                    break;
                case 'services': {
                    let services = await Candy.Service.status();
                    let data = [];
                    Candy.Cli.log('');
                    Candy.Cli.log('CandyPack');
                    Candy.Cli.log('');
                    if(services.length == 0){
                        Candy.Cli.log(' ', __('No services found.'));
                        Candy.Cli.log(' ');
                        return resolve();
                    }
                    Candy.Cli.log(' ', __('Services') + ': ', services.length);
                    for(const service of services){
                        let status = 'Stopped';
                        if(service.active) status = service.status == 'running' ? 'Running' : service.status.charAt(0).toUpperCase() + service.status.slice(1);
                        let row = {};
                        row['ID'] = {
                            content: service.id,
                            direction: 'right'
                        };
                        row[__('Name')] = service.name;
                        row['PID'] = service.status == 'running' ? service.pid : '-';
                        row[__('Uptime')] = service.uptime;
                        row[__('Status')] = __(status);
                        row[__('Active')] = service.active ? '\u2713' : '\u2717';
                        data.push(row);
                    }
                    Candy.Cli.table(data);
                    Candy.Cli.log(' ');
                    return resolve();
                    break;
                }
                case 'websites': {
                    let websites = await Candy.Web.status();
                    Candy.Cli.log('');
                    Candy.Cli.log('CandyPack');
                    Candy.Cli.log('');
                    if(Object.keys(websites).length == 0){
                        Cli.log(' ', __('No websites found.'));
                        Cli.log(' ');
                        return resolve();
                    }
                    Candy.Cli.log(' ', __('Websites') + ': ', Object.keys(websites).length);
                    let data = [];
                    for(const website of Object.keys(websites)){
                        let row = {};
                        row[__('Domain')] = website;
                        data.push(row);
                    }
                    Candy.Cli.table(data);
                    Candy.Cli.log(' ');
                    return resolve();
                    break;
                }
                case 'auth':
                    Candy.Client.auth(args[1]);
                    break;
            }
            if(!(await this.check())) this.#init();
            return resolve();
        });
    }

    async uptime(){
        return new Promise(async function(resolve, reject){
            if(!Candy.config.server.started) return resolve(0);
            var uptime = Date.now() - Candy.config.server.started;
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
            if(minutes && !days) uptimeString += minutes + 'm ';
            if(seconds && !hours) uptimeString += seconds + 's';
            return resolve(uptimeString);
        });
    }

    async services(){
        return new Promise((resolve, reject) => {
            let services = Candy.config.server.services ?? [];
            let running = 0;
            for(const service of services) if(service.active && service.status == 'running') running++;
            return resolve(running);
        });
    }

    async restart(){
        Candy.Cli.log(await __('Restarting CandyPack Server...'));
        this.stop();
        return new Promise(async(resolve, reject) => {
            setTimeout(async () => this.#init() && resolve(), 1000);
        });
    }

    start(){
        Candy.config.server.pid = process.pid;
        Candy.config.server.started = Date.now();
        Candy.Service.init();
        Candy.DNS.init();
        Candy.Web.init();
        Candy.Mail.init();
        Candy.Api.init();
        setTimeout(function(){
            let t = setInterval(function(){
                Candy.Service.check();
                Candy.SSL.check();
                Candy.Web.check();
                Candy.Mail.check();
            }, 1000);
        }, 1000);
    }

    stop(){
        if(!this.check()) return resolve();
        try {
            process.kill(Candy.config.server.watchdog, 'SIGTERM');
            process.kill(Candy.config.server.pid, 'SIGTERM');
            Service.stopAll();
            Web.stopAll();
        } catch(e) {
        }
        Candy.config.server.pid = null;
        Candy.config.server.started = null;
    }

    async watchdog(){
        console.log(await __('Starting CandyPack Server...'));
        let child = Candy.ext.childProcess.spawn('node', [__dirname + '/../watchdog.js', 'start'], { detached: true });
        Candy.config.server.watchdog = child.pid;
        Candy.config.server.started  = Date.now();
        process.exit(0);
    }
}

module.exports = new Server();