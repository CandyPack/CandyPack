const { Console } = require('console');
const fs = require('fs');

var loading = false;
var reload = 0;
var routes = {};

function set(type, url, file){
    if(typeof url != 'string') url.toString();
    if(url.length && url.substr(-1) === '/') url = url.substr(0, url.length - 1);
    let path = `${__dir}/route/${Candy.Route.buff}.js`;
    if(typeof file !== 'function'){
        path = `${__dir}/controller/${type}/${file}.js`;
        if(file.includes('.')){
            let arr = file.split('.');
            path = `${__dir}/controller/${arr[0]}/${type}/${arr.slice(1).join('.')}.js`;
        }
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
        Candy.Route.routes[Candy.Route.buff][type][url].cache = typeof file === 'function' ? file : require(path);
        Candy.Route.routes[Candy.Route.buff][type][url].type = typeof file === 'function' ? 'function' : 'controller';
        Candy.Route.routes[Candy.Route.buff][type][url].file = file;
        Candy.Route.routes[Candy.Route.buff][type][url].mtime = fs.statSync(path).mtimeMs;
        Candy.Route.routes[Candy.Route.buff][type][url].reload = reload;
        Candy.Route.routes[Candy.Route.buff][type][url].path = path;
    }
}

function init(){
    if(loading) return;
    loading = true;
    for(const file of fs.readdirSync(`${__dir}/controller/`)){
        if(file.substr(-3) !== '.js') continue;
        let name = file.replace('.js', '');
        if(!Candy.Route.class) Candy.Route.class = {};
        if(Candy.Route.class[name]){
            if(Candy.Route.class[name].mtime >= fs.statSync(Candy.Route.class[name].path).mtimeMs) continue;
            delete global[name];
            delete require.cache[require.resolve(Candy.Route.class[name].path)];
        }
        if(global[name]) continue;
        Candy.Route.class[name] = {
            path: `${__dir}/controller/${file}`,
            mtime: fs.statSync(`${__dir}/controller/${file}`).mtimeMs
        };
        global[name] = require(Candy.Route.class[name].path);
    }
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
                    if(typeof Candy.Route.routes[Candy.Route.buff][type][route].type === 'function') continue;
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

function params(req, res, id){
    let _candy = { req: req, res: res };
    _candy.return = function(data){
        if(typeof data === 'object'){
            data = JSON.stringify(data);
            this.res.writeHead(200, { 'Content-Type': 'application/json' });
        }
        if(!res.finished) this.res.end(data);
    }
    for (const iterator of Object.keys(Candy)) _candy[iterator] = Candy[iterator];
    return _candy;
}

module.exports = {
    routes: {},
    init: function(){
        init();
        setInterval(init, 1000);
    },
    request: async function(req, res){
        let id = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        let route = req.headers.host.split('.')[0];
        let url = req.url.split('?')[0];
        if(url.substr(-1) === '/') url = url.substr(0, url.length - 1);
        let type = req.method.toLowerCase();
        if(!Candy.Route.routes[route]) route = 'www';
        if(!Candy.Route.routes[route]) return res.end();
        let result = null;
        let status = 200;
        let param = params(req, res, id);
        let t = setTimeout(() => {
            if(!res.finished){
                res.writeHead(408, { 'Content-Type': 'text/html' });
                res.end();
            }
        }, Candy.Config.request.timeout);
        if(Candy.Route.routes[route][type] && Candy.Route.routes[route][type][url]){
            status = 200;
            result = await Candy.Route.routes[route][type][url].cache(param);
        } else if(Candy.Route.routes[route]['page'] && Candy.Route.routes[route]['page'][url]){
            status = 200;
            result = await Candy.Route.routes[route]['page'][url].cache(param);
        } else if(Candy.Route.routes[route].error && Candy.Route.routes[route].error[404]){
            status = 404;
            result = await Candy.Route.routes[route].error[404].cache(param);
        }
        delete param;
        if(result){
            if(typeof result === 'object'){
                result = JSON.stringify(result);
                res.writeHead(status, { 'Content-Type': 'application/json' });
            } else {
                res.writeHead(status, { 'Content-Type': 'text/html' });
            }
        } else if(status !== 200){
            res.writeHead(status, { 'Content-Type': 'text/html' });
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
