const dns = require('native-dns');
const axios = require('axios');

const Config = require('./Config');

var server = dns.createServer();
var loaded = false;
var ip = '127.0.0.1';

function publish(){
    if(loaded || !Object.keys(Config.get('websites') ?? []).length) return;
    loaded = true;
    server.on('request', function (request, response) {
        response.question[0].name = response.question[0].name.toLowerCase();
        let domain = response.question[0].name;
        while(!Config.get('websites',domain) && domain.includes('.')) domain = domain.split('.').slice(1).join('.');
        if(!Config.get('websites',domain)) return response.send();
        for(const record of Config.get('websites',domain,'DNS','A') ?? []){
            if(record.name != response.question[0].name) continue;
            response.answer.push(dns.A({
                name: record.name,
                address: record.value ?? ip,
                ttl: record.ttl ?? 3600,
            }));
        }
        for(const record of Config.get('websites',domain,'DNS','CNAME') ?? []){
            if(record.name != response.question[0].name) continue;
            response.answer.push(dns.CNAME({
                name: record.name,
                data: record.value,
                ttl: record.ttl ?? 3600,
            }));
        }
        for(const record of Config.get('websites',domain,'DNS','TXT') ?? []){
            if(!record || record.name != response.question[0].name) continue;
            response.answer.push(dns.TXT({
                name: record.name,
                data: [record.value],
                ttl: record.ttl ?? 3600,
            }));
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