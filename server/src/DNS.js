const dns = require('native-dns');
const axios = require('axios');

const Config = require('./Config');

var server = dns.createServer();
var loaded = false;
var ip = '127.0.0.1';

function publish(){
    if(loaded || !Object.keys(Config.get('websites')).length) return;
    loaded = true;
    server.on('request', function (request, response) {
        if(Config.get('websites')[request.question[0].name] && Config.get('websites')[request.question[0].name].dns){
            console.log(Config.get('websites')[request.question[0].name].dns);
            for (const record of Config.get('websites')[request.question[0].name].dns) {
                switch(record.type){
                    case 'A':
                        response.answer.push(dns.A({
                          name: record.name,
                          address: record.value ?? ip,
                          ttl: 3600,
                        }));
                        break;
                    case 'TXT':
                        response.answer.push(dns.TXT({
                          name: record.name,
                          data: record.value,
                          ttl: 3600,
                        }));
                        break;            
                }
            }
        }
        response.send();
    });
    server.on('error', function (err, buff, req, res) {
        console.log(err.stack);
    });
    server.serve(53);
}

module.exports = {
    init: function(){
        axios.get('https://curlmyip.org/').then(function(res){
            ip = res.data.replace('\n', '');
        }).catch(function(err){
            console.log(err);
        });
        publish();
    }

};