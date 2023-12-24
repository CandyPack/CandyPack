const { X509Certificate } = require('crypto');
const { log, error } = require('console');
const selfsigned = require('selfsigned');
const httpProxy = require('http-proxy');
const cp = require('child_process');
const https = require('https');
const http = require(`http`);
const path = require('path');
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
var updated = {};
var server_http, server_https;

function init(){
    websites = Config.get('websites') ?? {};
    loaded = true;
}

function request(req, res){
    let host = req.headers.host;
    if(!host) return res.end('CandyPack Server');
    if(host.startsWith('www.')) host = host.replace('www.', '');
    const website = websites[host];
    if(!website) return index(req, res);
    if(!website.pid || !watcher[website.pid] || website.status != 'running') return index(req, res);
    try{
        const proxy = httpProxy.createProxyServer({});
        proxy.web(req, res, { target: 'http://127.0.0.1:' + website.port });
        proxy.on('proxyReq', (proxyReq, req, res, options) => {
            proxyReq.setHeader('candy-connection-remoteaddress', req.connection.remoteAddress);
        });
        proxy.on('error', (err, req, res) => {
            log(err);
            res.end();
        });
    } catch(e){
        log(e);
        return index(req, res);
    }
}

function server(){
    if(!loaded) return setTimeout(server, 1000);
    if(Object.keys(websites).length == 0) return;
    if(!server_http){
        server_http = http.createServer(request).listen(80);
    }
    let ssl = Config.get('ssl') ?? {};
    if(!server_https && ssl && ssl.key){
            server_https = https.createServer({
            key: fs.readFileSync(ssl.key),
            cert: fs.readFileSync(ssl.cert)
        }, request).listen(443);
    }
}

function index(req, res){
    res.write('CandyPack Server');
    res.end();
}

async function start(domain){
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
            if(checkPort(port)){
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
        set(domain, website);
        watcher[pid] = false;
        error_counts[domain] = error_counts[domain] ?? 0;
        error_counts[domain]++;
        delete ports[website.port];
        active[domain] = false;
    });
    child.on('exit', function(code, signal) {
        website.updated = Date.now();
        website.status = 'stopped';
        set(domain, website);
        watcher[pid] = false;
        delete ports[website.port];
        active[domain] = false;
    });
    website.pid = pid;
    website.started = Date.now();
    website.status = 'running';
    set(domain, website);
    watcher[pid] = true;
    started[domain] = Date.now();
}

async function checkPort(port){
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

function set(domain, data){
    websites[domain] = websites[domain] = data;
    Config.set('websites', websites);
}

function ssl(){
    let ssl = Config.get('ssl') ?? {};
    if(ssl && ssl.expiry > Date.now() && ssl.key) return;
    const attrs = [{ name: 'commonName', value: 'CandyPack' }];
    const pems = selfsigned.generate(attrs, { days: 365 });
    if(!fs.existsSync(os.homedir() + '/.candypack/ssl')) fs.mkdirSync(os.homedir() + '/.candypack/ssl');
    let key_file = os.homedir() + '/.candypack/ssl/candypack.key';
    let crt_file = os.homedir() + '/.candypack/ssl/candypack.crt';
    fs.writeFileSync(key_file, pems.private);
    fs.writeFileSync(crt_file, pems.cert);
    ssl.key = key_file;
    ssl.cert = crt_file;
    ssl.expiry = Date.now() + 86400000;
    Config.set('ssl', ssl);
}

module.exports = {
    init: async function() {
        init();
        server();
    },
    check: async function() {
        if(!loaded) return;
        websites = Config.get('websites') ?? {};
        for (const domain of Object.keys(websites)) {
            let website = websites[domain];
            ssl();
            if(!website.pid){
                start(domain);
            } else if(!watcher[website.pid]){
                try {
                    process.kill(website.pid, 'SIGTERM');
                } catch(e) {
                }
                website.pid = null;
                set(domain, website);
                start(domain);
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
        server();
    },
    create: async function() {
        return new Promise(async function(resolve, reject){
            init();
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
                web.path = path.resolve() + '/' + web.domain;
                readline.question(await Lang.get('Insert Path (%s): ', web.path), async function(path) {
                    if(path.length > 0) web.path = path;
                    log(await Lang.get('%s Creating...', web.domain));
                    if(!fs.existsSync(web.path)) fs.mkdirSync(web.path);
                    websites[web.domain] = web;
                    Config.set('websites', websites);
                    readline.close();
                    log(await Lang.get('Candy Framework Initializing...'));
                    cp.execSync('npm link candypack', { cwd: web.path });
                    if(fs.existsSync(web.path + 'node_modules/.bin')) fs.rmSync(web.path + 'node_modules/.bin', { recursive: true });
                    if(!fs.existsSync(web.path + '/node_modules')) fs.mkdirSync(web.path + '/node_modules');
                    // fs.symlink(__dirname, web.path + '/node_modules/candypack','junction', (err) => {
                    //     if (err) console.error('Kısayol oluşturulamadı:', err);
                    //     else console.log('Kısayol oluşturuldu.');
                    // });
                    fs.cpSync(__dirname + '/../web/', web.path, {recursive: true});
                    log(await Lang.get('%s Created.', web.domain));
                    return resolve();
                });
            });
        });
    },
    status: async function() {
        init();
        return websites;
    }
};