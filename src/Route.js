const fs = require('fs');

var loading = false;
var reload = 0;
var routes = {};

function set(type, url, file){
    if(url.substr(-1) === '/') url = url.substr(0, url.length - 1);
    let path = `${__dir}/controller/${type}/${file}.js`;
    if(file.includes('.')){
        let arr = file.split('.');
        path = `${__dir}/controller/${arr[0]}/${type}/${arr.slice(1).join('.')}.js`;
    }
    if(!Candy.Route.routes[Candy.Route.buff]) Candy.Route.routes[Candy.Route.buff] = {};
    if(!Candy.Route.routes[Candy.Route.buff][type]) Candy.Route.routes[Candy.Route.buff][type] = {};
    if(Candy.Route.routes[Candy.Route.buff][type][url]){
        Candy.Route.routes[Candy.Route.buff][type][url].reload = reload;
        if(Candy.Route.routes[Candy.Route.buff][type][url].mtime < fs.statSync(path).mtimeMs){
            delete Candy.Route.routes[Candy.Route.buff][type][url];
            delete require.cache[require.resolve(path)];
        } else return;
    }
    if(fs.existsSync(path)){
        if(!Candy.Route.routes[Candy.Route.buff][type][url]) Candy.Route.routes[Candy.Route.buff][type][url] = {};
        Candy.Route.routes[Candy.Route.buff][type][url].cache = require(path);
        Candy.Route.routes[Candy.Route.buff][type][url].file = file;
        Candy.Route.routes[Candy.Route.buff][type][url].mtime = fs.statSync(path).mtimeMs;
        Candy.Route.routes[Candy.Route.buff][type][url].reload = reload;
        Candy.Route.routes[Candy.Route.buff][type][url].path = path;
    }
}

function init(){
    if(loading) return;
    loading = true;
    let dir = fs.readdirSync(`${__dir}/route/`);
    for(const file of dir){
        if(file.substr(-3) !== '.js') continue;
        let mtime = fs.statSync(`${__dir}/route/${file}`).mtimeMs;
        Candy.Route.buff = file.replace('.js', '');
        if(!routes[file] || routes[file] < mtime){
            delete require.cache[require.resolve(`${__dir}/route/${file}`)];
            reload++;
            routes[file] = mtime;
            require(`${__dir}/route/${file}`);
        }
        for(const type of ['page', 'post', 'get', 'error']){
            if(!Candy.Route.routes[Candy.Route.buff]) continue;
            if(!Candy.Route.routes[Candy.Route.buff][type]) continue;
            for (const route in Candy.Route.routes[Candy.Route.buff][type]) {
                if(Candy.Route.routes[Candy.Route.buff][type][route].reload !== reload){
                    delete Candy.Route.routes[Candy.Route.buff][type][route];
                    delete require.cache[require.resolve(`${__dir}/controller/page/${route}.js`)];
                } else if(Candy.Route.routes[Candy.Route.buff][type][route]){
                    if(Candy.Route.routes[Candy.Route.buff][type][route].mtime < fs.statSync(Candy.Route.routes[Candy.Route.buff][type][route].path).mtimeMs){
                        set(type, route, Candy.Route.routes[Candy.Route.buff][type][route].file);
                    }
                }
            }
        }
        delete Candy.Route.buff;
    }
    loading = false;
}

module.exports = {
    routes: {},
    init: function(){
        init();
        setInterval(init, 1000);
    },
    request: function(req, res){
        let route = req.headers.host.split('.')[0];
        let url = req.url.split('?')[0];
        if(url.substr(-1) === '/') url = url.substr(0, url.length - 1);
        let type = req.method.toLowerCase();
        console.log(route, type, url);
        if(Candy.Route.routes[route]){
            if(Candy.Route.routes[route][type] && Candy.Route.routes[route][type][url]) Candy.Route.routes[route][type][url].cache(req, res);
            else res.end('no');
        } else if(Candy.Route.routes['www']){
            if(Candy.Route.routes['www'][type] && Candy.Route.routes['www'][type][url]) Candy.Route.routes['www'][type][url].cache(req, res);
            else res.end('no');
        } else {
            res.end();
        }
    },
    page: function(path, file){
        set('page', path, file);
    },
    post: function(path, file){
        set('post', path, file);
    },
    get: function(path, file){
        set('get', path, file);
    },
    error: function(code, file){
        set('error', code, file);
    }
};
