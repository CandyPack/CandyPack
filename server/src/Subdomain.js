class Subdomain {

    create(subdomain){
        let domain = subdomain.split('.');
        subdomain = subdomain.trim().split('.');
        if(subdomain.length < 3) return Candy.Api.result(false, __('Invalid subdomain name.'));
        if(Candy.config.websites[domain.join('.')]) return Candy.Api.result(false, __('Domain %s already exists.', domain.join('.')));
        while(domain.length > 2){
            domain.shift();
            if(Candy.config.websites[domain.join('.')]){
                domain = domain.join('.');
                break;
            }
        }
        if(typeof domain == 'object') return Candy.Api.result(false, __('Domain %s not found.', domain.join('.')));
        subdomain = subdomain.join('.').substr(0, subdomain.join('.').length - domain.length - 1);
        let fulldomain = [subdomain, domain].join('.');
        if(Candy.config.websites[domain].subdomain.includes(subdomain)) return Candy.Api.result(false, __('Subdomain %s already exists.', fulldomain));
        Candy.DNS.record({name: fulldomain,          type: 'A'},
                         {name: 'www.' + fulldomain, type: 'CNAME'},
                         {name: fulldomain,          type: 'MX'});
        let websites = Candy.config.websites;
        websites[domain].subdomain.push(subdomain);
        websites[domain].subdomain.push("www." + subdomain);
        websites[domain].subdomain.sort();
        Candy.config.websites = websites;
        Candy.SSL.renew(domain);
        return Candy.Api.result(true, __('Subdomain %s created successfully for domain %s.', fulldomain, domain));
    }

    list(domain){
        if(!Candy.config.websites[domain]) return Candy.Api.result(false, __('Domain %s not found.', domain));
        let subdomains = Candy.config.websites[domain].subdomain.map((subdomain) => { return subdomain + '.' + domain; });
        return Candy.Api.result(true, __('Subdomains of %s:', domain) + '\n  ' + subdomains.join('\n  '));
    }

}

module.exports = new Subdomain();