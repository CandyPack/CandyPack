class Api {
    #commands = {
        'subdomain.create': (...args) => Candy.Subdomain.create(...args)
    };

    init() {
        if(!Candy.config.api) Candy.config.api = {};
        Candy.config.api.auth = Candy.ext.crypto.randomBytes(32).toString('hex');
        Candy.ext.http.createServer((req, res) => {
            if(req.socket.remoteAddress !== '::ffff:127.0.0.1') return res.end("1");
            if(req.headers.authorization !== Candy.config.api.auth) return res.end("2");
            if(req.method !== 'POST') return res.end();
            let data = '';
            req.on('data', (chunk) => {
                data += chunk;
            });
            req.on('end', async () => {
                data = JSON.parse(data);
                console.log(data);
                if(!data || !data.action || !this.#commands[data.action]) return res.end("3");
                res.writeHead(200, { 'Content-Type': 'application/json' });
                console.log(data);
                let result = await this.#commands[data.action](...data.data);
                res.end(JSON.stringify(result));
            });
        }).listen(1453);
    }

    result(result, message){
        return {result: result, message: message};
    }
    
}

module.exports = new Api();