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

function set(type, url, file, options = {}){
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
        Candy.Route.routes[Candy.Route.buff][type][url].token = options.token ?? true;
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

module.exports = {
    routes: {},
    init: function(){
        init();
        setInterval(init, 1000);
    },
    request: async function(req, res){
        let id = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        let param = Candy.instance(id, req, res);
        let url = req.url.split('?')[0];
        if(url.substr(-1) === '/') url = url.substr(0, url.length - 1);
        let type = req.method.toLowerCase();
        if(!Candy.Route.routes[param.Request.route]) return res.end();
        let result = null;
        let page = '';
        if(param.Request.url                      == '/'
        && param.Request.method                   == 'GET'
        && param.Request.header('X-Candy')        == 'token'
        && param.Request.header('Referer')        == (param.Request.ssl ? 'https://' : 'http://') + param.Request.host + '/'
        && param.Request.header('X-Candy-Client') == param.Request.cookie('candy_client')){
            param.Request.header('Access-Control-Allow-Origin', (param.Request.ssl ? 'https://' : 'http://') + param.Request.host);
            param.Request.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            return param.Request.end({
                token: param.token(),
                page : Candy.Route.routes[param.Request.route]['page'][url].file || Candy.Route.routes[param.Request.route].error[404].file || ''
            });
        } else if(Candy.Route.routes[param.Request.route][type] && Candy.Route.routes[param.Request.route][type][url]){
            param.Request.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            if(['post', 'get'].includes(type)
            && Candy.Route.routes[param.Request.route][type][url].token
            && (!(await param.Request.request('token'))
            || !param.token(await param.Request.request('token')))) return param.Request.abort(401);
            if(typeof Candy.Route.routes[param.Request.route][type][url].cache === 'function')
            result = await Candy.Route.routes[param.Request.route][type][url].cache(param);
        } else if(Candy.Route.routes[param.Request.route]['page'] && Candy.Route.routes[param.Request.route]['page'][url] && typeof Candy.Route.routes[param.Request.route]['page'][url].cache === 'function'){
            page = Candy.Route.routes[param.Request.route]['page'][url].file
            param.cookie('candy_data', {candy: { page: page, token: param.token()}}, {expires: null, httpOnly: false});
            result = await Candy.Route.routes[param.Request.route]['page'][url].cache(param);
        } else if(url && !url.includes('/../') && fs.existsSync(`${__dir}/public${url}`)){
            let stat = fs.lstatSync(`${__dir}/public${url}`);
            if(!stat.isFile()) return param.Request.abort(404);
            result = fs.readFileSync(`${__dir}/public${url}`);
            let type = 'text/html';
            if(url.includes('.')){
                let arr = url.split('.');
                type = mime[arr[arr.length - 1]];
            }

            param.Request.header('Content-Type',   type);
            param.Request.header('Cache-Control',  'public, max-age=31536000');
            param.Request.header('Content-Length', stat.size);

            return param.Request.end(result);
        } else param.Request.abort(404);
        if(result) param.Request.end(result);
        param.Request.print(param);
        param.View.print(param);
        delete param;
    },
    page: function(path, file){
        set('page', path, file);
    },
    post: function(path, file, options){
        set('post', path, file, options);
    },
    get: function(path, file, options){
        set('get', path, file, options);
    },
    authPage: function(path, authFile, file){
        if(authFile) set('authPage', path, authFile);
        if(file) this.page(path, file);
    },
    authPost: function(path, authFile, file, options){
        if(authFile) set('authPost', path, authFile);
        if(file) this.post(path, file);
    },
    authGet: function(path, authFile, file, options){
        if(authFile) set('authGet', path, authFile);
        if(file) this.get(path, file);
    },
    error: function(code, file){
        set('error', code, file);
    }
};
