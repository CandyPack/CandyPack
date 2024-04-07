const crypto = require('crypto');

class Request {
    #complete = false;
    #cookies  = [];
    #event    = {'data': [], 'end': [], 'error': [], 'timeout': []};
    #headers  = {'Server': 'CandyPack'};
    #request  = {};
    #status   = 200;
    #timeout  = null;

    constructor(id, req, res) {
        this.id     = id;
        this.req    = req;
        this.res    = res;
        this.method = req.method;
        this.url    = req.url;
        this.host   = req.headers.host;
        this.ssl    = this.header('X-Candy-Connection-SSL') === 'true';
        this.ip     = req.connection.remoteAddress === '127.0.0.1' ? (header('X-Candy-Connection-RemoteAddress') ?? req.connection.remoteAddress) : req.connection.remoteAddress;
        let route   = req.headers.host.split('.')[0];
        if(!Candy.Route.routes[route]) route = 'www';
        this.route = route;
        this.#timeout = setTimeout(() => !this.res.finished && this.abort(408), Candy.Config.request.timeout);
        this.#data();
        if(!Candy.Request) Candy.Request = {};
        if(!this.cookie('candy_client') || !this.session('_client') || this.session('_client') !== this.cookie('candy_client')){
            let client = crypto.createHash('md5').update(this.ip + this.id + Date.now().toString() + Math.random().toString()).digest('hex');
            this.cookie('candy_client', client, {expires: null, httpOnly: false});
            this.session('_client', client);
        }
    }

    // - ABORT REQUEST
    async abort(code) {
        this.status(code);
        let result = { 401: 'Unauthorized',
                       404: 'Not Found',
                       408: 'Request Timeout'}[code] ?? null
        if(Candy.Route.routes[this.route].error && Candy.Route.routes[this.route].error[code]) result = await Candy.Route.routes[this.route].error[404].cache(param);
        this.end(result);
    }

    // - SET COOKIE
    cookie(key, value, options = {}) {
        if(value === undefined){
            value = this.req.headers.cookie?.split('; ').find(c => c.startsWith(key + '='))?.split('=')[1] ?? null;
            if(value && value.startsWith('{') && value.endsWith('}')) value = JSON.parse(value);
            return value;
        }
        if(options.path     === undefined) options.path     = '/';
        if(options.expires  === undefined) options.expires  = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toUTCString();
        if(options.secure   === undefined) options.secure   = true;
        if(options.httpOnly === undefined) options.httpOnly = true;
        if(options.sameSite === undefined) options.sameSite = 'Strict';
        if(typeof value === 'object') value = JSON.stringify(value);
        let cookie = `${key}=${value}`;
        for(const option of Object.keys(options)) if(options[option]) cookie += `; ${option}=${options[option]}`;
        this.#cookies.push(cookie);
    }

    #data() {
        let body = '';
        this.req.on('data', (chunk) => {
            body += chunk.toString();
            if(body.length > 1e6) {
                body = '';
                this.status(413);
                this.end();
            } else {
                if(body.length > 0 && body.indexOf('Content-Disposition') === -1) return;
                if(body.indexOf('Content-Disposition') > -1){
                    let boundary = body.split('\r\n')[0].split('; ')[1].split('=')[1];
                    let data = body.split(boundary);
                    for(let i = 0; i < data.length; i++){
                        if(data[i].indexOf('Content-Disposition') === -1) continue;
                        let key = data[i].split('name="')[1].split('"')[0];
                        let val = data[i].split('\r\n\r\n')[1].split('\r\n')[0];
                        this.#request[key] = val;
                    }
                } else {
                    let data = body.split('&');
                    for(let i = 0; i < data.length; i++){
                        if(data[i].indexOf('=') === -1) continue;
                        let key = data[i].split('=')[0];
                        let val = data[i].split('=')[1];
                        this.#request[key] = val;
                    }
                }
            }
            for(const event of this.#event.data){
                event.callback(event.active ? chunk : body);
                event.active = true;
            }
        });
        this.req.on('end', () => {
            if(!body) return this.#complete = true;
            if(body.startsWith('{') && body.endsWith('}')){
                this.#request = JSON.parse(body);
            } else {
                let data = body.split('&');
                for(let i = 0; i < data.length; i++){
                    if(data[i].indexOf('=') === -1) continue;
                    let key = data[i].split('=')[0];
                    let val = data[i].split('=')[1];
                    this.#request[key] = val;
                }
            }
            this.#complete = true;
            for(const event of this.#event.end) event.callback();
        });
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
        clearTimeout(this.#timeout);
        this.print();
        this.res.end(data);
        this.req.connection.destroy();
    }

    // - SET HEADER
    header(key, value) {
              if(value === null) delete this.#headers[key];
        else  if(value !== undefined) this.#headers[key] = value;
        else for(const header of Object.keys(this.req.headers)) if(header.toLowerCase() === key.toLowerCase()) return this.req.headers[header];
    }

    // - ON EVENT
    on(event, callback) {
        if(this.#event[event]) this.#event[event].push({callback: callback, active: false});
        else return false;
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
        let pub = this.cookie('candy_session');
        if(!pub || !Candy.Request.session[pub + '-' + pri]){
            do {
                pub = crypto.createHash('md5').update(this.ip + this.id + Date.now().toString() + Math.random().toString()).digest('hex');
            } while(Candy.Request.session[`${pub}-${pri}`]);
            Candy.Request.session[`${pub}-${pri}`] = {};
            this.cookie('candy_session', `${pub}`);
        }
        if(!Candy.Request.session[pub + '-' + pri]) Candy.Request.session[pub + '-' + pri] = {};
        if(value === undefined) return value;
        else if(value === null) delete Candy.Request.session[pub + '-' + pri][key];
        else Candy.Request.session[pub + '-' + pri][key] = value;
    }

    // - HTTP CODE
    status(code) {
        this.#status = code;
    }

    // - WRITE DATA
    write(data) {
        if(this.res.finished) return;
        this.res.write(data);
    }
}

module.exports = Request;