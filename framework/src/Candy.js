module.exports = {
    init: function(){
        global.Candy = this.instance();
        global.Candy.Config.init();
        global.Candy.Mysql.init();
        global.Candy.Route.init();
        global.Candy.Server.init();
        global.Candy.instance = this.instance;
        global.__ = (value) => { return value };
    },

    instance(id, req, res){
        let _candy = {};

        _candy.Config  = require('./Config.js');
        _candy.Mysql   = require('./Mysql.js');
        _candy.Route   = global.Candy?.Route ?? new (require('./Route.js'))();
        _candy.Server  = require('./Server.js');

        _candy.var     = function(value) { return new (require('./Var.js'))(value) };

        if(req && res){
            _candy.Request   = new (require('./Request.js')) (id, req, res, _candy);
            _candy.Auth      = new (require('./Auth.js'))    (_candy.Request);
            _candy.Token     = new (require('./Token.js'))   (_candy.Request);
            _candy.View      = new (require('./View.js'))    (_candy.Request);
            _candy.Lang      = new (require('./Lang.js'))    (_candy);

            _candy.__        = function(value)              { return _candy.Lang.get(value)                                    };
            _candy.abort     = function(code)               { return _candy.Request.abort(code)                                };
            _candy.cookie    = function(key, value, options){ return _candy.Request.cookie(key, value, options)                };
            _candy.redirect  = function(url)                { return _candy.Request.redirect(url)                              };
            _candy.return    = function(data)               { return _candy.Request.end(data)                                  };
            _candy.request   = function(key)                { return _candy.Request.request(key)                               };
            _candy.set       = function(key, value)         { return _candy.Request.set(key, value)                            };
            _candy.token     = function(hash)               { return hash ? _candy.Token.check(hash) : _candy.Token.generate() };
            _candy.validator = function()                   { return new (require('./Validator.js'))(_candy.Request)           };
            _candy.write     = function(value)              { return _candy.Request.write(value)                               };
        }

        return _candy;
    }
}