var error_counts = {};
var websites = {};
var watcher = {};
var started = {};
var ports = {};
var logs = {
    log: {},
    err: {}
};
var active = {};
var loaded = false;
var server_http, server_https;

class Web {
    
    async check() {
        if(!loaded) return;
        websites = Candy.config.websites ?? {};
        for (const domain of Object.keys(websites)) {
            let website = websites[domain];
            if(!website.pid){
                this.start(domain);
            } else if(!watcher[website.pid]){
                try {
                    process.kill(website.pid, 'SIGTERM');
                } catch(e) {
                }
                website.pid = null;
                this.set(domain, website);
                this.start(domain);
            }
            if(logs.log[domain]){
                Candy.ext.fs.writeFile(Candy.ext.os.homedir() + '/.candypack/logs/' + domain + '.log', logs.log[domain], function(err) {
                    if(err) log(err);
                });
            }
            if(logs.err[domain]){
                Candy.ext.fs.writeFile(website.path + '/error.log', logs.err[domain], function(err) {
                    if(err) log(err);
                });
            }
        }
        this.server();
    }

    async checkPort(port){
        return new Promise((resolve) => {
            const server = Candy.ext.net.createServer();
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') resolve(false);
                else resolve(false);
            });
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen(port, '127.0.0.1');
        });
    }

    async create() {
        return new Promise(async (resolve, reject) =>{
            this.init();
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            let web = {};
            readline.question(await __('Insert Domain (example.com): '), async function(domain) {
                for(const iterator of ['http://', 'https://', 'ftp://', 'www.']) {
                    if(domain.startsWith(iterator)) domain = domain.replace(iterator, '');
                }
                if(domain.length < 3 || !domain.includes('.')){
                    log(await __('Invalid domain.'));
                    readline.close();
                    return resolve();
                }
                if(websites[domain]){
                    log(await __('Website %s already exists.', domain));
                    readline.close();
                    return resolve();
                }
                web.domain = domain;
                web.path = Candy.ext.path.resolve().replace(/\\/g, '/') + '/' + domain + '/';
                readline.question(await __('Insert Path (%s): ', web.path), async function(path) {
                    if(Candy.ext.path.length > 0) web.path = path;
                    log(await __('%s Creating...', web.domain));
                    if(!Candy.ext.fs.existsSync(web.path)) Candy.ext.fs.mkdirSync(web.path, { recursive: true });
                    web.DNS = {
                        A: [
                            { name: web.domain },
                            { name: 'www' + web.domain}
                        ]
                    };
                    web.subdomain = ['www'];
                    websites[web.domain] = web;
                    Candy.config.websites = websites;
                    readline.close();
                    log(await __('Candy Framework Initializing...'));
                    Candy.ext.ChildProcess.execSync('npm link candypack', { cwd: web.path });
                    if(Candy.ext.fs.existsSync(web.path + 'node_modules/.bin')) Candy.ext.fs.rmSync(web.path + 'node_modules/.bin', { recursive: true });
                    if(!Candy.ext.fs.existsSync(web.path + '/node_modules')) Candy.ext.fs.mkdirSync(web.path + '/node_modules');
                    Candy.ext.fs.cpSync(__dirname + '/../web/', web.path, {recursive: true});
                    log(await __('%s Created.', web.domain));
                    return resolve();
                });
            });
        });
    }

    index(req, res){
        res.write('CandyPack Server');
        res.end();
    }

    async init(){
        websites = Candy.config.websites ?? {};
        loaded = true;
        this.server();
    }

    request(req, res, secure){
        let host = req.headers.host;
        if(!host) return this.index(req, res);
        while(!websites[host] && host.includes('.')) host = host.split('.').slice(1).join('.');
        const website = websites[host];
        if(!website) return this.index(req, res);
        if(!website.pid || !watcher[website.pid] || website.status != 'running') return this.index(req, res);
        try{
            const proxy = Candy.ext.httpProxy.createProxyServer({});
            proxy.web(req, res, { target: 'http://127.0.0.1:' + website.port });
            proxy.on('proxyReq', (proxyReq, req, res, options) => {
                proxyReq.setHeader('X-Candy-Connection-RemoteAddress', req.socket.remoteAddress);
                proxyReq.setHeader('X-Candy-Connection-SSL', secure ? 'true' : 'false');
            });
            proxy.on('error', (err, req, res) => {
                log(err);
                res.end();
            });
        } catch(e){
            log(e);
            return this.index(req, res);
        }
    }

    server(){
        if(!loaded) return setTimeout(server, 1000);
        if(Object.keys(websites).length == 0) return;
        if(!server_http) server_http = Candy.ext.http.createServer((req,res) => this.request(req,res,false)).listen(80);
        let ssl = Candy.config.ssl ?? {};
        if(!server_https && ssl && ssl.key && ssl.cert && Candy.ext.fs.existsSync(ssl.key) && Candy.ext.fs.existsSync(ssl.cert)){
            server_https = Candy.ext.https.createServer({
                SNICallback: (hostname, callback) => {
                    let sslOptions;
                    while(!websites[hostname] && hostname.includes('.')) hostname = hostname.split('.').slice(1).join('.');
                    let website = websites[hostname];
                    if(website && website.ssl && website.ssl.key && website.ssl.cert && Candy.ext.fs.existsSync(website.ssl.key) && Candy.ext.fs.existsSync(website.ssl.cert)){
                        sslOptions = {
                            key: Candy.ext.fs.readFileSync(website.ssl.key),
                            cert: Candy.ext.fs.readFileSync(website.ssl.cert)
                        };
                    } else {
                        sslOptions = {
                            key: Candy.ext.fs.readFileSync(ssl.key),
                            cert: Candy.ext.fs.readFileSync(ssl.cert)
                        };
                    }            
                    const ctx = Candy.ext.tls.createSecureContext(sslOptions);
                    callback(null, ctx);
                }
            }, (req, res) => {
                this.request(req, res, true);
            }).listen(443);
        }
    }

    set(domain, data){
        websites[domain] = websites[domain] = data;
        Candy.config.websites = websites;
    }

    async start(domain){
        if(active[domain] || !loaded) return;
        active[domain] = true;
        let website = websites[domain];
        if(!website) return;
        if(website.status == 'errored' && (Date.now() - website.updated < error_counts[domain] * 1000)) return;
        let port = 60000;
        let using = false;
        do {
            if(ports[port]){
                port++;
                using = true;
            } else {
                if(this.checkPort(port)){
                    using = false;
                } else {
                    port++;
                    using = true;
                }
            }
            if(port > 65535){
                port = 1000;
                using = true;
            }
        } while(using);
        website.port = port;
        ports[port] = true;
        if(!Candy.ext.fs.existsSync(website.path + '/index.js')){
            log(__("Website %s doesn't have index.js file.", domain));
            return;
        }
        var child = Candy.ext.ChildProcess.spawn('node', [website.path + '/index.js', port], { cwd: website.path, detached: true });
        let pid = child.pid;
        child.stdout.on('data', function(data) {
            if(!logs.log[domain]) logs.log[domain] = '';
            logs.log[domain] += '[LOG][' + Date.now() + '] ' + data.toString().trim().split('\n').join('\n[LOG][' + Date.now() + '] ') + '\n';
            if(logs.log[domain].length > 1000000) logs.log[domain] = logs.log[domain].substr(logs.log[domain].length - 1000000);
        });
        child.stderr.on('data', (data) => {
            if(!logs.err[domain]) logs.err[domain] = '';
            logs.log[domain] += '[ERR][' + Date.now() + '] ' + data.toString().trim().split('\n').join('\n[ERR][' + Date.now() + '] ') + '\n';
            logs.err[domain] += data.toString();
            if(logs.err[domain].length > 1000000) logs.err[domain] = logs.err[domain].substr(logs.err[domain].length - 1000000);
            website.status = 'errored';
            website.updated = Date.now();
            this.set(domain, website);
            watcher[pid] = false;
            error_counts[domain] = error_counts[domain] ?? 0;
            error_counts[domain]++;
            delete ports[website.port];
            active[domain] = false;
        });
        child.on('exit', function(code, signal) {
            website.updated = Date.now();
            website.status = 'stopped';
            this.set(domain, website);
            watcher[pid] = false;
            delete ports[website.port];
            active[domain] = false;
        });
        website.pid = pid;
        website.started = Date.now();
        website.status = 'running';
        this.set(domain, website);
        watcher[pid] = true;
        started[domain] = Date.now();
    }

    async status() {
        this.init();
        return websites;
    }
}

module.exports = new Web();