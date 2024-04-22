'use strict';
const http = require(`http`);

module.exports = {
    init: function(){
        let args = process.argv.slice(2);
        if(!args[0]){
            console.log(`CandyPack Server requires a port.`);
            process.exit(0);
        }
        let port = parseInt(args[0]);
        if(!port){
            console.log(`CandyPack Server requires a port.`);
            process.exit(0);
        }
        http.createServer(Candy.Route.request).listen(port);
    }
};