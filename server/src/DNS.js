
class DNS {
    
    #ip = '127.0.0.1';
    #loaded = false;
    #server;
    #types = ['A', 'CNAME', 'TXT'];

    add(domain, type, value){
        if(!Candy.config.websites[domain]) return false;
        if(!this.#types.includes(type)) return false;
        if(!Candy.config.websites[domain].DNS[type]) Candy.config.websites[domain].DNS[type] = [];
        Candy.config.websites[domain].DNS[type].push(value);
        return true;
    }

    init(){
        if(!Candy.config.DNS) Candy.config.DNS = {};
        this.#server = Candy.ext.dns.createServer();
        Candy.ext.axios.get('https://curlmyip.org/').then(function(res){
            this.#ip = res.data.replace('\n', '');
        }).catch(function(err){
            console.log(err);
        });
        this.#publish();
    }

    #publish(){
        if(this.#loaded || !Object.keys(Candy.config.websites ?? []).length) return;
        this.#loaded = true;
        this.#server.on('request', (request, response) => {
            response.question[0].name = response.question[0].name.toLowerCase();
            let domain = response.question[0].name;
            while(!Candy.config.websites[domain] && domain.includes('.')) domain = domain.split('.').slice(1).join('.');
            if(!Candy.config.websites[domain]) return response.send();
            for(const record of Candy.config.websites[domain].DNS.A ?? []){
                if(record.name != response.question[0].name) continue;
                response.answer.push(Candy.ext.dns.A({
                    name: record.name,
                    address: record.value ?? this.#ip,
                    ttl: record.ttl ?? 3600,
                }));
            }
            for(const record of Candy.config.websites[domain].DNS.CNAME ?? []){
                if(record.name != response.question[0].name) continue;
                response.answer.push(Candy.ext.dns.CNAME({
                    name: record.name,
                    data: record.value,
                    ttl: record.ttl ?? 3600,
                }));
            }
            for(const record of Candy.config.websites[domain].DNS.TXT ?? []){
                if(!record || record.name != response.question[0].name) continue;
                response.answer.push(Candy.ext.dns.TXT({
                    name: record.name,
                    data: [record.value],
                    ttl: record.ttl ?? 3600,
                }));
            }
            response.send();
        });
        this.#server.on('error', function (err, buff, req, res) {
            console.log(err.stack);
        });
        this.#server.serve(53);
    }
}

module.exports = new DNS();