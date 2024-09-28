class Web {
    #active = {};
    #error_counts = {};
    #loaded = false;
    #logs = { log: {}, err: {} };
    #ports = {};
    #server_http;
    #server_https;
    #started = {};
    #watcher = {};
    
    async check() {
        if(!this.#loaded) return;
        for (const domain of Object.keys(Candy.config.websites ?? {})) {
            let website = Candy.config.websites[domain];
            if(!website.pid){
                this.start(domain);
            } else if(!this.#watcher[website.pid]){
                try {
                    process.kill(website.pid, 'SIGTERM');
                } catch(e) {
                }
                website.pid = null;
                this.set(domain, website);
                this.start(domain);
            }
            if(this.#logs.log[domain]){
                Candy.ext.fs.writeFile(Candy.ext.os.homedir() + '/.candypack/logs/' + domain + '.log', this.#logs.log[domain], function(err) {
                    if(err) log(err);
                });
            }
            if(this.#logs.err[domain]){
                Candy.ext.fs.writeFile(website.path + '/error.log', this.#logs.err[domain], function(err) {
                    if(err) log(err);
                });
            }
        }
        this.server();
    }

    checkPort(port){
        return new Promise((resolve) => {
            const server = Candy.ext.net.createServer();
            server.once('error', (err) => resolve(false));
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen(port, '127.0.0.1');
        });
    }

    async create(domain, path) {
        let web = {};
        for(const iterator of ['http://', 'https://', 'ftp://', 'www.']) {
            if(domain.startsWith(iterator)) domain = domain.replace(iterator, '');
        }
        if(domain.length < 3 || !domain.includes('.')) return Candy.Api.result(false, __('Invalid domain.'));
        if(Candy.config.websites[domain]) return Candy.Api.result(false, await __('Website %s already exists.', domain));
        web.domain = domain;
        web.path = Candy.ext.path.resolve().replace(/\\/g, '/') + '/' + domain + '/';
        if(Candy.ext.path.length > 0) web.path = path;
        if(!Candy.ext.fs.existsSync(web.path)) Candy.ext.fs.mkdirSync(web.path, { recursive: true });
        web.subdomain = ['www'];
        Candy.config.websites[web.domain] = web;
        Candy.DNS.record({ name: web.domain,             type: 'A',     value: Candy.DNS.ip },
                         { name: 'www.' + web.domain,    type: 'CNAME', value: web.domain },
                         { name: web.domain,             type: 'MX',    value: web.domain },
                         { name: web.domain,             type: 'TXT',   value: 'v=spf1 a mx ip4:' + Candy.DNS.ip + ' ~all' },
                         { name: '_dmarc.' + web.domain, type: 'TXT',   value: 'v=DMARC1; p=reject; rua=mailto:postmaster@' + web.domain});
        Candy.ext.childProcess.execSync('npm link candypack', { cwd: web.path });
        if(Candy.ext.fs.existsSync(web.path + 'node_modules/.bin')) Candy.ext.fs.rmSync(web.path + 'node_modules/.bin', { recursive: true });
        if(!Candy.ext.fs.existsSync(web.path + '/node_modules')) Candy.ext.fs.mkdirSync(web.path + '/node_modules');
        Candy.ext.fs.cpSync(__dirname + '/../web/', web.path, {recursive: true});
        return Candy.Api.result(true, __('Website %s created.', domain));
    }

    index(req, res){
        res.write('CandyPack Server');
        res.end();
    }

    async init(){
        this.#loaded = true;
        this.server();
    }

    request(req, res, secure){
        let host = req.headers.host;
        if(!host) return this.index(req, res);
        while(!Candy.config.websites[host] && host.includes('.')) host = host.split('.').slice(1).join('.');
        const website = Candy.config.websites[host];
        if(!website) return this.index(req, res);
        if(!website.pid || !this.#watcher[website.pid]) return this.index(req, res);
        try{
            if(!secure){
                res.writeHead(301, { Location: 'https://' + host + req.url });
                return res.end();
            }
            const proxy = Candy.ext.httpProxy.createProxyServer({});
            proxy.web(req, res, { target: 'http://127.0.0.1:' + website.port });
            proxy.on('proxyReq', (proxyReq, req, res, options) => {
                proxyReq.setHeader('X-Candy-Connection-RemoteAddress', req.socket.remoteAddress);
                proxyReq.setHeader('X-Candy-Connection-SSL', secure ? 'true' : 'false');
            });
            proxy.on('error', (err, req, res) => {
                res.end();
            });
        } catch(e){
            log(e);
            return this.index(req, res);
        }
    }

    server(){
        if(!this.#loaded) return setTimeout(server, 1000);
        if(Object.keys(Candy.config.websites ?? {}).length == 0) return;
        if(!this.#server_http) this.#server_http = Candy.ext.http.createServer((req,res) => this.request(req,res,false)).listen(80);
        let ssl = Candy.config.ssl ?? {};
        if(!this.#server_https && ssl && ssl.key && ssl.cert && Candy.ext.fs.existsSync(ssl.key) && Candy.ext.fs.existsSync(ssl.cert)){
            this.#server_https = Candy.ext.https.createServer({
                SNICallback: (hostname, callback) => {
                    let sslOptions;
                    while(!Candy.config.websites[hostname] && hostname.includes('.')) hostname = hostname.split('.').slice(1).join('.');
                    let website = Candy.config.websites[hostname];
                    if(website && website.cert?.ssl && website.cert.ssl.key && website.cert.ssl.cert && Candy.ext.fs.existsSync(website.cert.ssl.key) && Candy.ext.fs.existsSync(website.cert.ssl.cert)){
                        sslOptions = {
                            key: Candy.ext.fs.readFileSync(website.cert.ssl.key),
                            cert: Candy.ext.fs.readFileSync(website.cert.ssl.cert)
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
        Candy.config.websites[domain] = Candy.config.websites[domain] = data;
    }

    async start(domain){
        if(this.#active[domain] || !this.#loaded) return;
        this.#active[domain] = true;
        let website = Candy.config.websites[domain];
        if(!website) return;
        if(website.status == 'errored' && (Date.now() - website.updated < this.#error_counts[domain] * 1000)) return;
        let port = 60000;
        let using = false;
        do {
            if(this.#ports[port]){
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
        this.#ports[port] = true;
        if(!Candy.ext.fs.existsSync(website.path + '/index.js')){
            log(__("Website %s doesn't have index.js file.", domain));
            return;
        }
        var child = Candy.ext.childProcess.spawn('node', [website.path + '/index.js', port], { cwd: website.path, detached: true });
        let pid = child.pid;
        child.stdout.on('data', (data) => {
            if(!this.#logs.log[domain]) this.#logs.log[domain] = '';
            this.#logs.log[domain] += '[LOG][' + Date.now() + '] ' + data.toString().trim().split('\n').join('\n[LOG][' + Date.now() + '] ') + '\n';
            if(this.#logs.log[domain].length > 1000000) this.#logs.log[domain] = this.#logs.log[domain].substr(this.#logs.log[domain].length - 1000000);
        });
        child.stderr.on('data', (data) => {
            if(!this.#logs.err[domain]) this.#logs.err[domain] = '';
            this.#logs.log[domain] += '[ERR][' + Date.now() + '] ' + data.toString().trim().split('\n').join('\n[ERR][' + Date.now() + '] ') + '\n';
            this.#logs.err[domain] += data.toString();
            if(this.#logs.err[domain].length > 1000000) this.#logs.err[domain] = this.#logs.err[domain].substr(this.#logs.err[domain].length - 1000000);
            website.status = 'errored';
        });
        child.on('exit', (code, signal) => {
            website.pid = null;
            website.updated = Date.now();
            if(website.status == 'errored'){
                website.status = 'errored';
                this.#error_counts[domain] = this.#error_counts[domain] ?? 0;
                this.#error_counts[domain]++;
            } else website.status = 'stopped';
            this.set(domain, website);
            this.#watcher[pid] = false;
            delete this.#ports[website.port];
            this.#active[domain] = false;
        });
        
        website.pid = pid;
        website.started = Date.now();
        website.status = 'running';
        this.set(domain, website);
        this.#watcher[pid] = true;
        this.#started[domain] = Date.now();
    }

    async status() {
        this.init();
        return Candy.config.websites;
    }

    async stopAll(){
        for(const domain of Object.keys(Candy.config.websites ?? {})){
            let website = Candy.config.websites[domain];
            if(website.pid){
                try {
                    process.kill(website.pid, 'SIGTERM');
                } catch(e) {
                }
                website.pid = null;
                this.set(domain, website);
            }
        }
    }
}

module.exports = new Web();