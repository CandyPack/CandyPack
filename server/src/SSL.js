var records = {dns: {}, http: {}};
var checking = false;

function self(){
    let ssl = Candy.config.ssl ?? {};
    if(ssl && ssl.expiry > Date.now() && ssl.key && ssl.cert && Candy.ext.fs.existsSync(ssl.key) && Candy.ext.fs.existsSync(ssl.cert)) return;
    const attrs = [{ name: 'commonName', value: 'CandyPack' }];
    const pems = Candy.ext.selfsigned.generate(attrs, { days: 365, keySize: 2048});
    if(!Candy.ext.fs.existsSync(Candy.ext.os.homedir() + '/.candypack/ssl')) Candy.ext.fs.mkdirSync(Candy.ext.os.homedir() + '/.candypack/ssl');
    let key_file = Candy.ext.os.homedir() + '/.candypack/ssl/candypack.key';
    let crt_file = Candy.ext.os.homedir() + '/.candypack/ssl/candypack.crt';
    Candy.ext.fs.writeFileSync(key_file, pems.private);
    Candy.ext.fs.writeFileSync(crt_file, pems.cert);
    ssl.key = key_file;
    ssl.cert = crt_file;
    ssl.expiry = Date.now() + 86400000;
    Candy.config.ssl = ssl;
}

async function ssl(domain){
    // let websites = Candy.config.websites') ?? {};
    // let website = websites[domain];
    // if(!website) return;
    // let records = [];
    // for(const record of website.DNS.TXT ?? []) if(record && record.name == '_acme-challenge.' + domain) records.push(record);
    // website.DNS.TXT = website.DNS.TXT;
    const accountPrivateKey = await Candy.ext.acme.forge.createPrivateKey();
    const client = new Candy.ext.acme.Client({
        directoryUrl: Candy.ext.acme.directory.letsencrypt.production,
        accountKey: accountPrivateKey
    });
    let subdomains = [domain];
    for(const subdomain of Candy.config.websites[domain].subdomain ?? []) subdomains.push(subdomain + '.' + domain);
    const [key, csr] = await Candy.ext.acme.forge.createCsr({
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
                if(challenge.type == 'dns-01'){
                    let websites = Candy.config.websites ?? {};
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
                    Candy.config.websites = websites;
                    return resolve();
                }
            });
        },
        challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
            return new Promise((resolve, reject) => {
                if(challenge.type == 'dns-01'){
                    let websites = Candy.config.websites ?? {};
                    let website = websites[domain];
                    if(!website) return reject();
                    if(!website.DNS) website.DNS = [];
                    if(!website.DNS['TXT']) website.DNS['TXT'] = [];
                    website.DNS['TXT'] = website.DNS['TXT'].filter(function(record){
                        return record.name != '_acme-challenge.' + authz.identifier.value;
                    });
                    websites[domain] = website;
                    Candy.config.websites = websites;
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
    Candy.ext.fs.writeFileSync(Candy.ext.os.homedir() + '/.candypack/ssl/' + domain + '.key', key);
    Candy.ext.fs.writeFileSync(Candy.ext.os.homedir() + '/.candypack/ssl/' + domain + '.crt', cert);
    let websites = Candy.config.websites ?? {};
    let website = websites[domain];
    if(!website) return;
    website.ssl = {
        key: Candy.ext.os.homedir() + '/.candypack/ssl/' + domain + '.key',
        cert: Candy.ext.os.homedir() + '/.candypack/ssl/' + domain + '.crt',
        expiry: Date.now() + (1000 * 60 * 60 * 24 * 30 * 3)
    };
    websites[domain] = website;
    Candy.config.websites = websites;
}

module.exports = {
    check: async function(){
        if(checking || !Candy.config.websites) return;
        checking = true;
        self();
        for (const domain of Object.keys(Candy.config.websites)) {
            if(!Candy.config.websites[domain].ssl || Date.now() + (1000 * 60 * 60 * 24 * 30) > Candy.config.websites[domain].ssl.expiry) await ssl(domain);
        }
        checking = false;
    }
};