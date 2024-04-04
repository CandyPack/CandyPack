class Request {
    #headers = {};

    constructor(req, res) {
        this.req = req;
        this.res = res;
    }

    header(key, value) {
        this.#headers[key] = value;
    }
}

module.exports = Request;