const crypto = require('crypto');

class Request {
    #complete = false;
    #cookies  = [];
    #event    = {};
    #headers  = {'Powered-By': 'CandyPack'};
    #request  = {};
    #status   = 200;

    constructor(id, req, res) {
        this.id = id;
        this.req = req;
        this.res = res;
        this.method = req.method;
        this.ip = req.connection.remoteAddress === '127.0.0.1' ? (req.headers['candy-connection-remoteaddress'] ?? req.connection.remoteAddress) : req.connection.remoteAddress;
        this.url = req.url;
        if(this.method == 'POST'){
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                if(body.startsWith('{') && body.endsWith('}')) this.#request = JSON.parse(body);
                else{
                    let data = body.split('&');
                    for(let i = 0; i < data.length; i++){
                        if(data[i].indexOf('=') === -1) continue;
                        let key = data[i].split('=')[0];
                        let val = data[i].split('=')[1];
                        this.#request[key] = val;
                    }
                }
                this.#complete = true;
            });
        }
        if(!Candy.Request) Candy.Request = {};
    }

    // - CHECK REQUEST
    check(){
        return true;
    }

    // - SET COOKIE
    cookie(key, value, options = {}) {
        if(value === undefined) return this.req.headers.cookie?.split('; ').find(c => c.startsWith(key + '='))?.split('=')[1] ?? null;
        if(!options.path) options.path = '/';
        if(typeof value === 'object') value = JSON.stringify(value);
        let cookie = `${key}=${value}`;
        for(const option of Object.keys(options)) cookie += `; ${option}=${options[option]}`;
        this.#cookies.push(cookie);
    }

    // - RETURN REQUEST
    end(data) {
        if(this.res.finished) return;
        if(typeof data === 'object' && data.type !== 'Buffer'){
            let json = JSON.stringify(data);
            if(json.length > 0 && JSON.parse(json).type !== 'Buffer'){
                data = json;
                this.header('Content-Type', 'application/json');
            }
        }
        this.print();
        this.res.end(data);
    }

    // - SET HEADER
    header(key, value) {
        if(value === undefined) return this.req.headers[key] ?? null;
        if(value === null) delete this.#headers[key];
        else this.#headers[key] = value;
    }

    // - ON EVENT
    on(event, callback) {
        if(!this.#event) this.event = {};
        this.#event[event] = callback;
    }

    // - PRINT HEADERS
    print(){
        if(this.res.headersSent) return;
        this.#headers['Set-Cookie'] = this.#cookies;
        this.res.writeHead(this.#status, this.#headers);
    }

    // - GET REQUEST
    async request(key) {
        if(this.#request[key] !== undefined) return this.#request[key];
        return new Promise((resolve, reject) => {
            let interval = setInterval(() => {
                if(this.#request[key] !== undefined || this.#complete){
                    clearInterval(interval);
                    resolve(this.#request[key] ?? null);
                }
            }, 10);
        });
    }

    // - SESSION
    session(key, value){
        if(!Candy.Request.session) Candy.Request.session = {};
        let pri = crypto.createHash('md5').update(this.req.headers['user-agent']).digest('hex');
        let pub = this.cookie('_session');
        if(!pub){
            do{
                pub = crypto.createHash('md5').update(this.ip + this.id + Date.now().toString() + Math.random().toString()).digest('hex');
            }while(Candy.Request.session[`${pub}-${pri}`]);
            Candy.Request.session[`${pub}-${pri}`] = {};
            this.cookie('_session', `${pub}`);
        }
        if(!Candy.Request.session[pub + '-' + pri]) Candy.Request.session[pub + '-' + pri] = {};
        if(value === undefined) return Candy.Request.session[pub + '-' + pri][key] ?? null;
        else if(value === null) delete Candy.Request.session[pub + '-' + pri][key];
        else Candy.Request.session[pub + '-' + pri][key] = value;
    }

    // - HTTP CODE
    status(code) {
        this.#status = code;
    }

    write(data) {
        if(this.res.finished) return;
        this.res.write(data);
    }
}

module.exports = Request;