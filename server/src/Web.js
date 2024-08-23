const { X509Certificate } = require('crypto');
const { log, error } = require('console');
const selfsigned = require('selfsigned');
const httpProxy = require('http-proxy');
const cp = require('child_process');
const https = require('https');
const http = require(`http`);
const path = require('path');
const tls = require('tls');
const net = require('net');
const fs = require('fs');
const os = require("os");

const Config = require('./Config.js');
const Lang = require('./Lang.js');

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
        websites = Config.get('websites') ?? {};
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
                fs.writeFile(os.homedir() + '/.candypack/logs/' + domain + '.log', logs.log[domain], function(err) {
                    if(err) log(err);
                });
            }
            if(logs.err[domain]){
                fs.writeFile(website.path + '/error.log', logs.err[domain], function(err) {
                    if(err) log(err);
                });
            }
        }
        this.server();
    }

    async checkPort(port){
        return new Promise((resolve) => {
            const server = net.createServer();
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
        return new Promise(async function(resolve, reject){
            this.init();
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            let web = {};
            readline.question(await Lang.get('Insert Domain (example.com): '), async function(domain) {
                for(const iterator of ['http://', 'https://', 'ftp://', 'www.']) {
                    if(domain.startsWith(iterator)) domain = domain.replace(iterator, '');
                }
                if(domain.length < 3 || !domain.includes('.')){
                    log(await Lang.get('Invalid domain.'));
                    readline.close();
                    return resolve();
                }
                if(websites[domain]){
                    log(await Lang.get('Website %s already exists.', domain));
                    readline.close();
                    return resolve();
                }
                web.domain = domain;
                web.path = path.resolve().replace(/\\/g, '/') + '/' + domain + '/';
                readline.question(await Lang.get('Insert Path (%s): ', web.path), async function(path) {
                    if(path.length > 0) web.path = path;
                    log(await Lang.get('%s Creating...', web.domain));
                    if(!fs.existsSync(web.path)) fs.mkdirSync(web.path, { recursive: true });
                    web.DNS = {
                        A: [
                            { name: web.domain },
                            { name: 'www' + web.domain}
                        ]
                    };
                    web.subdomain = ['www'];
                    websites[web.domain] = web;
                    Config.set('websites', websites);
                    readline.close();
                    log(await Lang.get('Candy Framework Initializing...'));
                    cp.execSync('npm link candypack', { cwd: web.path });
                    if(fs.existsSync(web.path + 'node_modules/.bin')) fs.rmSync(web.path + 'node_modules/.bin', { recursive: true });
                    if(!fs.existsSync(web.path + '/node_modules')) fs.mkdirSync(web.path + '/node_modules');
                    fs.cpSync(__dirname + '/../web/', web.path, {recursive: true});
                    log(await Lang.get('%s Created.', web.domain));
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
        websites = Config.get('websites') ?? {};
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
            const proxy = httpProxy.createProxyServer({});
            proxy.web(req, res, { target: 'http://127.0.0.1:' + website.port });
            proxy.on('proxyReq', (proxyReq, req, res, options) => {
                proxyReq.setHeader('X-Candy-Connection-RemoteAddress', req.connection.remoteAddress);
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
        if(!server_http) server_http = http.createServer((req,res) => this.request(req,res,false)).listen(80);
        let ssl = Config.get('ssl') ?? {};
        if(!server_https && ssl && ssl.key && ssl.cert && fs.existsSync(ssl.key) && fs.existsSync(ssl.cert)){
            server_https = https.createServer({
                SNICallback: (hostname, callback) => {
                    let sslOptions;
                    while(!websites[hostname] && hostname.includes('.')) hostname = hostname.split('.').slice(1).join('.');
                    let website = websites[hostname];
                    if(website && website.ssl && website.ssl.key && website.ssl.cert && fs.existsSync(website.ssl.key) && fs.existsSync(website.ssl.cert)){
                        sslOptions = {
                            key: fs.readFileSync(website.ssl.key),
                            cert: fs.readFileSync(website.ssl.cert)
                        };
                    } else {
                        sslOptions = {
                            key: fs.readFileSync(ssl.key),
                            cert: fs.readFileSync(ssl.cert)
                        };
                    }            
                    const ctx = tls.createSecureContext(sslOptions);
                    callback(null, ctx);
                }
            }, (req, res) => {
                this.request(req, res, true);
            }).listen(443);
        }
    }

    set(domain, data){
        websites[domain] = websites[domain] = data;
        Config.set('websites', websites);
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
        if(!fs.existsSync(website.path + '/index.js')){
            log(Lang.get("Website %s doesn't have index.js file.", domain));
            return;
        }
        var child = cp.spawn('node', [website.path + '/index.js', port], { cwd: website.path, detached: true });
        let pid = child.pid;
        child.stdout.on('data', function(data) {
            if(!logs.log[domain]) logs.log[domain] = '';
            logs.log[domain] += '[LOG][' + Date.now() + '] ' + data.toString().trim().split('\n').join('\n[LOG][' + Date.now() + '] ') + '\n';
            if(logs.log[domain].length > 1000000) logs.log[domain] = logs.log[domain].substr(logs.log[domain].length - 1000000);
        });
        child.stderr.on('data', function(data) {
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