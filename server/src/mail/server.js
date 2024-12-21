const tls  = require('tls');
const imap = require('./imap');

class server {
    clients;
    options;

    constructor(options) {
        this.options = options;
    }

    listen(port){
        if(!port) port = 993;
        const server = tls.createServer(this.options);
        server.on('secureConnection', (socket) => {
            log('Mail', 'New connection from ' + socket.remoteAddress.replace('::ffff:','') + ':' + socket.remotePort);
            socket.id = Math.random().toString(36).substring(7);
            socket.write('* OK [CAPABILITY IMAP4rev1 AUTH=PLAIN] IMAP4rev1 Server Ready\r\n');
            let conn = new imap(socket, this);
            conn.listen();
        });
        server.on('error', (err) => {
            log('Mail', 'Server error: ' + err);
            if(this.options.onError) this.options.onError(err);
        });
        server.listen(port);
    }
}

module.exports = server;