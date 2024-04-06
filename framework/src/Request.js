class Request {
    #cookies  = [];
    #headers  = {'Powered-By': 'CandyPack'};
    #status   = 200;

    constructor(id, req, res) {
        this.req = req;
        this.res = res;
        this.id = id;
        this.method = req.method;
        this.ip = req.connection.remoteAddress === '127.0.0.1' ? (req.headers['candy-connection-remoteaddress'] ?? req.connection.remoteAddress) : req.connection.remoteAddress;
    }

    // - CHECK REQUEST
    check(){
        return true;
    }

    // - SET COOKIE
    cookie(key, value, options = {}) {
        if(!options.expires) options.expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
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
        if(value === undefined || value === null) delete this.#headers[key];
        else this.#headers[key] = value;
    }

    // - PRINT HEADERS
    print(){
        if(this.res.headersSent) return;
        this.#headers['Set-Cookie'] = this.#cookies;
        this.res.writeHead(this.#status, this.#headers);
    }

    // - GET REQUEST
    request(key) {
        return this.req[key];
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