const SMTPServer = require("smtp-server").SMTPServer;
const parser = require("mailparser").simpleParser

class Mail{
    #server;

    init(){
        console.log("Mail server started")
        this.#server = new SMTPServer({
            onData(stream, session, callback) {
              parser(stream, {}, (err, parsed) => {
                if (err) console.log("Error:" , err)
                console.log(parsed)
                stream.on("end", callback)
              })
            },
            disabledCommands: ['AUTH']
        });
        this.#server.listen(25, "0.0.0.0")
    }
}

module.exports = new Mail();