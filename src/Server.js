'use strict';
const http = require(`http`);
const https = require(`https`);
const fs = require(`fs`);
const config = require(`${dir}/config.js`);

const options = {
    key:  fs.readFileSync(`${dir}/${config.cert.key}`),
    cert: fs.readFileSync(`${dir}/${config.cert.cert}`)
};

module.exports = {
    init: function(){
        http.createServer(Candy.Route.request).listen(80);
        https.createServer(options, Candy.Route.request).listen(443);
    }
};