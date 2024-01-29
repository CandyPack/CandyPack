const selfsigned = require('selfsigned');
const crypto = require('crypto');
const acme = require('acme-client');
const fs = require('fs');
const os = require("os");

const Config = require('./Config');

var records = {dns: {}, http: {}};
var checking = false;

function self(){
    let ssl = Config.get('ssl') ?? {};
    if(ssl && ssl.expiry > Date.now() && ssl.key && ssl.cert && fs.existsSync(ssl.key) && fs.existsSync(ssl.cert)) return;
    const attrs = [{ name: 'commonName', value: 'CandyPack' }];
    const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048});
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

async function ssl(domain){
    // return;
    // let websites = Config.get('websites') ?? {};
    // let website = websites[domain];
    // if(!website) return;
    // let records = [];
    // for(const record of website.DNS.TXT ?? []) if(record && record.name == '_acme-challenge.' + domain) records.push(record);
    // website.DNS.TXT = website.DNS.TXT;
    const accountPrivateKey = await acme.forge.createPrivateKey();
    const client = new acme.Client({
        directoryUrl: acme.directory.letsencrypt.production,
        accountKey: accountPrivateKey
    });
    let subdomains = [domain];
    for(const subdomain of Config.get('websites')[domain].subdomain ?? []) subdomains.push(subdomain + '.' + domain);
    const [key, csr] = await acme.forge.createCsr({
        commonName: domain,
        altNames: subdomains,
        // wildcard and multiple subdomains
        // commonName: '*.example.com',
        // altNames: ['example.com', 'www.example.com'],
    });
    const cert = await client.auto({
        csr,
        termsOfServiceAgreed: true,
        challengePriority: ['dns-01', 'http-01'],
        challengeCreateFn: async (authz, challenge, keyAuthorization) => {
            return new Promise((resolve, reject) => {
                console.log(authz, keyAuthorization);
                if(challenge.type == 'dns-01'){
                    let websites = Config.get('websites') ?? {};
                    let website = websites[domain];
                    if(!website){
                        console.log('website not found');
                        return reject();
                    }
                    if(!website.DNS) website.DNS = [];
                    if(!website.DNS['TXT']) website.DNS['TXT'] = [];
                    let txt = [];
                    for(const record of website.DNS['TXT']) /*if(record && record.name != '_acme-challenge.' + domain)*/ txt.push(record);
                    txt.push({
                        name: '_acme-challenge.' + authz.identifier.value,
                        value: keyAuthorization,
                    });
                    website.DNS['TXT'] = txt;
                    websites[domain] = website;
                    Config.set('websites', websites);
                    return resolve();
                }
            });
        },
        challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
            return new Promise((resolve, reject) => {
                if(challenge.type == 'dns-01'){
                    let websites = Config.get('websites') ?? {};
                    let website = websites[domain];
                    if(!website) return reject();
                    if(!website.DNS) website.DNS = [];
                    if(!website.DNS['TXT']) website.DNS['TXT'] = [];
                    website.DNS['TXT'] = website.DNS['TXT'].filter(function(record){
                        return record.name != '_acme-challenge.' + authz.identifier.value;
                    });
                    websites[domain] = website;
                    Config.set('websites', websites);
                }
                return resolve();
            });
        },
        challengeKeyAuthorizationFn: async (challenge, keyAuthorization) => {
            return keyAuthorization;
        },
        challengeTimeoutFn: async (ms) => {
            return new Promise((resolve, reject) => {
                resolve();
            });
        }
    });
    fs.writeFileSync(os.homedir() + '/.candypack/ssl/' + domain + '.key', key);
    fs.writeFileSync(os.homedir() + '/.candypack/ssl/' + domain + '.crt', cert);
    let websites = Config.get('websites') ?? {};
    let website = websites[domain];
    if(!website) return;
    website.ssl = {
        key: os.homedir() + '/.candypack/ssl/' + domain + '.key',
        cert: os.homedir() + '/.candypack/ssl/' + domain + '.crt',
        expiry: Date.now() + 86400000
    };
    websites[domain] = website;
    Config.set('websites', websites);
}

module.exports = {
    check: async function(){
        if(checking || !Config.get('websites')) return;
        checking = true;
        self();
        for (const domain of Object.keys(Config.get('websites'))) {
            if(!Config.get('websites')[domain].ssl) await ssl(domain);
        }
        checking = false;
    }
};