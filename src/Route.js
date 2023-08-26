const fs = require('fs');

module.exports = {
    routes: {},
    init: function(){
        fs.readdirSync(`${dir}/route/`).forEach(file => {
            Candy.Route.buff = file.replace('.js', '');
            require(`${dir}/route/${file}`).init
        });
        delete Candy.Route.buff;
    },
    request: function(req, res){
        let route = req.headers.host.split('.')[0];
        let url = req.url.split('?')[0];
        if(url.substr(-1) === '/') url = url.substr(0, url.length - 1);
        if(Candy.Route.routes[route]){
            if(Candy.Route.routes[route].page[url]) Candy.Route.routes[route].page[url](req, res);
            else res.end('no');
        } else if(Candy.Route.routes['www']){
            Candy.Route.routes['www'].request(req, res);
        } else {
            res.end();
        }
    },
    page: function(path, file){
        if(path.substr(-1) === '/') path = path.substr(0, path.length - 1);
        if(!Candy.Route.routes[Candy.Route.buff]) Candy.Route.routes[Candy.Route.buff] = {};
        if(!Candy.Route.routes[Candy.Route.buff].page) Candy.Route.routes[Candy.Route.buff].page = {};
        if(fs.existsSync(`${dir}/controller/page/${file}.js`)) Candy.Route.routes[Candy.Route.buff].page[path] = require(`${dir}/controller/page/${file}.js`);
    }
};
