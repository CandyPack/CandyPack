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
        _candy.Route   = require('./Route.js');
        _candy.Server  = require('./Server.js');

        _candy.var     = function(value) { return new (require('./Var.js'))(value) };

        if(req && res){
            _candy.Request   = new (require('./Request.js'))  (id, req, res);
            _candy.Token     = new (require('./Token.js'))    (_candy.Request);
            _candy.Validator = new (require('./Validator.js'))(_candy.Request);
            _candy.View      = new (require('./View.js'))     (_candy.Request);

            _candy.cookie    = function(key, value){ return _candy.Request.cookie(key, value)                         };
            _candy.return    = function(data)      { return _candy.Request.end(data)                                  };
            _candy.request   = function(key)       { return _candy.Request.request(key)                               };
            _candy.token     = function(hash)      { return hash ? _candy.Token.check(hash) : _candy.Token.generate() };
            _candy.validator = function()          { return _candy.Validator                                          };
            _candy.write     = function(value)     { return _candy.Request.write(value)                               };
        }

        return _candy;
    }
}