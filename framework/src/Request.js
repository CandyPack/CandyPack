class Request {
    #cookies = [];
    #headers = {};
    #status = 200;

    constructor(req, res, id) {
        this.req = req;
        this.res = res;
        this.id = id;
    }

    cookie(key, value) {
        this.#cookies.push(`${key}=${value}`);
    }

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

    header(key, value) {
        this.#headers[key] = value;
    }

    print(){
        if(this.res.headersSent) return;
        this.#headers['Set-Cookie'] = this.#cookies;
        this.res.writeHead(this.#status, this.#headers);
    }

    status(code) {
        this.#status = code;
    }
}

module.exports = Request;