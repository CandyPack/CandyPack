class Connection {
    #auth;
    #actions = {'AUTHENTICATE': () => this.#authenticate(),
                'CAPABILITY'  : () => this.#capability(),
                'CLOSE'       : () => this.#close(),
                'EXAMINE'     : () => this.#examine(),
                'FETCH'       : () => this.#fetch(),
                'LIST'        : () => this.#list(),
                'LSUB'        : () => this.#lsub(),
                'LOGIN'       : () => this.#login(),
                'LOGOUT'      : () => this.#logout(),
                'NOOP'        : () => this.#noop(),
                'SELECT'      : () => this.#select(),
                'STATUS'      : () => this.#status(),
                'STORE'       : () => this.#store()}
    #box = 'INBOX';
    #boxes = ['INBOX', 'Drafts', 'Sent', 'Spam', 'Trash'];
    #commands;
    #content;
    #end = false;
    #options;
    #request;
    #socket;
    #wait = false;

    constructor(socket, self) {
        this.#socket = socket;
        this.#options = self.options;
    }

    #authenticate(){
        this.#write('+ Ready for authentication\r\n');
        this.#wait = true;
        this.#socket.once('data', (data) => {
            data = data.toString().trim();
            if(this.#commands[2] == 'PLAIN'){
                let auth = Buffer.from(data, 'base64').toString().split("\0");
                if(auth[1] && auth[2]){
                    this.#options.onAuth({
                        username: auth[1],
                        password: auth[2]
                    }, this.#commands, (err, result) => {
                        if(err){
                            this.#write(`${this.#request.id} NO Authentication failed\r\n`);
                            this.#auth = false;
                        } else {
                            this.#write(`${this.#request.id} OK Authentication successful\r\n`);
                            this.#auth = auth[1];
                        }
                    });
                } else {
                    this.#write(`${this.#request.id} NO Authentication failed\r\n`);
                    this.#auth = false;
                }
            } else {
                this.#bad();
                this.#auth = false;
            }
            this.#wait = false;
            return;
        });
    }

    #bad(){
        console.error('Unknown command', this.#request.action);
        this.#write(`${this.#request.id} BAD Unknown command\r\n`);
    }
    
    #capability(){
        this.#write('* CAPABILITY IMAP4rev1 AUTH=PLAIN\r\n');
        this.#write(`${this.#request.id} OK CAPABILITY completed\r\n`);
    }

    #close(){
        this.#write(`${this.#request.id} OK CLOSE completed\r\n`);
    }

    #data(data){
        if(this.#wait) return;
        this.#commands = data.toString().trim().split(" ");
        this.#request = {};
        data = data.toString().trim().split(" ");
        this.#request.id = data.shift();
        this.#request.action = data.filter((item) => Object.keys(this.#actions).includes(item)).join(' ');
        let index = data.indexOf(this.#request.action);
        data.splice(data.indexOf(this.#request.action), 1);
        if(data.includes('UID') && data.indexOf('UID') < index){
            this.#request.uid = data[data.indexOf('UID') + 1];
            data.splice(data.indexOf('UID'), 2);
            if(!data.includes('UID') || !data.includes('(UID')) data.splice(0, 0, 'UID');
        } else if(index == 0){
            this.#request.uid = data[0];
            data.shift();
        }
        this.#request.requests = this.#export(data);
        log('mail', 'imap', JSON.stringify(this.#request));
        if(this.#actions[this.#request.action]) this.#actions[this.#request.action]();
        else this.#bad();
    }

    #examine(){
        if(!this.#auth) return this.#write(`${this.#request.id} NO Authentication required\r\n`);
        if(!this.#options.onSelect || typeof this.#options.onSelect != 'function') return this.#write(`${this.#request.id} NO EXAMINE failed\r\n`);
        this.#box = this.#commands[2];
        this.#options.onSelect(this.#auth, this.#options, (data) => {
            this.#write('* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)\r\n');
            this.#write('* OK [PERMANENTFLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft \\*)] Flags permitted\r\n');
            if(data.exists !== undefined)      this.#write('* ' + data.exists + ' EXISTS\r\n');
            this.#write('* ' + (data.recent ?? data.exists) + ' RECENT\r\n');
            if(data.unseen !== undefined)      this.#write('* OK [UNSEEN ' + data.unseen + '] Message ' + data.unseen ?? 0 + ' is first unseen\r\n');
            if(data.uidvalidity !== undefined) this.#write('* OK [UIDVALIDITY ' + data.uidvalidity + '] UIDs valid\r\n');
            if(data.uidnext !== undefined)     this.#write('* OK [UIDNEXT ' + data.uidnext + '] Predicted next UID\r\n');
            this.#write(`${this.#request.id} OK [READ-ONLY] EXAMINE completed\r\n`);
        });
    }

    #export(data){
        let result = [];
        while(data.length){
            let item = data.shift();
            let fields = [];
            let index = data.indexOf(item);
            if(item.includes('[]')) item = item.split('[]')[0];
            if(item.startsWith('(') || item.startsWith('[')) item = item.substring(1);
            if(!data[index + 1]?.startsWith('(BODY')){
                if(item.includes('[') || item.includes('(') || (data[index + 1] ?? '').startsWith('[') || (data[index + 1] ?? '').startsWith('(')){
                    let next = true;
                    if(item.includes('[') || item.includes('(')){
                        item = item.split(item.includes('[') ? '[' : '(');
                        fields.push(item[1].split(']')[0]);
                        next = !item[1].includes(']') && !item[1].includes(')');
                        item = item[0];
                    }
                    if(next) while(data.length && item[1] && !item[1].includes(']') && !item[1].includes(')')){
                        fields.push(data.shift());
                    }
                }
            }
            while(item.endsWith(']') || item.endsWith(')')) item = item.substring(0, item.length - 1);
            let peek = item.includes('.');
            if(peek){
                peek = item.split('.')[1];
                item = item.split('.')[0];
            }
            result.push({
                value: item,
                peek: peek,
                fields: this.#export(fields)
            });
        }
        return result;
    }

    async #fetch(){
        if(!this.#auth) return this.#write(`${this.#request.id} NO Authentication required\r\n`);
        if(!this.#box) return this.#write(`${this.#request.id} NO Mailbox required\r\n`);
        if(!this.#options.onFetch || typeof this.#options.onFetch != 'function') return this.#write(`${this.#request.id} NO FETCH failed\r\n`);
        let ids = this.#request.uid.split(',');
        for(const id of ids) await new Promise((resolve, reject) => {
            this.#options.onFetch({
                email   : this.#auth,
                mailbox : this.#box,
                limit   : id == 'ALL' ? null : (id.includes(':') ? id.split(':') : [id, id]),
            }, this.#commands, (data) => {
                if(data === false) return this.#write(`${this.#request.id} NO FETCH failed\r\n`);
                for(let row of data){
                    this.#write('* ' + row.uid + ' FETCH (');
                    this.#prepare(this.#request.requests, row);
                    this.#write(')\r\n');
                }
                return resolve();
            });
        });
        this.#write(`${this.#request.id} OK FETCH completed\r\n`);
    }

    #list(){
        if(!this.#auth) return this.#write(`${this.#request.id} NO Authentication required\r\n`);
        this.#write('* LIST (\\HasNoChildren) "/" INBOX\r\n');
        this.#write('* LIST (\\HasNoChildren) "/" Drafts\r\n');
        this.#write('* LIST (\\HasNoChildren) "/" Sent\r\n');
        this.#write('* LIST (\\HasNoChildren) "/" Spam\r\n');
        this.#write('* LIST (\\HasNoChildren) "/" Trash\r\n');
        this.#write(`${this.#request.id} OK LIST completed\r\n`);
    }

    listen(port){
        this.#socket.on('data', (data) => this.#data(data));
        this.#socket.on('end', () => {
            this.#end = true;
            this.#socket.end();
        });
        this.#socket.on('error', (err) => {
            if(this.#options.onError) this.#options.onError(err);
        });
    }

    #lsub(){
        if(!this.#auth) return this.#write(`${this.#request.id} NO Authentication required\r\n`);
        this.#write('* LSUB (\\HasNoChildren) "/" "INBOX"\r\n');
        this.#write(`${this.#request.id} OK LSUB completed\r\n`);
    }

    #login(){
        if(this.#options.onAuth && typeof this.#options.onAuth == 'function'){
            if(this.#commands[2].startsWith('"') && this.#commands[2].endsWith('"')) this.#commands[2] = this.#commands[2].substr(1, this.#commands[2].length - 2);
            if(this.#commands[3].startsWith('"') && this.#commands[3].endsWith('"')) this.#commands[3] = this.#commands[3].substr(1, this.#commands[3].length - 2);
            this.#options.onAuth({
                username: this.#commands[2],
                password: this.#commands[3]
            }, this.#commands, (err, result) => {
                if(err){
                    this.#write(`${this.#request.id} NO Authentication failed\r\n`);
                    this.#auth = false;
                } else {
                    this.#write(`${this.#request.id} OK Authentication successful\r\n`);
                    this.#auth = this.#commands[2];
                }
            });
        } else {
            this.#write(`${this.#request.id} NO Authentication failed\r\n`);
            this.#auth = false;
        }
    }

    #logout(){
        this.#write('* BYE IMAP4rev1 Server logging out\r\n');
        this.#write(`${this.#request.id} OK LOGOUT completed\r\n`);
        this.#socket.end();
    }

    #noop(){
        this.#write(`${this.#request.id} OK NOOP completed\r\n`);
    }

    #prepare(requests, data){
        data.attachments = data.attachments ? JSON.parse(data.attachments) : [];
        for(let request of requests){
            if(typeof data.headerLines === 'string') data.headerLines = JSON.parse(data.headerLines);
            let boundary = data.headerLines.find((line) => line.key.toLowerCase() == 'content-type');
            if(boundary) boundary = boundary.line.replace(/"/g, '').split('boundary=')[1];
            if(!boundary) boundary = 'boundary' + data.id;
            switch(request.value){
                case 'BODY':
                    let body = { keys: '', header: '', content: '' };
                    for(let obj of request.fields.length ? request.fields : [{value: 'HEADER'}, {value: 'TEXT'}]){
                        let fields = obj.fields ? obj.fields.map((field) => field.value.toLowerCase()) : [];
                        if(request.fields.length) body.keys += obj.value + (obj.peek ? '.' + obj.peek : '');
                        if(fields.length > 0) body.keys += ' (';
                        if(obj.value == 'HEADER'){
                            for(let line of data.headerLines){
                                let include = true;
                                if(obj.peek) if(obj.peek == 'FIELDS')     include =  fields.includes(line.key);
                                        else if(obj.peek == 'FIELDS.NOT') include = !fields.includes(line.key);
                                if(include){
                                    if(fields.length > 0) body.keys += line.key + ' ';
                                    if(line.key.toLowerCase() == 'content-type'){
                                        if(data.html && data.html.length > 1 && data.text && data.text.length > 1){
                                            body.header += 'Content-Type: multipart/alternative; boundary="' + boundary + '_alt"\r\n';
                                        } else if(!data.text || data.text.length < 1){
                                            body.header += 'Content-Type: text/html; charset=utf-8\r\n';
                                        } else if(!data.html || data.html.length < 1){
                                            body.header += 'Content-Type: text/plain; charset=utf-8\r\n';
                                        }
                                    } else body.header += line.line + '\r\n';
                                }
                            }
                            if((obj.peek ?? '') !== 'FIELDS.NOT'){
                                for(let field of fields){
                                    if(!data.headerLines.find((line) => line.key == field)){
                                        if(fields.length > 0) body.keys += field + ' ';
                                        // if(field.toLowerCase() == 'content-type'){
                                        //     if(data.html && data.html.length > 1 && data.text && data.text.length > 1){
                                        //         body.header += 'Content-Type: multipart/alternative; boundary="boundary' + data.id + '"\r\n';
                                        //     } else if(!data.text || data.text.length < 1){
                                        //         body.header += 'Content-Type: text/html; charset=utf-8\r\n';
                                        //     } else if(!data.html || data.html.length < 1){
                                        //         body.header += 'Content-Type: text/plain; charset=utf-8\r\n';
                                        //     }
                                        // }
                                        else body.header += field + ': \r\n';
                                    }
                                }
                            }
                            body.header = body.header.trim();
                            if(fields.length > 0) body.keys = body.keys.trim() + ')';
                        } else if(obj.value == 'TEXT'){
                            if(body.header.length) body.content += body.header + '\r\n\r\n';
                            if(data.html.length > 1 || data.attachments.length){
                                if(data.attachments.length > 1){
                                    body.content += '--' + boundary + '\r\n';
                                    body.content += 'Content-Type: multipart/alternative; boundary="' + boundary + '_alt"\r\n';
                                }
                                if(data.text && data.text.length > 1){
                                    body.content += '\r\n--' + boundary + '_alt\r\n';
                                    body.content += 'Content-Type: text/plain; charset=utf-8\r\n';
                                    body.content += 'Content-Transfer-Encoding: quoted-printable\r\n\r\n';
                                    body.content += data.text;
                                    body.content += '\r\n--' + boundary + '_alt\r\n';
                                }
                                if(data.html.length > 1){
                                    if(data.text && data.text.length > 1){
                                        body.content += 'Content-Type: text/html; charset=utf-8\r\n';
                                        body.content += 'Content-Transfer-Encoding: quoted-printable\r\n\r\n';
                                    }
                                    body.content += data.html;
                                    if(data.text && data.text.length > 1) body.content += '\r\n--' + boundary + '_alt--\r\n';
                                }
                                for (let attachment of data.attachments) {
                                    body.content += '\r\n--' + boundary + '\r\n';
                                    body.content += 'Content-Type: ' + attachment.contentType + '; name="' + attachment.filename + '"\r\n';
                                    body.content += 'Content-Transfer-Encoding: base64\r\n';
                                    body.content += 'Content-Disposition: attachment; filename="' + attachment.filename + '"\r\n\r\n';
                                    body.content += Buffer.from(attachment.content.data).toString('base64');
                                    body.content += '\r\n--' + boundary + '\r\n';
                                }
                                if(data.attachments.length > 1) body.content += '--' + boundary + '--\r\n';
                            } else body.content += data.text;
                        } else if(!isNaN(obj.value)){
                            obj.value = parseInt(obj.value);
                            if(obj.value === 1 || (obj.value === 2 && !data.attachments.length)){
                                if(obj.peek === 2 || obj.value === 2) body.content += data.html;
                                else body.content += data.text;
                            } else if(obj.value > 1 && data.attachments[obj.value - 2]) body.content += Buffer.from(data.attachments[obj.value - 2].content.data).toString('base64') + '\r\n';
                        }
                    }
                    if(body.content == '') body.content = body.header;
                    body.content = body.content.replace(/\r\n/g, '\n');
                    this.#write('BODY[' + body.keys + '] {' + (body.content.length) + '}\r\n');
                    this.#write(body.content);
                    break;
                case 'BODYSTRUCTURE':
                    let structure = '';
                    if(data.text && data.text.length > 1 && data.html && data.html.length > 1) structure += '(';
                    if(data.text && data.text.length)     structure += '("TEXT" "PLAIN" ("CHARSET" "UTF-8") NIL NIL "QUOTED-PRINTABLE" ' + Buffer.byteLength(data.text, 'utf8') + ' ' + data.text.split('\n').length + ' NIL NIL NIL NIL)';
                    if(data.html && data.html.length > 1) structure += '("TEXT" "HTML"  ("CHARSET" "UTF-8") NIL NIL "QUOTED-PRINTABLE" ' + Buffer.byteLength(data.html, 'utf8') + ' ' + data.html.split('\n').length + ')';
                    if(data.text && data.text.length && data.html && data.html.length > 1) structure += ' "ALTERNATIVE" ("BOUNDARY" "' + boundary + '_alt") NIL NIL NIL';
                    if(data.text && data.text.length > 1 && data.html && data.html.length > 1) structure += ')';
                    for (let attachment of data.attachments) structure += '("APPLICATION" "' + attachment.contentType.split('/')[1].toUpperCase() + '" ("NAME" "' + attachment.filename + '") NIL NIL "BASE64" ' + Buffer.from(attachment.content.data).toString('base64').length + ' NIL ("ATTACHMENT" ("FILENAME" "' + attachment.filename + '")) NIL NIL)';
                    if(data.attachments.length) structure += ' "MIXED" ("BOUNDARY" "' + boundary + '") NIL NIL NIL';
                    this.#write('BODYSTRUCTURE ' + structure);
                    break;
                case 'ENVELOPE':
                    let envelope = '';
                    let from = JSON.parse(data.from);
                    envelope += '"' + data.date + '" ';
                    envelope += '"' + data.subject + '" ';
                    envelope += '"<' + from.value.address + '>" ';
                    this.#write('ENVELOPE (' + envelope + ') ');
                    break;
                case 'INTERNALDATE':
                    let date = new Date(data.date);
                    this.#write('INTERNALDATE "' + date.toUTCString() + '" ');
                    break;
                case 'FLAGS':
                    let flags = []
                    try{
                        flags = data.flags ? JSON.parse(data.flags) : [];
                    } catch(e) {
                        console.error('Error parsing flags', data.flags);
                    }
                    flags = flags.map((flag) => "\\" + flag);
                    this.#write('FLAGS (' + flags.join(' ') + ') ');
                    break;
                case 'RFC822':
                    this.#write('RFC822.SIZE ' + data.html.length + ' ');
                    break;
                case 'UID':
                    this.#write('UID ' + data.uid + ' ');
                    break;
            }
        }
    }

    #select(){
        if(!this.#auth) return this.#write(`${this.#request.id} NO Authentication required\r\n`);
        if(!this.#options.onSelect || typeof this.#options.onSelect != 'function') return this.#write(`${this.#request.id} NO SELECT failed\r\n`);
        let box = this.#commands[2];
        if(box.startsWith('"') && box.endsWith('"')) box = box.substr(1, box.length - 2);
        if(!this.#boxes.includes(box)) return this.#write(`${this.#request.id} NO Mailbox not found\r\n`);
        this.#box = box;
        this.#options.onSelect({address: this.#auth, mailbox: this.#box}, this.#options, (data) => {
            this.#write('* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)\r\n');
            this.#write('* OK [PERMANENTFLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft \\*)] Flags permitted\r\n');
            this.#write('* ' + ((data.uidnext ?? 1) - 1) + ' EXISTS\r\n');
            this.#write('* ' + (data.recent ?? data.unseen) + ' RECENT\r\n');
            this.#write('* OK [UNSEEN ' + (data.unseen ?? 0) + '] Message ' + (data.unseen ?? 0) + ' is first unseen\r\n');
            this.#write('* OK [UIDVALIDITY ' + 123456789 + '] UIDs valid\r\n');
            this.#write('* OK [UIDNEXT ' + (data.uidnext ?? 1) + '] Predicted next UID\r\n');
            this.#write(`${this.#request.id} OK [READ-WRITE] SELECT completed\r\n`);
        });
    }

    #status(){
        if(!this.#auth) return this.#write(`${this.#request.id} NO Authentication required\r\n`);
        if(!this.#options.onSelect || typeof this.#options.onSelect != 'function') return this.#write(`${this.#request.id} NO STATUS failed\r\n`);
        let mailbox = this.#commands[2];
        let fields = this.#commands.slice(3).map((field) => field.toUpperCase().replace('(', '').replace(')', ''));
        if(fields.length === 0) fields = ['MESSAGES', 'RECENT', 'UIDNEXT', 'UIDVALIDITY', 'UNSEEN'];
        this.#options.onSelect({address: this.#auth, mailbox: mailbox}, this.#options, (data) => {
            if(data.exists && !data.messages) data.messages = data.exists;
            this.#write('* STATUS ' + mailbox + ' (');
            for(let field of fields) if(data[field.toLowerCase()] !== undefined) this.#write(field.toUpperCase() + ' ' + (data[field.toLowerCase()] ?? 0) + ' ');
            this.#write(')\r\n');
            this.#write(`${this.#request.id} OK STATUS completed\r\n`);
        });
    }

    #store(){
        let uids = this.#request.uid.split(',');
        for(let field of this.#request.requests){
            switch (field.value) {
                case '+FLAGS':
                    let flags = field.fields.map((flag) => flag.value.replace('\\', '').toLowerCase())
                    this.#options.onStore({address: this.#auth, uids: uids, flags: flags}, this.#options, (data) => {
                        if(field.peek !== 'SILENT') for(let uid of uids) this.#write('* ' + uid + ' FETCH (FLAGS (' + data.flags.join(' ') + '))\r\n');
                        this.#write(`${this.#request.id} OK STORE completed\r\n`);
                    });
                    break;
            }
        }
    }

    #uid(){
        this.#commands.splice(1,1);
        if(this.#commands[1] == 'STORE') return this.#store();
        let data = this.#commands.slice(3).join(' ');
        if(data.substr(0,1) == '(' && data.substr(-1) == ')') data = data.substr(1,data.length - 2)
        data = data.split(" ");
        data.splice(0, 0, "UID");
        this.#content = this.#export(data);
        this.#fetch();
    }

    #write(data){
        log('mail', 'imap', data);
        if(!this.#end) this.#socket.write(data);
    }
}

module.exports = Connection;