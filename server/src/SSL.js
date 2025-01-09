
class SSL {
    
    #checking = false;
    #checked = {};


    async check(){
        if(this.#checking || !Candy.config.websites) return;
        this.#checking = true;
        this.#self();
        for (const domain of Object.keys(Candy.config.websites)) {
            if(!Candy.config.websites[domain].cert?.ssl || Date.now() + (1000 * 60 * 60 * 24 * 30) > Candy.config.websites[domain].cert.ssl.expiry) await this.#ssl(domain);
        }
        this.#checking = false;
    }

    renew(domain){
        if(!Candy.config.websites[domain]){
            for(const key of Object.keys(Candy.config.websites)){
                for(const subdomain of Candy.config.websites[key].subdomain) if((subdomain + '.' + key) == domain){
                    domain = key;
                    break;
                }
            }
            if(!Candy.config.websites[domain]) return Candy.Api.result(false, __('Domain %s not found.', domain));
        }
        this.#ssl(domain);
        return Candy.Api.result(true, __('SSL certificate for domain %s renewed successfully.', domain));
    }

    #self(){
        let ssl = Candy.config.ssl ?? {};
        if(ssl && ssl.expiry > Date.now() && ssl.key && ssl.cert && Candy.ext.fs.existsSync(ssl.key) && Candy.ext.fs.existsSync(ssl.cert)) return;
        const attrs = [{ name: 'commonName', value: 'CandyPack' }];
        const pems = Candy.ext.selfsigned.generate(attrs, { days: 365, keySize: 2048});
        if(!Candy.ext.fs.existsSync(Candy.ext.os.homedir() + '/.candypack/cert/ssl')) Candy.ext.fs.mkdirSync(Candy.ext.os.homedir() + '/.candypack/cert/ssl', { recursive: true });
        let key_file = Candy.ext.os.homedir() + '/.candypack/cert/ssl/candypack.key';
        let crt_file = Candy.ext.os.homedir() + '/.candypack/cert/ssl/candypack.crt';
        Candy.ext.fs.writeFileSync(key_file, pems.private);
        Candy.ext.fs.writeFileSync(crt_file, pems.cert);
        ssl.key = key_file;
        ssl.cert = crt_file;
        ssl.expiry = Date.now() + 86400000;
        Candy.config.ssl = ssl;
    }

    async #ssl(domain){
        if(this.#checked[domain]?.interval > Date.now()) return;
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
        });
        let cert;
        try{
            cert = await client.auto({
                csr,
                termsOfServiceAgreed: true,
                challengePriority: ['dns-01'],
                challengeCreateFn: async (authz, challenge, keyAuthorization) => {
                    return new Promise((resolve, reject) => {
                        if(challenge.type == 'dns-01'){
                            Candy.DNS.record({
                                name  : '_acme-challenge.' + authz.identifier.value,
                                type  : 'TXT',
                                value : keyAuthorization,
                                ttl   : 100,
                                unique: true
                            });
                        }
                        return resolve();
                    });
                },
                challengeRemoveFn: async (authz, challenge, keyAuthorization) => {
                    return new Promise((resolve, reject) => {
                        if(challenge.type == 'dns-01'){
                            Candy.DNS.delete({
                                name: '_acme-challenge.' + authz.identifier.value,
                                type: 'TXT',
                                value: keyAuthorization
                            });
                            return resolve();
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
        } catch(e){
            if(!this.#checked[domain]) this.#checked[domain] = { error: 0 };
            if(this.#checked[domain].error < 5) this.#checked[domain].error = this.#checked[domain] ? this.#checked[domain].error + 1 : 1
            this.#checked[domain].interval = (this.#checked[domain].error * 1000 * 60 * 5) + Date.now();
            console.log(e);
            return;
        }
        if(!cert) return;
        delete this.#checked[domain];
        if(!Candy.ext.fs.existsSync(Candy.ext.os.homedir() + '/.candypack/cert/ssl')) Candy.ext.fs.mkdirSync(Candy.ext.os.homedir() + '/.candypack/cert/ssl', { recursive: true });
        Candy.ext.fs.writeFileSync(Candy.ext.os.homedir() + '/.candypack/cert/ssl/' + domain + '.key', key);
        Candy.ext.fs.writeFileSync(Candy.ext.os.homedir() + '/.candypack/cert/ssl/' + domain + '.crt', cert);
        let websites = Candy.config.websites ?? {};
        let website = websites[domain];
        if(!website) return;
        if(!website.cert) website.cert = {};
        website.cert.ssl = {
            key : Candy.ext.os.homedir() + '/.candypack/cert/ssl/' + domain + '.key',
            cert: Candy.ext.os.homedir() + '/.candypack/cert/ssl/' + domain + '.crt',
            expiry: Date.now() + (1000 * 60 * 60 * 24 * 30 * 3)
        };
        websites[domain] = website;
        Candy.config.websites = websites;
    }

}

module.exports = new SSL();