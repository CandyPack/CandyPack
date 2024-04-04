const { Console } = require('console');
const fs = require('fs');

var loading = false;
var routes = {};
const mime = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpg',
    'jpeg': 'image/jpeg',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'eot': 'font/eot',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'txt': 'text/plain',
    'log': 'text/plain',
    'csv': 'text/csv',
    'xml': 'text/xml',
    'rss': 'application/rss+xml',
    'atom': 'application/atom+xml',
    'yaml': 'application/x-yaml',
    'sh': 'application/x-sh',
    'bat': 'application/x-bat',
    'exe': 'application/x-exe',
    'bin': 'application/x-binary',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'avi': 'video/x-msvideo',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'weba': 'audio/webm',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'midi': 'audio/midi',
}

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
        Candy.Route.routes[Candy.Route.buff][type][url].loaded = routes[Candy.Route.buff];
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
        Candy.Route.routes[Candy.Route.buff][type][url].path = path;
        Candy.Route.routes[Candy.Route.buff][type][url].loaded = routes[Candy.Route.buff];
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
        if(!routes[Candy.Route.buff] || routes[Candy.Route.buff] < mtime){
            delete require.cache[require.resolve(`${__dir}/route/${file}`)];
            routes[Candy.Route.buff] = mtime;
            require(`${__dir}/route/${file}`);
        }
        for(const type of ['page', 'post', 'get', 'error']){
            if(!Candy.Route.routes[Candy.Route.buff]) continue;
            if(!Candy.Route.routes[Candy.Route.buff][type]) continue;
            for (const route in Candy.Route.routes[Candy.Route.buff][type]) {
                if(routes[Candy.Route.buff] > Candy.Route.routes[Candy.Route.buff][type][route].loaded){
                    delete require.cache[require.resolve(Candy.Route.routes[Candy.Route.buff][type][route].path)];
                    delete Candy.Route.routes[Candy.Route.buff][type][route];
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
    return {
        Config  : require('./Config.js'),
        Mysql   : require('./Mysql.js'),
        Request : new (require('./Request.js'))(req, res, id),
        Route   : require('./Route.js'),
        Server  : require('./Server.js'),
        View    : new (require('./View.js'))(),
        Var     : require('./Var.js'),

        // shortcuts
        cookie  : function(key, value){ return this.Request.cookie(key, value) },
        return  : function(data)      { return this.Request.end(data)          },
        var     : function(value)     { return this.Var.init(value);           },
    };
}

module.exports = {
    routes: {},
    init: function(){
        init();
        setInterval(init, 1000);
    },
    request: async function(req, res){
        let id = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        let param = params(req, res, id);
        let route = req.headers.host.split('.')[0];
        let url = req.url.split('?')[0];
        if(url.substr(-1) === '/') url = url.substr(0, url.length - 1);
        let type = req.method.toLowerCase();
        if(!Candy.Route.routes[route]) route = 'www';
        if(!Candy.Route.routes[route]) return res.end();
        let result = null;
        let page = '';
        let t = setTimeout(function(){
            if(!res.finished){
                param.Request.status(408);
                param.Request.header('Content-Type', 'text/html');
                param.Request.end();
            }
        }, Candy.Config.request.timeout);
        if(Candy.Route.routes[route][type] && Candy.Route.routes[route][type][url]){
            result = await Candy.Route.routes[route][type][url].cache(param);
        } else if(Candy.Route.routes[route]['page'] && Candy.Route.routes[route]['page'][url] && typeof Candy.Route.routes[route]['page'][url].cache === 'function'){
            page = Candy.Route.routes[route]['page'][url].file
            result = await Candy.Route.routes[route]['page'][url].cache(param);
        } else if(url && !url.includes('/../') && fs.existsSync(`${__dir}/public${url}`) && fs.lstatSync(`${__dir}/public${url}`).isFile()){
            result = fs.readFileSync(`${__dir}/public${url}`);
            let type = 'text/html';
            if(url.includes('.')){
                let arr = url.split('.');
                type = mime[arr[arr.length - 1]];
            }
            param.Request.header('Content-Type', type);
            param.Request.end(result);
        } else if(Candy.Route.routes[route].error && Candy.Route.routes[route].error[404]){
            param.Request.status(404);
            result = await Candy.Route.routes[route].error[404].cache(param);
        } else {
            result = '404 Not Found';
            param.Request.header('Content-Type', 'text/html');
            param.Request.status(404);
            param.return(result);
        }
        if(result){
            if(typeof result === 'object'){
                result = JSON.stringify(result);
                param.Request.header('Content-Type', 'application/json');
            } else {
                param.Request.header('Content-Type', 'text/html');
                param.Request.header('Set-Cookie', 'candy=' + JSON.stringify({ page: page }));
            }
        }
        param.Request.print(param);
        param.View.print(param);
        delete param;
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
    authPage: function(path, authFile, file){
        set('authPage', path, authFile);
        if(file) this.page(path, file);
    },
    authPost: function(path, authFile, file){
        set('authPost', path, authFile);
        if(file) this.post(path, file);
    },
    authGet: function(path, authFile, file){
        set('authGet', path, authFile);
        if(file) this.get(path, file);
    },
    error: function(code, file){
        set('error', code, file);
    }
};
