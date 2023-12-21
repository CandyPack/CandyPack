'use strict';
const http = require(`http`);
const https = require(`https`);
const fs = require(`fs`);
const config = require(`${dir}/config.js`);

// const options = {
//     key:  fs.readFileSync(`${dir}/${config.cert.key}`),
//     cert: fs.readFileSync(`${dir}/${config.cert.cert}`)
// };

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
        http.createServer(Candy.Route.request).listen(parseInt(args[0]));
        // https.createServer(options, Candy.Route.request).listen(443);
    }
};